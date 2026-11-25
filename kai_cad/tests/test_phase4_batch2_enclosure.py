"""Unit, MCP integration, OpenSCAD STL export, and trimesh compatibility tests
for Phase 4 Batch 2 (`enclosure_base` and `enclosure_lid`).
"""

from __future__ import annotations

import copy
import json
import math
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_cad import (
    EnclosureBaseSpec,
    EnclosureLidSpec,
    GeometryValidationError,
    KaiCadMcpService,
    generate_component,
    generate_enclosure_base,
    generate_enclosure_lid,
    resolve_openscad_binary,
)

try:
    import trimesh

    TRIMESH_AVAILABLE = True
except ImportError:
    TRIMESH_AVAILABLE = False

OPENSCAD_BIN = resolve_openscad_binary()
EXAMPLES_DIR = ROOT / "kai_cad" / "examples"
MESH_BBOX_TOL_MM = 0.05


class TestEnclosureBaseUnit(unittest.TestCase):
    def _basic(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "enclosure_base_basic.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def _electronics(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "enclosure_base_electronics.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def test_valid_basic_and_electronics_enclosure_and_determinism(self) -> None:
        basic = generate_component("enclosure_base", self._basic())
        self.assertEqual(basic.spec.length_mm, 100.0)
        self.assertEqual(basic.spec.width_mm, 70.0)
        self.assertEqual(basic.spec.height_mm, 35.0)
        self.assertAlmostEqual(basic.effective_dimensions.cavity_length_mm, 96.0)
        self.assertAlmostEqual(basic.effective_dimensions.cavity_width_mm, 66.0)
        self.assertAlmostEqual(basic.effective_dimensions.cavity_depth_mm, 32.5)
        self.assertEqual(basic.effective_dimensions.boss_centers_xy_mm, ())

        payload = self._electronics(
            cable_openings=[
                {"wall": "front", "shape": "rectangular", "width_mm": 12.0, "height_mm": 6.5, "offset_mm": 0.0, "center_z_mm": 12.0},
                {"wall": "right", "shape": "circular", "diameter_mm": 8.0, "offset_mm": 5.0, "center_z_mm": 15.0},
                {"wall": "back", "shape": "circular", "diameter_mm": 6.0, "offset_mm": -10.0, "center_z_mm": 14.0},
                {"wall": "left", "shape": "rectangular", "width_mm": 10.0, "height_mm": 5.0, "offset_mm": 0.0, "center_z_mm": 12.0},
            ]
        )
        snap = copy.deepcopy(payload)
        res1 = generate_enclosure_base(payload)
        res2 = generate_component("enclosure_base", payload)

        self.assertEqual(payload, snap)
        self.assertEqual(res1.spec_sha256, res2.spec_sha256)
        self.assertEqual(res1.scad_sha256, res2.scad_sha256)
        self.assertEqual(len(res1.effective_dimensions.boss_centers_xy_mm), 4)
        self.assertEqual(
            res1.effective_dimensions.boss_centers_xy_mm,
            ((-41.0, -26.0), (41.0, -26.0), (-41.0, 26.0), (41.0, 26.0)),
        )
        self.assertEqual(len(res1.effective_dimensions.cable_openings), 4)
        self.assertIn("wall_thickness_mm      = 2;", res1.scad_source)
        self.assertIn("floor_thickness_mm     = 2.5;", res1.scad_source)

    def test_invalid_dimensions_wall_floor_and_types(self) -> None:
        for req in ("length_mm", "width_mm", "height_mm", "wall_thickness_mm", "floor_thickness_mm"):
            with self.subTest(missing=req):
                p = self._basic()
                del p[req]
                with self.assertRaises(GeometryValidationError) as ctx:
                    generate_enclosure_base(p)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == req for i in ctx.exception.issues))

        bad_cases = [
            {"unknown_key": 1},
            {"units": "inches"},
            {"length_mm": "100"},
            {"length_mm": True},
            {"boss_count": True},
            {"width_mm": math.nan},
            {"height_mm": math.inf},
            {"corner_radius_mm": -math.inf},
            {"wall_thickness_mm": 0.0},
            {"wall_thickness_mm": 0.1},  # < 0.2 mm MIN_WALL_THICKNESS_MM
            {"floor_thickness_mm": 0.1},
            {"wall_thickness_mm": 35.0},  # 2 * 35 >= width 70
            {"floor_thickness_mm": 35.0},  # floor >= height 35
            {"corner_radius_mm": 35.0},  # >= width / 2
            {"corner_radius_mm": -1.0},
        ]
        for overrides in bad_cases:
            with self.subTest(overrides=overrides):
                with self.assertRaises(GeometryValidationError):
                    generate_enclosure_base(self._basic(**overrides))

    def test_boss_validation_rules(self) -> None:
        # Invalid boss_count (3)
        with self.assertRaises(GeometryValidationError) as ctx_cnt:
            generate_enclosure_base(self._electronics(boss_count=3))
        self.assertTrue(any(i.code == "INVALID_BOSS_COUNT" for i in ctx_cnt.exception.issues))

        # Unused boss params when boss_count == 0
        with self.assertRaises(GeometryValidationError) as ctx_un:
            generate_enclosure_base(self._basic(boss_outer_diameter_mm=6.0))
        self.assertTrue(any(i.code == "UNUSED_BOSS_PARAMETER" for i in ctx_un.exception.issues))

        # Boss hole >= boss OD
        with self.assertRaises(GeometryValidationError) as ctx_id:
            generate_enclosure_base(self._electronics(boss_outer_diameter_mm=6.0, boss_hole_diameter_mm=6.0))
        self.assertTrue(any(i.code == "BORE_EXCEEDS_OUTER_DIAMETER" for i in ctx_id.exception.issues))

        # Boss hole breaches outer wall (wall=2.0, offset_x=3.0, hole_d=3.0 -> r_hole=1.5, cav_margin=1.0 < 1.5!)
        with self.assertRaises(GeometryValidationError) as ctx_bw:
            generate_enclosure_base(self._electronics(boss_offset_x_mm=3.0))
        self.assertTrue(any(i.code == "BOSS_HOLE_BREACHES_WALL" for i in ctx_bw.exception.issues))

        # Valid 2-boss centerline configuration
        two_boss = generate_enclosure_base(
            self._basic(
                boss_count=2,
                boss_outer_diameter_mm=7.0,
                boss_hole_diameter_mm=3.0,
                boss_offset_x_mm=8.0,
            )
        )
        self.assertEqual(two_boss.effective_dimensions.boss_centers_xy_mm, ((-42.0, 0.0), (42.0, 0.0)))

    def test_cable_opening_validation_rules(self) -> None:
        bad_openings = [
            # Invalid wall
            [{"wall": "top", "shape": "circular", "diameter_mm": 6.0, "center_z_mm": 12.0}],
            # Invalid shape
            [{"wall": "front", "shape": "hex", "diameter_mm": 6.0, "center_z_mm": 12.0}],
            # Unknown field inside opening
            [{"wall": "front", "shape": "circular", "diameter_mm": 6.0, "center_z_mm": 12.0, "chamfer": 1.0}],
            # Boolean supplied as numeric inside opening
            [{"wall": "front", "shape": "circular", "diameter_mm": True, "center_z_mm": 12.0}],
            # Circular opening with rectangular width_mm field
            [{"wall": "front", "shape": "circular", "diameter_mm": 6.0, "width_mm": 6.0, "center_z_mm": 12.0}],
            # Rectangular opening missing height_mm
            [{"wall": "front", "shape": "rectangular", "width_mm": 10.0, "center_z_mm": 12.0}],
            # Opening breaches floor (floor=2.5, center_z=4.0, diameter=4.0 -> bottom=2.0 < 2.5)
            [{"wall": "front", "shape": "circular", "diameter_mm": 4.0, "center_z_mm": 4.0}],
            # Opening breaches top rim (height=35.0, center_z=33.0, diameter=5.0 -> top=35.5 > 35.0)
            [{"wall": "front", "shape": "circular", "diameter_mm": 5.0, "center_z_mm": 33.0}],
            # Opening exceeds lateral flat wall zone (length=100, corner_r=4 -> flat +/-46; offset=42 + w/2=6 = 48 > 46)
            [{"wall": "front", "shape": "rectangular", "width_mm": 12.0, "height_mm": 6.0, "offset_mm": 42.0, "center_z_mm": 15.0}],
            # Two overlapping openings on the same wall
            [
                {"wall": "front", "shape": "circular", "diameter_mm": 8.0, "offset_mm": 0.0, "center_z_mm": 15.0},
                {"wall": "front", "shape": "circular", "diameter_mm": 8.0, "offset_mm": 5.0, "center_z_mm": 15.0},
            ],
        ]
        for ops in bad_openings:
            with self.subTest(cable_openings=ops):
                with self.assertRaises(GeometryValidationError):
                    generate_enclosure_base(self._electronics(cable_openings=ops))

        # Opening intersecting a wall-adjacent corner boss
        with self.assertRaises(GeometryValidationError) as ctx_boss:
            generate_enclosure_base(
                self._electronics(
                    boss_offset_x_mm=10.0,
                    boss_offset_y_mm=6.0,  # front boss outer edge at -35 + 6 - 4 = -33 (touches front inner wall at -33!)
                    cable_openings=[
                        {"wall": "front", "shape": "rectangular", "width_mm": 10.0, "height_mm": 8.0, "offset_mm": 40.0, "center_z_mm": 15.0}
                    ],
                )
            )
        self.assertTrue(any(i.code == "OPENING_INTERSECTS_BOSS" for i in ctx_boss.exception.issues))


