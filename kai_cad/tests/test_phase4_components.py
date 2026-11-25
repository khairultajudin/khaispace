"""Comprehensive unit, MCP integration, OpenSCAD STL export, and trimesh verification tests
for Phase 4 Batch 1 components (`rectangular_block`, `mounting_bracket`, `spacer_bushing`).
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
    GeometryValidationError,
    KaiCadMcpService,
    MountingBracketSpec,
    RectangularBlockSpec,
    SUPPORTED_COMPONENTS,
    SpacerBushingSpec,
    UnsupportedComponentError,
    generate_component,
    generate_mounting_bracket,
    generate_rectangular_block,
    generate_spacer_bushing,
    resolve_openscad_binary,
    validate_component_spec,
)

try:
    import trimesh

    TRIMESH_AVAILABLE = True
except ImportError:
    TRIMESH_AVAILABLE = False

OPENSCAD_BIN = resolve_openscad_binary()
EXAMPLES_DIR = ROOT / "kai_cad" / "examples"

# Numerical tolerance (mm) for discretized OpenSCAD circle/cylinder meshes at fn >= 64
MESH_BBOX_TOL_MM = 0.05


class TestComponentRegistryDispatch(unittest.TestCase):
    def test_supported_components_and_dispatch(self) -> None:
        self.assertEqual(
            SUPPORTED_COMPONENTS,
            ("custom_adapter", "rectangular_block", "mounting_bracket", "spacer_bushing"),
        )
        with self.assertRaises(UnsupportedComponentError):
            validate_component_spec("worm_gear", {})
        with self.assertRaises(UnsupportedComponentError):
            generate_component("enclosure_box", {})


class TestRectangularBlock(unittest.TestCase):
    def _minimal(self, **overrides):
        base = {"length_mm": 60.0, "width_mm": 40.0, "height_mm": 5.0}
        base.update(overrides)
        return base

    def _complete(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "rectangular_block.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def test_valid_minimal_and_complete_and_determinism(self) -> None:
        min_res = generate_component("rectangular_block", self._minimal())
        self.assertEqual(min_res.spec.length_mm, 60.0)
        self.assertEqual(min_res.spec.width_mm, 40.0)
        self.assertEqual(min_res.spec.height_mm, 5.0)
        self.assertEqual(min_res.effective_dimensions.hole_centers_xy_mm, ())
        self.assertIn("square([length, width], center = true);", min_res.scad_source)

        payload = self._complete()
        snap = copy.deepcopy(payload)
        res1 = generate_rectangular_block(payload)
        res2 = generate_component("rectangular_block", payload)

        # Nominal values preserved verbatim; input dict untouched; deterministic hashes
        self.assertEqual(payload, snap)
        self.assertEqual(res1.spec.hole_diameter_mm, 4.2)
        self.assertAlmostEqual(res1.effective_dimensions.effective_hole_diameter_mm, 4.4)
        self.assertEqual(len(res1.effective_dimensions.hole_centers_xy_mm), 4)
        self.assertEqual(res1.spec_sha256, res2.spec_sha256)
        self.assertEqual(res1.scad_sha256, res2.scad_sha256)
        self.assertIn("hole_diameter_mm  = 4.2;", res1.scad_source)

    def test_missing_unknown_wrong_type_bool_nan_inf_negative_zero(self) -> None:
        for req in ("length_mm", "width_mm", "height_mm"):
            with self.subTest(missing=req):
                p = self._minimal()
                del p[req]
                with self.assertRaises(GeometryValidationError) as ctx:
                    generate_rectangular_block(p)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == req for i in ctx.exception.issues))

        bad_inputs = [
            {"unknown_field": 1.0},
            {"units": "cm"},
            {"length_mm": "60"},
            {"hole_count_x": 2.5},
            {"length_mm": True},
            {"hole_count_x": True},
            {"width_mm": math.nan},
            {"height_mm": math.inf},
            {"corner_radius_mm": -math.inf},
            {"length_mm": 0.0},
            {"width_mm": -10.0},
            {"corner_radius_mm": -1.0},
            {"hole_diameter_mm": -2.0},
            {"clearance_mm": -0.1},
        ]
        for overrides in bad_inputs:
            with self.subTest(overrides=overrides):
                with self.assertRaises(GeometryValidationError):
                    generate_rectangular_block(self._minimal(**overrides))

    def test_invalid_geometry_boundary_and_clearance_conditions(self) -> None:
        # Corner radius >= half shorter side (40 / 2 = 20)
        with self.assertRaises(GeometryValidationError) as ctx_cr:
            generate_rectangular_block(self._minimal(corner_radius_mm=20.0))
        self.assertTrue(any(i.code == "INVALID_CORNER_RADIUS" for i in ctx_cr.exception.issues))

        # Incomplete hole config (diameter > 0 but count_y == 0)
        with self.assertRaises(GeometryValidationError) as ctx_hc:
            generate_rectangular_block(self._minimal(hole_diameter_mm=4.0, hole_count_x=2, hole_count_y=0))
        self.assertTrue(any(i.code == "INVALID_HOLE_CONFIGURATION" for i in ctx_hc.exception.issues))

        # Clearance > 0 without holes rejected (never silently ignored)
        with self.assertRaises(GeometryValidationError) as ctx_cl:
            generate_rectangular_block(self._minimal(clearance_mm=0.2))
        self.assertTrue(any(i.code == "CLEARANCE_WITHOUT_MATING_HOLES" for i in ctx_cl.exception.issues))

        # Hole spacing exceeds block boundary
        with self.assertRaises(GeometryValidationError) as ctx_hb:
            generate_rectangular_block(
                self._minimal(
                    hole_diameter_mm=6.0,
                    hole_count_x=2,
                    hole_count_y=1,
                    hole_spacing_x_mm=56.0,  # margin = 2.0 < hole radius 3.0!
                )
            )
        self.assertTrue(any(i.code == "HOLE_OUTSIDE_BOUNDARY" for i in ctx_hb.exception.issues))

        # Clearance pushes hole wall below minimum 0.2 mm ligament
        with self.assertRaises(GeometryValidationError) as ctx_wall:
            generate_rectangular_block(
                self._minimal(
                    hole_diameter_mm=5.4,
                    hole_count_x=2,
                    hole_count_y=1,
                    hole_spacing_x_mm=54.0,  # margin = 3.0; nominal r=2.7 (wall 0.3 ok), with clr=0.2 -> r=2.9 (wall 0.1 < 0.2!)
                    clearance_mm=0.2,
                )
            )
        self.assertTrue(any(i.code == "INSUFFICIENT_WALL_THICKNESS" for i in ctx_wall.exception.issues))

        # Hole breaches rounded corner arc even though clear of straight X/Y walls
        with self.assertRaises(GeometryValidationError) as ctx_rc:
            generate_rectangular_block(
                self._minimal(
                    corner_radius_mm=15.0,
                    hole_diameter_mm=6.0,
                    hole_count_x=2,
                    hole_count_y=2,
                    hole_spacing_x_mm=50.0,
                    hole_spacing_y_mm=30.0,
                )
            )
        self.assertTrue(any(i.code == "HOLE_OUTSIDE_BOUNDARY" for i in ctx_rc.exception.issues))

        # Conflicting spacing + edge_margin
        with self.assertRaises(GeometryValidationError) as ctx_cf:
            generate_rectangular_block(
                self._minimal(
                    hole_diameter_mm=4.0,
                    hole_count_x=2,
                    hole_count_y=1,
                    hole_spacing_x_mm=30.0,
                    edge_margin_x_mm=10.0,  # 30 + 20 = 50 != 60!
                )
            )
        self.assertTrue(any(i.code == "CONFLICTING_HOLE_LAYOUT" for i in ctx_cf.exception.issues))


class TestMountingBracket(unittest.TestCase):
    def _minimal(self, **overrides):
        base = {
            "base_length_mm": 60.0,
            "base_width_mm": 40.0,
            "vertical_height_mm": 40.0,
            "thickness_mm": 5.0,
        }
        base.update(overrides)
        return base

    def _complete(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "mounting_bracket.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def test_valid_minimal_and_complete_and_determinism(self) -> None:
        min_res = generate_component("mounting_bracket", self._minimal())
        self.assertEqual(min_res.spec.base_length_mm, 60.0)
        self.assertEqual(min_res.spec.thickness_mm, 5.0)
        self.assertEqual(min_res.effective_dimensions.base_pattern_y.coordinates_mm, ())

        payload = self._complete()
        snap = copy.deepcopy(payload)
        res1 = generate_mounting_bracket(payload)
        res2 = generate_component("mounting_bracket", payload)
        self.assertEqual(payload, snap)
        self.assertEqual(res1.spec.base_hole_diameter_mm, 4.2)
        self.assertAlmostEqual(res1.effective_dimensions.effective_base_hole_diameter_mm, 4.4)
        self.assertAlmostEqual(res1.effective_dimensions.base_hole_x_mm, (5.0 + 3.0 + 60.0) / 2.0)
        self.assertEqual(res1.spec_sha256, res2.spec_sha256)
        self.assertEqual(res1.scad_sha256, res2.scad_sha256)
        self.assertIn("base_length_mm            = 60;", res1.scad_source)

    def test_missing_unknown_wrong_type_bool_nan_inf_negative_zero(self) -> None:
        for req in ("base_length_mm", "base_width_mm", "vertical_height_mm", "thickness_mm"):
            with self.subTest(missing=req):
                p = self._minimal()
                del p[req]
                with self.assertRaises(GeometryValidationError) as ctx:
                    generate_mounting_bracket(p)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == req for i in ctx.exception.issues))

        bad_inputs = [
            {"extra_key": 10},
            {"units": "inch"},
            {"base_length_mm": "60"},
            {"base_hole_count": 1.5},
            {"thickness_mm": False},
            {"vertical_hole_count": True},
            {"base_width_mm": math.nan},
            {"vertical_height_mm": math.inf},
            {"inside_corner_radius_mm": -math.inf},
            {"thickness_mm": 0.0},
            {"base_length_mm": -20.0},
            {"inside_corner_radius_mm": -2.0},
            {"clearance_mm": -0.05},
        ]
        for overrides in bad_inputs:
            with self.subTest(overrides=overrides):
                with self.assertRaises(GeometryValidationError):
                    generate_mounting_bracket(self._minimal(**overrides))

    def test_invalid_geometry_boundary_and_clearance_conditions(self) -> None:
        # Thickness >= leg length
        with self.assertRaises(GeometryValidationError) as ctx_th:
            generate_mounting_bracket(self._minimal(thickness_mm=40.0))
        self.assertTrue(any(i.code == "INVALID_BRACKET_GEOMETRY" for i in ctx_th.exception.issues))

        # Inside corner radius consumes entire vertical leg
        with self.assertRaises(GeometryValidationError) as ctx_ir:
            generate_mounting_bracket(self._minimal(inside_corner_radius_mm=35.0))
        self.assertTrue(any(i.code == "INVALID_CORNER_RADIUS" for i in ctx_ir.exception.issues))

        # Base hole too large for clear flat shelf
        with self.assertRaises(GeometryValidationError) as ctx_sh:
            generate_mounting_bracket(
                self._minimal(base_length_mm=15.0, thickness_mm=5.0, inside_corner_radius_mm=4.0, base_hole_diameter_mm=8.0, base_hole_count=1)
            )
        self.assertTrue(any(i.code == "HOLE_OUTSIDE_BOUNDARY" for i in ctx_sh.exception.issues))

        # Adjacent vertical holes overlap across Y width
        with self.assertRaises(GeometryValidationError) as ctx_ov:
            generate_mounting_bracket(
                self._minimal(vertical_hole_diameter_mm=10.0, vertical_hole_count=2, vertical_hole_spacing_mm=9.0)
            )
        self.assertTrue(any(i.code == "INSUFFICIENT_WALL_THICKNESS" for i in ctx_ov.exception.issues))

        # Clearance without holes rejected
        with self.assertRaises(GeometryValidationError) as ctx_cl:
            generate_mounting_bracket(self._minimal(clearance_mm=0.1))
        self.assertTrue(any(i.code == "CLEARANCE_WITHOUT_MATING_HOLES" for i in ctx_cl.exception.issues))


class TestSpacerBushing(unittest.TestCase):
    def _minimal(self, **overrides):
        base = {"outer_diameter_mm": 20.0, "inner_diameter_mm": 10.0, "height_mm": 8.0}
        base.update(overrides)
        return base

    def _complete(self, **overrides):
        base = json.loads((EXAMPLES_DIR / "spacer_bushing.example.json").read_text(encoding="utf-8"))
        base.update(overrides)
        return base

    def test_valid_minimal_and_complete_and_determinism(self) -> None:
        min_res = generate_component("spacer_bushing", self._minimal())
        self.assertEqual(min_res.spec.outer_diameter_mm, 20.0)
        self.assertEqual(min_res.spec.inner_diameter_mm, 10.0)
        self.assertEqual(min_res.spec.height_mm, 8.0)

        payload = self._complete()
        snap = copy.deepcopy(payload)
        res1 = generate_spacer_bushing(payload)
        res2 = generate_component("spacer_bushing", payload)
        self.assertEqual(payload, snap)
        self.assertEqual(res1.spec.outer_diameter_mm, 20.0)
        self.assertAlmostEqual(res1.effective_dimensions.outer_diameter_mm, 19.8)
        self.assertAlmostEqual(res1.effective_dimensions.inner_diameter_mm, 10.2)
        self.assertEqual(res1.spec_sha256, res2.spec_sha256)
        self.assertEqual(res1.scad_sha256, res2.scad_sha256)
        self.assertIn("outer_diameter_mm = 20;", res1.scad_source)
        self.assertIn("inner_diameter_mm = 10;", res1.scad_source)

    def test_missing_unknown_wrong_type_bool_nan_inf_negative_zero(self) -> None:
        for req in ("outer_diameter_mm", "inner_diameter_mm", "height_mm"):
            with self.subTest(missing=req):
                p = self._minimal()
                del p[req]
                with self.assertRaises(GeometryValidationError) as ctx:
                    generate_spacer_bushing(p)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == req for i in ctx.exception.issues))

        bad_inputs = [
            {"unknown": 1},
            {"units": "m"},
            {"outer_diameter_mm": "20"},
            {"outer_diameter_mm": True},
            {"fn": False},
            {"inner_diameter_mm": math.nan},
            {"height_mm": math.inf},
            {"top_chamfer_mm": -math.inf},
            {"inner_diameter_mm": 0.0},  # Spacer requires continuous through-hole > 0
            {"outer_diameter_mm": -10.0},
            {"height_mm": 0.0},
            {"top_chamfer_mm": -0.5},
            {"bottom_chamfer_mm": -0.5},
            {"clearance_mm": -0.1},
        ]
        for overrides in bad_inputs:
            with self.subTest(overrides=overrides):
                with self.assertRaises(GeometryValidationError):
                    generate_spacer_bushing(self._minimal(**overrides))

    def test_invalid_geometry_boundary_and_clearance_conditions(self) -> None:
        # Inner diameter >= outer diameter
        with self.assertRaises(GeometryValidationError) as ctx_id:
            generate_spacer_bushing(self._minimal(inner_diameter_mm=20.0))
        self.assertTrue(any(i.code == "BORE_EXCEEDS_OUTER_DIAMETER" for i in ctx_id.exception.issues))

        # Clearance reduces radial wall below 0.2 mm
        with self.assertRaises(GeometryValidationError) as ctx_wall:
            generate_spacer_bushing(self._minimal(outer_diameter_mm=11.0, inner_diameter_mm=10.0, clearance_mm=0.2))
        self.assertTrue(any(i.code == "INSUFFICIENT_WALL_THICKNESS" for i in ctx_wall.exception.issues))

        # Top + bottom chamfers >= height
        with self.assertRaises(GeometryValidationError) as ctx_ch_h:
            generate_spacer_bushing(self._minimal(height_mm=4.0, top_chamfer_mm=2.0, bottom_chamfer_mm=2.0))
        self.assertTrue(any(i.code == "CHAMFER_EXCEEDS_HEIGHT" for i in ctx_ch_h.exception.issues))

        # Chamfer >= radial wall thickness ((20 - 10)/2 = 5.0)
        with self.assertRaises(GeometryValidationError) as ctx_ch_w:
            generate_spacer_bushing(self._minimal(top_chamfer_mm=5.0))
        self.assertTrue(any(i.code == "CHAMFER_EXCEEDS_WALL_THICKNESS" for i in ctx_ch_w.exception.issues))


@unittest.skipUnless(OPENSCAD_BIN is not None, "OpenSCAD CLI is required for real STL export & mesh verification tests.")
class TestPhase4McpOpenScadAndMeshIntegration(unittest.TestCase):
    def test_all_four_components_mcp_workflow_reload_and_mesh_topology(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)

            cases = [
                (
                    "custom_adapter",
                    "p4-adapter-01",
                    json.loads((EXAMPLES_DIR / "custom_adapter.example.json").read_text(encoding="utf-8")),
                    [31.7, 31.7, 60.0],
                    1,  # topological genus (1 continuous stepped bore)
                ),
                (
                    "rectangular_block",
                    "p4-block-01",
                    json.loads((EXAMPLES_DIR / "rectangular_block.example.json").read_text(encoding="utf-8")),
                    [60.0, 40.0, 5.0],
                    4,  # 2x2 = 4 open through-holes
                ),
                (
                    "mounting_bracket",
                    "p4-bracket-01",
                    json.loads((EXAMPLES_DIR / "mounting_bracket.example.json").read_text(encoding="utf-8")),
                    [60.0, 40.0, 40.0],
                    4,  # 2 base holes + 2 vertical holes = 4 open through-holes
                ),
                (
                    "spacer_bushing",
                    "p4-spacer-01",
                    json.loads((EXAMPLES_DIR / "spacer_bushing.example.json").read_text(encoding="utf-8")),
                    [19.8, 19.8, 8.0],
                    1,  # 1 central bore -> torus topology (genus 1)
                ),
            ]

            for comp_type, design_id, spec_payload, expected_extents, expected_genus in cases:
                with self.subTest(component_type=comp_type):
                    gen = svc.cad_generate_design(comp_type, spec_payload, design_id=design_id)
                    self.assertTrue(gen["ok"], msg=str(gen))
                    self.assertEqual(gen["state"], "Generated")

                    val = svc.cad_validate_design(design_id)
                    self.assertTrue(val["ok"], msg=str(val))
                    self.assertEqual(val["state"], "Validated")

                    exp = svc.cad_export_stl(design_id)
                    self.assertTrue(exp["ok"], msg=str(exp))
                    self.assertEqual(exp["state"], "Exported")
                    self.assertGreater(exp["stl_size_bytes"], 0)

                    spec_meta = svc.cad_get_design_artifact(design_id, "spec_json")
                    scad_meta = svc.cad_get_design_artifact(design_id, "scad")
                    stl_meta = svc.cad_get_design_artifact(design_id, "stl")
                    self.assertTrue(spec_meta["ok"] and spec_meta["exists"])
                    self.assertTrue(scad_meta["ok"] and scad_meta["exists"])
                    self.assertTrue(stl_meta["ok"] and stl_meta["exists"])

                    if TRIMESH_AVAILABLE:
                        mesh = trimesh.load_mesh(stl_meta["path"], file_type="stl")
                        self.assertTrue(mesh.is_watertight, f"{comp_type} mesh is not watertight")
                        self.assertTrue(mesh.is_winding_consistent, f"{comp_type} winding inconsistent")
                        self.assertTrue(mesh.is_volume, f"{comp_type} is not a valid volume")
                        self.assertGreater(float(mesh.volume), 0.0)

                        # Single connected solid check (mandatory for mounting_bracket and all single-part components)
                        parts = mesh.split(only_watertight=False)
                        self.assertEqual(len(parts), 1, f"{comp_type} split into {len(parts)} disconnected bodies")

                        # Bounding box verification within MESH_BBOX_TOL_MM (0.05 mm)
                        for axis_idx, (actual_ext, exp_ext) in enumerate(zip(mesh.extents, expected_extents)):
                            self.assertAlmostEqual(
                                float(actual_ext),
                                exp_ext,
                                delta=MESH_BBOX_TOL_MM,
                                msg=f"{comp_type} axis {axis_idx} extent {actual_ext} != {exp_ext}",
                            )

                        # Euler characteristic chi = 2 - 2*genus proves every through-hole is genuinely open!
                        expected_euler = 2 - (2 * expected_genus)
                        self.assertEqual(
                            int(mesh.euler_number),
                            expected_euler,
                            f"{comp_type} euler_number {mesh.euler_number} != {expected_euler} (open hole topology mismatch)",
                        )

            # Verify persistence across repository reload for all 4 component types
            reloaded = KaiCadMcpService(workspace_root=tmp)
            listed = reloaded.cad_list_designs(state="Exported")
            self.assertTrue(listed["ok"])
            self.assertEqual(listed["count"], 4)
            for _, design_id, _, _, _ in cases:
                got = reloaded.cad_get_design(design_id)
                self.assertTrue(got["ok"])
                self.assertEqual(got["state"], "Exported")
                self.assertEqual(
                    [ev["to_state"] for ev in got["history"]],
                    ["Generated", "Validated", "Exported"],
                )


if __name__ == "__main__":
    unittest.main()

