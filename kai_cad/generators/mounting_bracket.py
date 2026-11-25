"""Parametric L-Mounting Bracket generator (`mounting_bracket`, all dimensions in mm)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from kai_cad.geometry.primitives import format_mm
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue
from kai_cad.validators.mounting_bracket_validator import (
    EffectiveBracketDimensions,
    validate_mounting_bracket_dict,
    validate_mounting_bracket_dimensions,
)


def _sanitize_comment(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def _format_opt_mm(val: Optional[float]) -> str:
    return "undef" if val is None else format_mm(val)


@dataclass(frozen=True)
class MountingBracketSpec:
    """Immutable parametric specification for an L-Mounting Bracket (all dimensions in mm).

    Coordinate system:
    - X in [0, base_length_mm] (vertical plate at X in [0, thickness_mm], shelf along +X)
    - Y in [-base_width_mm/2, +base_width_mm/2] (centered symmetrically on Y = 0)
    - Z in [0, vertical_height_mm] (base plate at Z in [0, thickness_mm], vertical leg along +Z)
    """

    base_length_mm: float
    base_width_mm: float
    vertical_height_mm: float
    thickness_mm: float
    base_hole_diameter_mm: float = 0.0
    base_hole_count: int = 0
    base_hole_spacing_mm: Optional[float] = None
    base_edge_margin_mm: Optional[float] = None
    vertical_hole_diameter_mm: float = 0.0
    vertical_hole_count: int = 0
    vertical_hole_spacing_mm: Optional[float] = None
    vertical_edge_margin_mm: Optional[float] = None
    inside_corner_radius_mm: float = 0.0
    clearance_mm: float = 0.0
    name: str = "mounting_bracket"
    description: str = "Parametric L-mounting bracket"
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
        validate_mounting_bracket_dimensions(
            base_length_mm=self.base_length_mm,
            base_width_mm=self.base_width_mm,
            vertical_height_mm=self.vertical_height_mm,
            thickness_mm=self.thickness_mm,
            base_hole_diameter_mm=self.base_hole_diameter_mm,
            base_hole_count=self.base_hole_count,
            base_hole_spacing_mm=self.base_hole_spacing_mm,
            base_edge_margin_mm=self.base_edge_margin_mm,
            vertical_hole_diameter_mm=self.vertical_hole_diameter_mm,
            vertical_hole_count=self.vertical_hole_count,
            vertical_hole_spacing_mm=self.vertical_hole_spacing_mm,
            vertical_edge_margin_mm=self.vertical_edge_margin_mm,
            inside_corner_radius_mm=self.inside_corner_radius_mm,
            clearance_mm=self.clearance_mm,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "MountingBracketSpec":
        validate_mounting_bracket_dict(data)

        def _opt_float(key: str) -> Optional[float]:
            v = data.get(key)
            return None if v is None else float(v)

        return cls(
            base_length_mm=float(data["base_length_mm"]),
            base_width_mm=float(data["base_width_mm"]),
            vertical_height_mm=float(data["vertical_height_mm"]),
            thickness_mm=float(data["thickness_mm"]),
            base_hole_diameter_mm=0.0 if data.get("base_hole_diameter_mm") is None else float(data["base_hole_diameter_mm"]),
            base_hole_count=0 if data.get("base_hole_count") is None else int(data["base_hole_count"]),
            base_hole_spacing_mm=_opt_float("base_hole_spacing_mm"),
            base_edge_margin_mm=_opt_float("base_edge_margin_mm"),
            vertical_hole_diameter_mm=0.0 if data.get("vertical_hole_diameter_mm") is None else float(data["vertical_hole_diameter_mm"]),
            vertical_hole_count=0 if data.get("vertical_hole_count") is None else int(data["vertical_hole_count"]),
            vertical_hole_spacing_mm=_opt_float("vertical_hole_spacing_mm"),
            vertical_edge_margin_mm=_opt_float("vertical_edge_margin_mm"),
            inside_corner_radius_mm=0.0 if data.get("inside_corner_radius_mm") is None else float(data["inside_corner_radius_mm"]),
            clearance_mm=0.0 if data.get("clearance_mm") is None else float(data["clearance_mm"]),
            name=str(data.get("name", "mounting_bracket")).strip(),
            description=str(data.get("description", "Parametric L-mounting bracket")),
            units="mm",
            fn=64 if data.get("fn") is None else int(data["fn"]),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "MountingBracketSpec":
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
        return asdict(self)

    def spec_sha256(self) -> str:
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class MountingBracketResult:
    """Output bundle from generating an L-Mounting Bracket."""

    spec: MountingBracketSpec
    effective_dimensions: EffectiveBracketDimensions
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def render_mounting_bracket_scad(
    spec: MountingBracketSpec,
    effective: EffectiveBracketDimensions,
) -> str:
    """Render deterministic, single-solid OpenSCAD source for `mounting_bracket`."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    base_y_scad = "[" + ", ".join(format_mm(y) for y in effective.base_pattern_y.coordinates_mm) + "]"
    vert_y_scad = "[" + ", ".join(format_mm(y) for y in effective.vertical_pattern_y.coordinates_mm) + "]"

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — L-Mounting Bracket ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        "// BoundingBox : X in [0, base_length_mm], Y in [-base_width_mm/2, +base_width_mm/2],",
        "//               Z in [0, vertical_height_mm]",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.mounting_bracket (Phase 4)",
        "// NOTE        : Nominal dimensions are preserved verbatim. Geometric validity",
        "//               does not certify structural load rating.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"base_length_mm            = {format_mm(spec.base_length_mm)};",
        f"base_width_mm             = {format_mm(spec.base_width_mm)};",
        f"vertical_height_mm        = {format_mm(spec.vertical_height_mm)};",
        f"thickness_mm              = {format_mm(spec.thickness_mm)};",
        f"base_hole_diameter_mm     = {format_mm(spec.base_hole_diameter_mm)};",
        f"base_hole_count           = {spec.base_hole_count};",
        f"base_hole_spacing_mm      = {_format_opt_mm(spec.base_hole_spacing_mm)};",
        f"base_edge_margin_mm       = {_format_opt_mm(spec.base_edge_margin_mm)};",
        f"vertical_hole_diameter_mm = {format_mm(spec.vertical_hole_diameter_mm)};",
        f"vertical_hole_count       = {spec.vertical_hole_count};",
        f"vertical_hole_spacing_mm  = {_format_opt_mm(spec.vertical_hole_spacing_mm)};",
        f"vertical_edge_margin_mm   = {_format_opt_mm(spec.vertical_edge_margin_mm)};",
        f"inside_corner_radius_mm   = {format_mm(spec.inside_corner_radius_mm)};",
        f"clearance_mm              = {format_mm(spec.clearance_mm)};",
        f"facet_count               = {spec.fn};",
        "",
        "// --- Derived Geometry Metadata (mm) ---",
        f"// clear_base_shelf_mm              = {format_mm(effective.clear_base_shelf_mm)}",
        f"// clear_vertical_leg_mm            = {format_mm(effective.clear_vertical_leg_mm)}",
        f"// effective_base_hole_diameter_mm  = {format_mm(effective.effective_base_hole_diameter_mm)}",
        f"// effective_vert_hole_diameter_mm  = {format_mm(effective.effective_vertical_hole_diameter_mm)}",
        f"base_hole_x_mm            = {format_mm(effective.base_hole_x_mm)};",
        f"base_hole_y_coords_mm     = {base_y_scad};",
        f"vertical_hole_z_mm        = {format_mm(effective.vertical_hole_z_mm)};",
        f"vertical_hole_y_coords_mm = {vert_y_scad};",
        "",
        "module l_bracket_profile_2d(base_len, vert_height, thickness, inside_r, fn) {",
        "    union() {",
        "        square([base_len, thickness]);",
        "        square([thickness, vert_height]);",
        "        if (inside_r > 0) {",
        "            translate([thickness, thickness])",
        "                difference() {",
        "                    square([inside_r, inside_r]);",
        "                    translate([inside_r, inside_r])",
        "                        circle(r = inside_r, $fn = fn);",
        "                }",
        "        }",
        "    }",
        "}",
        "",
        "module mounting_bracket(",
        "    base_length = base_length_mm,",
        "    base_width = base_width_mm,",
        "    vertical_height = vertical_height_mm,",
        "    thickness = thickness_mm,",
        "    inside_radius = inside_corner_radius_mm,",
        "    base_hole_d = base_hole_diameter_mm,",
        "    vert_hole_d = vertical_hole_diameter_mm,",
        "    clearance = clearance_mm,",
        "    bh_x = base_hole_x_mm,",
        "    bh_y_list = base_hole_y_coords_mm,",
        "    vh_z = vertical_hole_z_mm,",
        "    vh_y_list = vertical_hole_y_coords_mm,",
        "    fn = facet_count",
        ") {",
        "    eff_bh_d = base_hole_d > 0 ? base_hole_d + (2 * clearance) : 0;",
        "    eff_vh_d = vert_hole_d > 0 ? vert_hole_d + (2 * clearance) : 0;",
        "    difference() {",
        "        rotate([90, 0, 0])",
        "            linear_extrude(height = base_width, center = true, convexity = 10)",
        "                l_bracket_profile_2d(base_length, vertical_height, thickness, inside_radius, fn);",
        "        if (eff_bh_d > 0 && len(bh_y_list) > 0) {",
        "            for (by = bh_y_list)",
        "                translate([bh_x, by, -1])",
        "                    cylinder(h = thickness + 2, d = eff_bh_d, $fn = fn);",
        "        }",
        "        if (eff_vh_d > 0 && len(vh_y_list) > 0) {",
        "            for (vy = vh_y_list)",
        "                translate([-1, vy, vh_z])",
        "                    rotate([0, 90, 0])",
        "                        cylinder(h = thickness + 2, d = eff_vh_d, $fn = fn);",
        "        }",
        "    }",
        "}",
        "",
        "mounting_bracket();",
        "",
    ]
    return "\n".join(lines)