class TestEnclosureLidUnit(unittest.TestCase):
    def _compatible_lid(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "enclosure_lid_compatible.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def test_valid_flat_and_skirted_lid_and_boss_alignment(self) -> None:
        # Minimal flat lid (no skirt, no screw holes)
        flat = generate_component(
            "enclosure_lid",
            {"length_mm": 100.0, "width_mm": 70.0, "lid_thickness_mm": 2.5},
        )
        self.assertEqual(flat.effective_dimensions.skirt_depth_mm, 0.0)
        self.assertEqual(flat.effective_dimensions.total_height_mm, 2.5)
        self.assertEqual(flat.effective_dimensions.screw_hole_centers_xy_mm, ())

        # Compatible skirted lid with 4 screw holes aligned with Example 2 base bosses
        base_res = generate_enclosure_base(
            json.loads((EXAMPLES_DIR / "enclosure_base_electronics.example.json").read_text(encoding="utf-8"))
        )
        lid_payload = self._compatible_lid(corner_radius_mm=4.0)
        snap = copy.deepcopy(lid_payload)
        lid_res = generate_enclosure_lid(lid_payload)
        lid_res2 = generate_component("enclosure_lid", lid_payload)

        self.assertEqual(lid_payload, snap)
        self.assertEqual(lid_res.spec_sha256, lid_res2.spec_sha256)
        self.assertEqual(lid_res.scad_sha256, lid_res2.scad_sha256)

        # Exact screw-hole <-> base boss center alignment
        self.assertEqual(
            lid_res.effective_dimensions.screw_hole_centers_xy_mm,
            base_res.effective_dimensions.boss_centers_xy_mm,
        )
        # Skirt outer dimensions = cavity (96 x 66) - 2 * skirt_clearance (0.4) = 95.6 x 65.6 mm
        self.assertAlmostEqual(lid_res.effective_dimensions.skirt_outer_length_mm, 95.6)
        self.assertAlmostEqual(lid_res.effective_dimensions.skirt_outer_width_mm, 65.6)
        self.assertAlmostEqual(lid_res.effective_dimensions.total_height_mm, 5.5)

    def test_invalid_lid_skirt_clearances_and_screw_holes(self) -> None:
        for req in ("length_mm", "width_mm", "lid_thickness_mm"):
            with self.subTest(missing=req):
                p = {"length_mm": 100.0, "width_mm": 70.0, "lid_thickness_mm": 2.5}
                del p[req]
                with self.assertRaises(GeometryValidationError) as ctx:
                    generate_enclosure_lid(p)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == req for i in ctx.exception.issues))

        # Skirt depth > 0 without wall_thickness_mm must NOT invent wall thickness!
        with self.assertRaises(GeometryValidationError) as ctx_mw:
            generate_enclosure_lid(
                {"length_mm": 100.0, "width_mm": 70.0, "lid_thickness_mm": 2.5, "skirt_depth_mm": 3.0, "skirt_thickness_mm": 1.5}
            )
        self.assertTrue(any(i.code == "MISSING_SKIRT_PARAMETER" and i.field == "wall_thickness_mm" for i in ctx_mw.exception.issues))

        # Unused skirt parameters when skirt_depth_mm == 0
        with self.assertRaises(GeometryValidationError) as ctx_us:
            generate_enclosure_lid(
                {"length_mm": 100.0, "width_mm": 70.0, "lid_thickness_mm": 2.5, "skirt_clearance_mm": 0.2}
            )
        self.assertTrue(any(i.code == "UNUSED_SKIRT_PARAMETER" for i in ctx_us.exception.issues))

        # Negative skirt clearance
        with self.assertRaises(GeometryValidationError):
            generate_enclosure_lid(self._compatible_lid(skirt_clearance_mm=-0.1))

        # Screw holes colliding with downward locating skirt (boss_offset_x_mm=3.5 puts hole right inside skirt ring [2.2, 3.8]!)
        with self.assertRaises(GeometryValidationError) as ctx_sk:
            generate_enclosure_lid(self._compatible_lid(boss_offset_x_mm=3.5))
        self.assertTrue(any(i.code == "SCREW_HOLE_INTERSECTS_SKIRT" for i in ctx_sk.exception.issues))

        # Unknown / bool / NaN / Inf
        for bad in (
            {"extra": 1},
            {"lid_thickness_mm": True},
            {"length_mm": math.nan},
            {"skirt_depth_mm": math.inf},
            {"units": "cm"},
        ):
            with self.subTest(bad=bad):
                with self.assertRaises(GeometryValidationError):
                    generate_enclosure_lid(self._compatible_lid(**bad))


