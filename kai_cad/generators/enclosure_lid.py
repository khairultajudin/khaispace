"""Parametric Electronics Enclosure Lid generator (`enclosure_lid`, all mm)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from kai_cad.geometry.primitives import format_mm
from kai_cad.validators.enclosure_lid_validator import (
    EffectiveEnclosureLidDimensions,
    validate_enclosure_lid_dict,
    validate_enclosure_lid_dimensions,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue


def _sanitize_comment(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def _format_opt_mm(val: Optional[float]) -> str:
    return "undef" if val is None else format_mm(val)


@dataclass(frozen=True)
class EnclosureLidSpec:
    """Immutable parametric specification for an Electronics Enclosure Lid (all mm).

    Coordinate convention (aligned with `enclosure_base`):
    - X in [-length_mm/2, +length_mm/2], Y in [-width_mm/2, +width_mm/2]
    - Top plate occupies Z in [0, lid_thickness_mm] (mating underside at Z = 0)
    - Optional downward locating skirt occupies Z in [-skirt_depth_mm, 0]
    - Translating the lid by `[0, 0, base.height_mm]` places it directly onto `enclosure_base`.
    """

    length_mm: float
    width_mm: float
    lid_thickness_mm: float
    corner_radius_mm: float = 0.0
    skirt_depth_mm: float = 0.0
    skirt_thickness_mm: Optional[float] = None
    skirt_clearance_mm: Optional[float] = None
    wall_thickness_mm: Optional[float] = None
    screw_hole_diameter_mm: float = 0.0
    screw_hole_count: Optional[int] = None
    boss_offset_x_mm: Optional[float] = None
    boss_offset_y_mm: Optional[float] = None
    name: str = "enclosure_lid"
    description: str = "Parametric compatible electronics enclosure lid"
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
        validate_enclosure_lid_dimensions(
            length_mm=self.length_mm,
            width_mm=self.width_mm,
            lid_thickness_mm=self.lid_thickness_mm,
            corner_radius_mm=self.corner_radius_mm,
            skirt_depth_mm=self.skirt_depth_mm,
            skirt_thickness_mm=self.skirt_thickness_mm,
            skirt_clearance_mm=self.skirt_clearance_mm,
            wall_thickness_mm=self.wall_thickness_mm,
            screw_hole_diameter_mm=self.screw_hole_diameter_mm,
            screw_hole_count=self.screw_hole_count,
            boss_offset_x_mm=self.boss_offset_x_mm,
            boss_offset_y_mm=self.boss_offset_y_mm,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "EnclosureLidSpec":
        validate_enclosure_lid_dict(data)

        def _opt_float(key: str) -> Optional[float]:
            v = data.get(key)
            return None if v is None else float(v)

        return cls(
            length_mm=float(data["length_mm"]),
            width_mm=float(data["width_mm"]),
            lid_thickness_mm=float(data["lid_thickness_mm"]),
            corner_radius_mm=0.0 if data.get("corner_radius_mm") is None else float(data["corner_radius_mm"]),
            skirt_depth_mm=0.0 if data.get("skirt_depth_mm") is None else float(data["skirt_depth_mm"]),
            skirt_thickness_mm=_opt_float("skirt_thickness_mm"),
            skirt_clearance_mm=_opt_float("skirt_clearance_mm"),
            wall_thickness_mm=_opt_float("wall_thickness_mm"),
            screw_hole_diameter_mm=0.0 if data.get("screw_hole_diameter_mm") is None else float(data["screw_hole_diameter_mm"]),
            screw_hole_count=None if data.get("screw_hole_count") is None else int(data["screw_hole_count"]),
            boss_offset_x_mm=_opt_float("boss_offset_x_mm"),
            boss_offset_y_mm=_opt_float("boss_offset_y_mm"),
            name=str(data.get("name", "enclosure_lid")).strip(),
            description=str(data.get("description", "Parametric compatible electronics enclosure lid")),
            units="mm",
            fn=64 if data.get("fn") is None else int(data["fn"]),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "EnclosureLidSpec":
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
class EnclosureLidResult:
    """Output bundle from generating an `enclosure_lid`."""

    spec: EnclosureLidSpec
    effective_dimensions: EffectiveEnclosureLidDimensions
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def render_enclosure_lid_scad(
    spec: EnclosureLidSpec,
    effective: EffectiveEnclosureLidDimensions,
) -> str:
    """Render deterministic, single-solid OpenSCAD source for `enclosure_lid`."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    hole_pts_scad = "[" + ", ".join(f"[{format_mm(x)}, {format_mm(y)}]" for x, y in effective.screw_hole_centers_xy_mm) + "]"

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — Electronics Enclosure Lid ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        "// Orientation : Centered on X/Y; top plate Z in [0, lid_thickness_mm],",
        "//               downward locating skirt Z in [-skirt_depth_mm, 0].",
        "//               Align onto enclosure_base via translate([0, 0, base_height_mm]).",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.enclosure_lid (Phase 4 Batch 2)",
        "// NOTE        : Nominal dimensions preserved verbatim. Geometric validation",
        "//               does not certify structural, thermal, or IP/waterproof ratings.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"length_mm              = {format_mm(spec.length_mm)};",
        f"width_mm               = {format_mm(spec.width_mm)};",
        f"lid_thickness_mm       = {format_mm(spec.lid_thickness_mm)};",
        f"corner_radius_mm       = {format_mm(spec.corner_radius_mm)};",
        f"wall_thickness_mm      = {_format_opt_mm(spec.wall_thickness_mm)};",
        f"skirt_depth_mm         = {format_mm(spec.skirt_depth_mm)};",
        f"skirt_thickness_mm     = {_format_opt_mm(spec.skirt_thickness_mm)};",
        f"skirt_clearance_mm     = {_format_opt_mm(spec.skirt_clearance_mm)};",
        f"screw_hole_diameter_mm = {format_mm(spec.screw_hole_diameter_mm)};",
        f"boss_offset_x_mm       = {_format_opt_mm(spec.boss_offset_x_mm)};",
        f"boss_offset_y_mm       = {_format_opt_mm(spec.boss_offset_y_mm)};",
        f"facet_count            = {spec.fn};",
        "",
        "// --- Derived Skirt & Alignment Geometry (mm) ---",
        f"// skirt_outer_length_mm        = {format_mm(effective.skirt_outer_length_mm)}",
        f"// skirt_outer_width_mm         = {format_mm(effective.skirt_outer_width_mm)}",
        f"// skirt_outer_corner_radius_mm = {format_mm(effective.skirt_outer_corner_radius_mm)}",
        f"// skirt_inner_length_mm        = {format_mm(effective.skirt_inner_length_mm)}",
        f"// skirt_inner_width_mm         = {format_mm(effective.skirt_inner_width_mm)}",
        f"// total_height_mm              = {format_mm(effective.total_height_mm)}",
        f"screw_hole_centers_xy_mm = {hole_pts_scad};",
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
        "module enclosure_lid(",
        "    length = length_mm,",
        "    width = width_mm,",
        "    lid_t = lid_thickness_mm,",
        "    corner_r = corner_radius_mm,",
        f"    skirt_d = {format_mm(effective.skirt_depth_mm)},",
        f"    skirt_out_l = {format_mm(effective.skirt_outer_length_mm)},",
        f"    skirt_out_w = {format_mm(effective.skirt_outer_width_mm)},",
        f"    skirt_out_r = {format_mm(effective.skirt_outer_corner_radius_mm)},",
        f"    skirt_in_l = {format_mm(effective.skirt_inner_length_mm)},",
        f"    skirt_in_w = {format_mm(effective.skirt_inner_width_mm)},",
        f"    skirt_in_r = {format_mm(effective.skirt_inner_corner_radius_mm)},",
        "    hole_d = screw_hole_diameter_mm,",
        "    hole_pts = screw_hole_centers_xy_mm,",
        "    fn = facet_count",
        ") {",
        "    difference() {",
        "        union() {",
        "            // Top lid plate Z in [0, lid_t]",
        "            linear_extrude(height = lid_t, convexity = 10)",
        "                rounded_rect_2d(length, width, corner_r, fn);",
        "",
        "            // Downward locating skirt Z in [-skirt_d, 0] overlapped into plate to avoid Z=0 seam",
        "            if (skirt_d > 0) {",
        "                translate([0, 0, -skirt_d])",
        "                    linear_extrude(height = skirt_d + (lid_t / 2), convexity = 10)",
        "                        difference() {",
        "                            rounded_rect_2d(skirt_out_l, skirt_out_w, skirt_out_r, fn);",
        "                            rounded_rect_2d(skirt_in_l, skirt_in_w, skirt_in_r, fn);",
        "                        };",
        "            }",
        "        }",
        "",
        "        if (hole_d > 0 && len(hole_pts) > 0) {",
        "            for (pt = hole_pts)",
        "                translate([pt[0], pt[1], -skirt_d - 1])",
        "                    cylinder(h = skirt_d + lid_t + 2, d = hole_d, $fn = fn);",
        "        }",
        "    }",
        "}",
        "",
        "enclosure_lid();",
        "",
    ]
    return "\n".join(lines)


