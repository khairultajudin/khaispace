"""Parametric Rectangular Electronics Enclosure Base generator (`enclosure_base`, all mm)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Tuple

from kai_cad.geometry.primitives import format_mm
from kai_cad.validators.enclosure_base_validator import (
    CableOpeningSpec,
    EffectiveEnclosureBaseDimensions,
    _parse_and_validate_openings,
    validate_enclosure_base_dict,
    validate_enclosure_base_dimensions,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue


def _sanitize_comment(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def _format_opt_mm(val: Optional[float]) -> str:
    return "undef" if val is None else format_mm(val)


@dataclass(frozen=True)
class EnclosureBaseSpec:
    """Immutable parametric specification for an Electronics Enclosure Base (all mm).

    Coordinate system:
    - X in [-length_mm/2, +length_mm/2]
    - Y in [-width_mm/2, +width_mm/2] ("front" wall at Y=-width/2, "back" at Y=+width/2,
      "left" at X=-length/2, "right" at X=+length/2)
    - Z in [0, height_mm] (bottom face at Z=0, solid floor Z in [0, floor_thickness_mm],
      open top rim at Z=height_mm).
    """

    length_mm: float
    width_mm: float
    height_mm: float
    wall_thickness_mm: float
    floor_thickness_mm: float
    corner_radius_mm: float = 0.0
    boss_count: int = 0
    boss_outer_diameter_mm: float = 0.0
    boss_hole_diameter_mm: float = 0.0
    boss_offset_x_mm: Optional[float] = None
    boss_offset_y_mm: Optional[float] = None
    cable_openings: Tuple[CableOpeningSpec, ...] = ()
    name: str = "enclosure_base"
    description: str = "Parametric rectangular electronics enclosure base"
    units: str = "mm"
    fn: int = 64

    def __post_init__(self) -> None:
        if not isinstance(self.units, str) or self.units.strip().lower() != "mm":
            raise GeometryValidationError(
                [ValidationIssue("units", "INVALID_UNITS", f"Units must be 'mm'; got {self.units!r}.")]
            )
        if not isinstance(self.name, str) or not self.name.strip():
            raise GeometryValidationError(
                [ValidationIssue("name", "INVALID_TYPE", "'name' must be a non-empty string.")]
            )
        validate_enclosure_base_dimensions(
            length_mm=self.length_mm,
            width_mm=self.width_mm,
            height_mm=self.height_mm,
            wall_thickness_mm=self.wall_thickness_mm,
            floor_thickness_mm=self.floor_thickness_mm,
            corner_radius_mm=self.corner_radius_mm,
            boss_count=self.boss_count,
            boss_outer_diameter_mm=self.boss_outer_diameter_mm,
            boss_hole_diameter_mm=self.boss_hole_diameter_mm,
            boss_offset_x_mm=self.boss_offset_x_mm,
            boss_offset_y_mm=self.boss_offset_y_mm,
            cable_openings=self.cable_openings,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "EnclosureBaseSpec":
        validate_enclosure_base_dict(data)
        issues: List[ValidationIssue] = []
        openings = tuple(_parse_and_validate_openings(data.get("cable_openings"), issues))

        def _opt_float(key: str) -> Optional[float]:
            v = data.get(key)
            return None if v is None else float(v)

        return cls(
            length_mm=float(data["length_mm"]),
            width_mm=float(data["width_mm"]),
            height_mm=float(data["height_mm"]),
            wall_thickness_mm=float(data["wall_thickness_mm"]),
            floor_thickness_mm=float(data["floor_thickness_mm"]),
            corner_radius_mm=0.0 if data.get("corner_radius_mm") is None else float(data["corner_radius_mm"]),
            boss_count=0 if data.get("boss_count") is None else int(data["boss_count"]),
            boss_outer_diameter_mm=0.0 if data.get("boss_outer_diameter_mm") is None else float(data["boss_outer_diameter_mm"]),
            boss_hole_diameter_mm=0.0 if data.get("boss_hole_diameter_mm") is None else float(data["boss_hole_diameter_mm"]),
            boss_offset_x_mm=_opt_float("boss_offset_x_mm"),
            boss_offset_y_mm=_opt_float("boss_offset_y_mm"),
            cable_openings=openings,
            name=str(data.get("name", "enclosure_base")).strip(),
            description=str(data.get("description", "Parametric rectangular electronics enclosure base")),
            units="mm",
            fn=64 if data.get("fn") is None else int(data["fn"]),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "EnclosureBaseSpec":
        file_path = Path(path)
        raw_text = file_path.read_text(encoding="utf-8")
        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise GeometryValidationError(
                [ValidationIssue("json", "INVALID_JSON", f"Malformed JSON in '{file_path}': {exc}")]
            ) from exc
        return cls.from_dict(payload)

    def to_dict(self) -> Dict[str, Any]:
        raw = asdict(self)
        cleaned_openings = []
        for op in raw["cable_openings"]:
            cleaned_openings.append({k: v for k, v in op.items() if v is not None})
        raw["cable_openings"] = cleaned_openings
        return raw

    def spec_sha256(self) -> str:
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class EnclosureBaseResult:
    """Output bundle from generating an `enclosure_base`."""

    spec: EnclosureBaseSpec
    effective_dimensions: EffectiveEnclosureBaseDimensions
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def _render_opening_scad(op: CableOpeningSpec, spec: EnclosureBaseSpec, cut_eps: float) -> List[str]:
    """Emit OpenSCAD statement subtracting one validated wall opening."""
    w_t = spec.wall_thickness_mm
    cut_len = w_t + (2.0 * cut_eps)
    fn_s = str(spec.fn)

    if op.wall == "front":
        # Y = -width/2 wall; cut along +Y from (-width/2 - eps)
        y_start = -(spec.width_mm / 2.0) - cut_eps
        if op.shape == "circular":
            assert op.diameter_mm is not None
            return [
                f"        translate([{format_mm(op.offset_mm)}, {format_mm(y_start)}, {format_mm(op.center_z_mm)}])",
                f"            rotate([-90, 0, 0]) cylinder(h = {format_mm(cut_len)}, d = {format_mm(op.diameter_mm)}, $fn = {fn_s});",
            ]
        assert op.width_mm is not None and op.height_mm is not None
        return [
            f"        translate([{format_mm(op.offset_mm - op.width_mm / 2.0)}, {format_mm(y_start)}, {format_mm(op.center_z_mm - op.height_mm / 2.0)}])",
            f"            cube([{format_mm(op.width_mm)}, {format_mm(cut_len)}, {format_mm(op.height_mm)}]);",
        ]

    if op.wall == "back":
        # Y = +width/2 wall; cut along +Y from (+width/2 - wall_t - eps)
        y_start = (spec.width_mm / 2.0) - w_t - cut_eps
        if op.shape == "circular":
            assert op.diameter_mm is not None
            return [
                f"        translate([{format_mm(op.offset_mm)}, {format_mm(y_start)}, {format_mm(op.center_z_mm)}])",
                f"            rotate([-90, 0, 0]) cylinder(h = {format_mm(cut_len)}, d = {format_mm(op.diameter_mm)}, $fn = {fn_s});",
            ]
        assert op.width_mm is not None and op.height_mm is not None
        return [
            f"        translate([{format_mm(op.offset_mm - op.width_mm / 2.0)}, {format_mm(y_start)}, {format_mm(op.center_z_mm - op.height_mm / 2.0)}])",
            f"            cube([{format_mm(op.width_mm)}, {format_mm(cut_len)}, {format_mm(op.height_mm)}]);",
        ]

    if op.wall == "left":
        # X = -length/2 wall; cut along +X from (-length/2 - eps)
        x_start = -(spec.length_mm / 2.0) - cut_eps
        if op.shape == "circular":
            assert op.diameter_mm is not None
            return [
                f"        translate([{format_mm(x_start)}, {format_mm(op.offset_mm)}, {format_mm(op.center_z_mm)}])",
                f"            rotate([0, 90, 0]) cylinder(h = {format_mm(cut_len)}, d = {format_mm(op.diameter_mm)}, $fn = {fn_s});",
            ]
        assert op.width_mm is not None and op.height_mm is not None
        return [
            f"        translate([{format_mm(x_start)}, {format_mm(op.offset_mm - op.width_mm / 2.0)}, {format_mm(op.center_z_mm - op.height_mm / 2.0)}])",
            f"            cube([{format_mm(cut_len)}, {format_mm(op.width_mm)}, {format_mm(op.height_mm)}]);",
        ]

    # op.wall == "right": X = +length/2 wall; cut along +X from (+length/2 - wall_t - eps)
    x_start = (spec.length_mm / 2.0) - w_t - cut_eps
    if op.shape == "circular":
        assert op.diameter_mm is not None
        return [
            f"        translate([{format_mm(x_start)}, {format_mm(op.offset_mm)}, {format_mm(op.center_z_mm)}])",
            f"            rotate([0, 90, 0]) cylinder(h = {format_mm(cut_len)}, d = {format_mm(op.diameter_mm)}, $fn = {fn_s});",
        ]
    assert op.width_mm is not None and op.height_mm is not None
    return [
        f"        translate([{format_mm(x_start)}, {format_mm(op.offset_mm - op.width_mm / 2.0)}, {format_mm(op.center_z_mm - op.height_mm / 2.0)}])",
        f"            cube([{format_mm(cut_len)}, {format_mm(op.width_mm)}, {format_mm(op.height_mm)}]);",
    ]


def render_enclosure_base_scad(
    spec: EnclosureBaseSpec,
    effective: EffectiveEnclosureBaseDimensions,
) -> str:
    """Render deterministic, single-solid OpenSCAD source for `enclosure_base`."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    boss_pts_scad = "[" + ", ".join(f"[{format_mm(x)}, {format_mm(y)}]" for x, y in effective.boss_centers_xy_mm) + "]"
    cut_eps = min(0.5, min(effective.cavity_length_mm, effective.cavity_width_mm) / 4.0)

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — Electronics Enclosure Base ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        "// Orientation : Centered on X/Y; bottom at Z=0, open top rim at Z=height_mm",
        "// Walls       : front (Y=-width/2), back (Y=+width/2), left (X=-length/2), right (X=+length/2)",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.enclosure_base (Phase 4 Batch 2)",
        "// NOTE        : Nominal dimensions preserved verbatim. Geometric validation",
        "//               does not certify structural, thermal, or IP/waterproof ratings.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"length_mm              = {format_mm(spec.length_mm)};",
        f"width_mm               = {format_mm(spec.width_mm)};",
        f"height_mm              = {format_mm(spec.height_mm)};",
        f"wall_thickness_mm      = {format_mm(spec.wall_thickness_mm)};",
        f"floor_thickness_mm     = {format_mm(spec.floor_thickness_mm)};",
        f"corner_radius_mm       = {format_mm(spec.corner_radius_mm)};",
        f"boss_count             = {spec.boss_count};",
        f"boss_outer_diameter_mm = {format_mm(spec.boss_outer_diameter_mm)};",
        f"boss_hole_diameter_mm  = {format_mm(spec.boss_hole_diameter_mm)};",
        f"boss_offset_x_mm       = {_format_opt_mm(spec.boss_offset_x_mm)};",
        f"boss_offset_y_mm       = {_format_opt_mm(spec.boss_offset_y_mm)};",
        f"facet_count            = {spec.fn};",
        "",
        "// --- Derived Cavity & Boss Geometry (mm) ---",
        f"// cavity_length_mm        = {format_mm(effective.cavity_length_mm)}",
        f"// cavity_width_mm         = {format_mm(effective.cavity_width_mm)}",
        f"// cavity_depth_mm         = {format_mm(effective.cavity_depth_mm)}",
        f"// cavity_corner_radius_mm = {format_mm(effective.cavity_corner_radius_mm)}",
        f"// cable_opening_count     = {len(effective.cable_openings)}",
        f"boss_centers_xy_mm     = {boss_pts_scad};",
        "",
        "module rounded_rect_2d(len_x, wid_y, radius, fn) {",
        "    if (radius > 0) {",
        "        ox = (len_x / 2) - radius;",
        "        oy = (wid_y / 2) - radius;",
        "        hull() {",
        "            for (sx = [-1, 1], sy = [-1, 1])",
        "                translate([sx * ox, sy * oy])",
        "                    circle(r = radius, $fn = fn);",
        "        }",
        "    } else {",
        "        square([len_x, wid_y], center = true);",
        "    }",
        "}",
        "",
        "module enclosure_base(",
        "    length = length_mm,",
        "    width = width_mm,",
        "    height = height_mm,",
        "    wall_t = wall_thickness_mm,",
        "    floor_t = floor_thickness_mm,",
        "    corner_r = corner_radius_mm,",
        "    boss_od = boss_outer_diameter_mm,",
        "    boss_id = boss_hole_diameter_mm,",
        "    boss_pts = boss_centers_xy_mm,",
        "    fn = facet_count",
        ") {",
        "    cav_len = length - (2 * wall_t);",
        "    cav_wid = width - (2 * wall_t);",
        "    cav_r   = max(0, corner_r - wall_t);",
        "",
        "    difference() {",
        "        // Monolithic outer block (avoids coplanar floor/wall boolean seams)",
        "        linear_extrude(height = height, convexity = 10)",
        "            rounded_rect_2d(length, width, corner_r, fn);",
        "",
        "        // Subtract internal cavity (preserving integrated screw bosses) and blind boss holes",
        "        translate([0, 0, floor_t])",
        "            linear_extrude(height = (height - floor_t) + 1, convexity = 10)",
        "                union() {",
        "                    difference() {",
        "                        rounded_rect_2d(cav_len, cav_wid, cav_r, fn);",
        "                        if (boss_od > 0 && len(boss_pts) > 0) {",
        "                            for (pt = boss_pts)",
        "                                translate(pt)",
        "                                    circle(d = boss_od, $fn = fn);",
        "                        }",
        "                    }",
        "                    if (boss_id > 0 && len(boss_pts) > 0) {",
        "                        for (pt = boss_pts)",
        "                            translate(pt)",
        "                                circle(d = boss_id, $fn = fn);",
        "                    }",
        "                };",
    ]

    if effective.cable_openings:
        lines.append("")
        lines.append("        // Validated wall cable openings")
        for op in effective.cable_openings:
            lines.extend(_render_opening_scad(op, spec, cut_eps))

    lines.extend(
        [
            "    }",
            "}",
            "",
            "enclosure_base();",
            "",
        ]
    )
    return "\n".join(lines)