@unittest.skipUnless(OPENSCAD_BIN is not None, "OpenSCAD CLI is required for STL export & mesh compatibility tests.")
class TestEnclosureMcpOpenScadAndMeshCompatibility(unittest.TestCase):
    def test_mcp_workflow_mesh_verification_and_base_lid_assembly_fit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)

            # 1. Example 1 — Basic enclosure
            ex1_spec = json.loads((EXAMPLES_DIR / "enclosure_base_basic.example.json").read_text(encoding="utf-8"))
            # 2. Example 2 — Electronics enclosure (rounded corners + 4 blind bosses + 2 cable openings)
            ex2_spec = json.loads((EXAMPLES_DIR / "enclosure_base_electronics.example.json").read_text(encoding="utf-8"))
            ex2_spec["cable_openings"].append(
                {"wall": "right", "shape": "circular", "diameter_mm": 8.0, "offset_mm": 0.0, "center_z_mm": 18.0}
            )
            # 3. Example 3 — Compatible lid (matching Example 1 square corners) & rounded variant matching Example 2
            ex3_spec = json.loads((EXAMPLES_DIR / "enclosure_lid_compatible.example.json").read_text(encoding="utf-8"))
            ex3_rounded = dict(ex3_spec, name="enclosure_lid_rounded_100x70", corner_radius_mm=4.0)

            designs = [
                ("enclosure_base", "enc-basic-01", ex1_spec, [100.0, 70.0, 35.0], 0),  # 0 wall holes, blind cavity -> genus 0 (euler 2)
                ("enclosure_base", "enc-elec-02", ex2_spec, [100.0, 70.0, 35.0], 2),   # 4 BLIND bosses + 2 through-wall openings -> genus 2 (euler -2)
                ("enclosure_lid", "enc-lid-03", ex3_spec, [100.0, 70.0, 5.5], 4),      # 4 through screw holes -> genus 4 (euler -6)
                ("enclosure_lid", "enc-lid-rnd-04", ex3_rounded, [100.0, 70.0, 5.5], 4),
            ]

            meshes = {}
            for comp_type, did, spec, expected_ext, expected_genus in designs:
                with self.subTest(design_id=did):
                    gen = svc.cad_generate_design(comp_type, spec, design_id=did)
                    self.assertTrue(gen["ok"], msg=str(gen))
                    val = svc.cad_validate_design(did)
                    self.assertTrue(val["ok"], msg=str(val))
                    exp = svc.cad_export_stl(did)
                    self.assertTrue(exp["ok"], msg=str(exp))
                    self.assertEqual(exp["state"], "Exported")
                    self.assertGreater(exp["stl_size_bytes"], 0)

                    art = svc.cad_get_design_artifact(did, "stl")
                    self.assertTrue(art["ok"] and art["exists"])

                    if TRIMESH_AVAILABLE:
                        mesh = trimesh.load_mesh(art["path"], file_type="stl")
                        meshes[did] = mesh
                        self.assertTrue(mesh.is_watertight, f"{did} not watertight")
                        self.assertTrue(mesh.is_winding_consistent, f"{did} winding inconsistent")
                        self.assertTrue(mesh.is_volume, f"{did} not a valid volume")
                        self.assertGreater(float(mesh.volume), 0.0)
                        self.assertEqual(len(mesh.split(only_watertight=False)), 1, f"{did} disconnected solid")

                        for idx, (act, exp_v) in enumerate(zip(mesh.extents, expected_ext)):
                            self.assertAlmostEqual(float(act), exp_v, delta=MESH_BBOX_TOL_MM)

                        expected_euler = 2 - (2 * expected_genus)
                        self.assertEqual(
                            int(mesh.euler_number),
                            expected_euler,
                            f"{did} euler={mesh.euler_number} != {expected_euler}",
                        )

            # Verify base/lid assembly compatibility on Example 2 + rounded compatible lid
            if TRIMESH_AVAILABLE:
                base_m = meshes["enc-elec-02"]
                lid_m = meshes["enc-lid-rnd-04"].copy()
                # Check lid Z bounds before translation: [-3.0, +2.5]
                self.assertAlmostEqual(float(lid_m.bounds[0][2]), -3.0, delta=1e-3)
                self.assertAlmostEqual(float(lid_m.bounds[1][2]), 2.5, delta=1e-3)

                # Translate lid onto base top rim (Z = +35.0 mm) and take horizontal cross-section at mid-skirt Z = 33.5 mm
                lid_m.apply_translation([0.0, 0.0, 35.0])
                base_slice = base_m.section(plane_origin=[0.0, 0.0, 33.5], plane_normal=[0.0, 0.0, 1.0])
                lid_slice = lid_m.section(plane_origin=[0.0, 0.0, 33.5], plane_normal=[0.0, 0.0, 1.0])
                self.assertIsNotNone(base_slice)
                self.assertIsNotNone(lid_slice)
                # Lid skirt outer extent at Z=33.5 is 95.6 x 65.6 mm, strictly inside 96.0 x 66.0 mm cavity
                lid_xy_ext = lid_slice.bounds[1][:2] - lid_slice.bounds[0][:2]
                self.assertAlmostEqual(float(lid_xy_ext[0]), 95.6, delta=MESH_BBOX_TOL_MM)
                self.assertAlmostEqual(float(lid_xy_ext[1]), 65.6, delta=MESH_BBOX_TOL_MM)

            # Verify persistence across fresh repository reload
            reloaded = KaiCadMcpService(workspace_root=tmp)
            listed = reloaded.cad_list_designs(state="Exported")
            self.assertEqual(listed["count"], 4)
            for _, did, _, _, _ in designs:
                rec = reloaded.cad_get_design(did)
                self.assertTrue(rec["ok"])
                self.assertEqual(rec["state"], "Exported")


if __name__ == "__main__":
    unittest.main()