def generate_enclosure_lid(spec: EnclosureLidSpec | Mapping[str, Any]) -> EnclosureLidResult:
    """Validate *spec* and generate a deterministic `enclosure_lid` OpenSCAD bundle."""
    validated = spec if isinstance(spec, EnclosureLidSpec) else EnclosureLidSpec.from_dict(spec)
    effective = validate_enclosure_lid_dimensions(
        length_mm=validated.length_mm,
        width_mm=validated.width_mm,
        lid_thickness_mm=validated.lid_thickness_mm,
        corner_radius_mm=validated.corner_radius_mm,
        skirt_depth_mm=validated.skirt_depth_mm,
        skirt_thickness_mm=validated.skirt_thickness_mm,
        skirt_clearance_mm=validated.skirt_clearance_mm,
        wall_thickness_mm=validated.wall_thickness_mm,
        screw_hole_diameter_mm=validated.screw_hole_diameter_mm,
        screw_hole_count=validated.screw_hole_count,
        boss_offset_x_mm=validated.boss_offset_x_mm,
        boss_offset_y_mm=validated.boss_offset_y_mm,
        fn=validated.fn,
    )
    scad_source = render_enclosure_lid_scad(validated, effective)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return EnclosureLidResult(
        spec=validated,
        effective_dimensions=effective,
        scad_source=scad_source,
        spec_sha256=validated.spec_sha256(),
        scad_sha256=scad_sha,
    )