def generate_mounting_bracket(spec: MountingBracketSpec | Mapping[str, Any]) -> MountingBracketResult:
    """Validate *spec* and generate a deterministic L-Mounting Bracket OpenSCAD bundle."""
    validated = spec if isinstance(spec, MountingBracketSpec) else MountingBracketSpec.from_dict(spec)
    effective = validate_mounting_bracket_dimensions(
        base_length_mm=validated.base_length_mm,
        base_width_mm=validated.base_width_mm,
        vertical_height_mm=validated.vertical_height_mm,
        thickness_mm=validated.thickness_mm,
        base_hole_diameter_mm=validated.base_hole_diameter_mm,
        base_hole_count=validated.base_hole_count,
        base_hole_spacing_mm=validated.base_hole_spacing_mm,
        base_edge_margin_mm=validated.base_edge_margin_mm,
        vertical_hole_diameter_mm=validated.vertical_hole_diameter_mm,
        vertical_hole_count=validated.vertical_hole_count,
        vertical_hole_spacing_mm=validated.vertical_hole_spacing_mm,
        vertical_edge_margin_mm=validated.vertical_edge_margin_mm,
        inside_corner_radius_mm=validated.inside_corner_radius_mm,
        clearance_mm=validated.clearance_mm,
        fn=validated.fn,
    )
    scad_source = render_mounting_bracket_scad(validated, effective)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return MountingBracketResult(
        spec=validated,
        effective_dimensions=effective,
        scad_source=scad_source,
        spec_sha256=validated.spec_sha256(),
        scad_sha256=scad_sha,
    )