def generate_enclosure_base(spec: EnclosureBaseSpec | Mapping[str, Any]) -> EnclosureBaseResult:
    """Validate *spec* and generate a deterministic `enclosure_base` OpenSCAD bundle."""
    validated = spec if isinstance(spec, EnclosureBaseSpec) else EnclosureBaseSpec.from_dict(spec)
    effective = validate_enclosure_base_dimensions(
        length_mm=validated.length_mm,
        width_mm=validated.width_mm,
        height_mm=validated.height_mm,
        wall_thickness_mm=validated.wall_thickness_mm,
        floor_thickness_mm=validated.floor_thickness_mm,
        corner_radius_mm=validated.corner_radius_mm,
        boss_count=validated.boss_count,
        boss_outer_diameter_mm=validated.boss_outer_diameter_mm,
        boss_hole_diameter_mm=validated.boss_hole_diameter_mm,
        boss_offset_x_mm=validated.boss_offset_x_mm,
        boss_offset_y_mm=validated.boss_offset_y_mm,
        cable_openings=validated.cable_openings,
        fn=validated.fn,
    )
    scad_source = render_enclosure_base_scad(validated, effective)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return EnclosureBaseResult(
        spec=validated,
        effective_dimensions=effective,
        scad_source=scad_source,
        spec_sha256=validated.spec_sha256(),
        scad_sha256=scad_sha,
    )
