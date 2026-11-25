"""Parametric Rectangular Block generator (`rectangular_block`, all dimensions in mm)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from kai_cad.geometry.primitives import format_mm
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue
from kai_cad.validators.rectangular_block_validator import (
    EffectiveBlockDimensions,
    validate_rectangular_block_dict,
    validate_rectangular_block_dimensions,
)


def _sanitize_comment(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def _format_opt_mm(val: Optional[float]) -> str:
    return "undef" if val is None else format_mm(val)


@dataclass(frozen=True)
class RectangularBlockSpec:
    """Immutable parametric specification for a Rectangular Block (all dimensions in mm).

    Centered on the X/Y origin (`[-length_mm/2, +length_mm/2]`, `[-width_mm/2, +width_mm/2]`)
    with bottom face at `Z = 0` and top face at `Z = height_mm`.
    """

    length_mm: float
    width_mm: float
    height_mm: float
    corner_radius_mm: float = 0.0
    hole_diameter_mm: float = 0.0
    hole_count_x: int = 0
    hole_count_y: int = 0
    hole_spacing_x_mm: Optional[float] = None
    hole_spacing_y_mm: Optional[float] = None
    edge_margin_x_mm: Optional[float] = None
    edge_margin_y_mm: Optional[float] = None
    clearance_mm: float = 0.0
    name: str = "rectangular_block"
    description: str = "Parametric rectangular block"
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
        validate_rectangular_block_dimensions(
            length_mm=self.length_mm,
            width_mm=self.width_mm,
            height_mm=self.height_mm,
            corner_radius_mm=self.corner_radius_mm,
            hole_diameter_mm=self.hole_diameter_mm,
            hole_count_x=self.hole_count_x,
            hole_count_y=self.hole_count_y,
            hole_spacing_x_mm=self.hole_spacing_x_mm,
            hole_spacing_y_mm=self.hole_spacing_y_mm,
            edge_margin_x_mm=self.edge_margin_x_mm,
            edge_margin_y_mm=self.edge_margin_y_mm,
            clearance_mm=self.clearance_mm,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "RectangularBlockSpec":
        validate_rectangular_block_dict(data)

        def _opt_float(key: str) -> Optional[float]:
            v = data.get(key)
            return None if v is None else float(v)

        return cls(
            length_mm=float(data["length_mm"]),
            width_mm=float(data["width_mm"]),
            height_mm=float(data["height_mm"]),
            corner_radius_mm=0.0 if data.get("corner_radius_mm") is None else float(data["corner_radius_mm"]),
            hole_diameter_mm=0.0 if data.get("hole_diameter_mm") is None else float(data["hole_diameter_mm"]),
            hole_count_x=0 if data.get("hole_count_x") is None else int(data["hole_count_x"]),
            hole_count_y=0 if data.get("hole_count_y") is None else int(data["hole_count_y"]),
            hole_spacing_x_mm=_opt_float("hole_spacing_x_mm"),
            hole_spacing_y_mm=_opt_float("hole_spacing_y_mm"),
            edge_margin_x_mm=_opt_float("edge_margin_x_mm"),
            edge_margin_y_mm=_opt_float("edge_margin_y_mm"),
            clearance_mm=0.0 if data.get("clearance_mm") is None else float(data["clearance_mm"]),
            name=str(data.get("name", "rectangular_block")).strip(),
            description=str(data.get("description", "Parametric rectangular block")),
            units="mm",
            fn=64 if data.get("fn") is None else int(data["fn"]),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "RectangularBlockSpec":
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
class RectangularBlockResult:
    """Output bundle from generating a Rectangular Block."""

    spec: RectangularBlockSpec
    effective_dimensions: EffectiveBlockDimensions
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def render_rectangular_block_scad(
    spec: RectangularBlockSpec,
    effective: EffectiveBlockDimensions,
) -> str:
    """Render deterministic, readable OpenSCAD source for `rectangular_block`."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    x_coords_scad = "[" + ", ".join(format_mm(x) for x in effective.pattern_x.coordinates_mm) + "]"
    y_coords_scad = "[" + ", ".join(format_mm(y) for y in effective.pattern_y.coordinates_mm) + "]"

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — Rectangular Block ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        "// Orientation : Centered on X/Y origin; bottom face at Z = 0, top at Z = height_mm",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.rectangular_block (Phase 4)",
        "// NOTE        : Nominal external dimensions are preserved verbatim.",
        "//               When mounting holes are enabled, clearance_mm enlarges hole",
        "//               diameters by 2 * clearance_mm.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"length_mm         = {format_mm(spec.length_mm)};",
        f"width_mm          = {format_mm(spec.width_mm)};",
        f"height_mm         = {format_mm(spec.height_mm)};",
        f"corner_radius_mm  = {format_mm(spec.corner_radius_mm)};",
        f"hole_diameter_mm  = {format_mm(spec.hole_diameter_mm)};",
        f"hole_count_x      = {spec.hole_count_x};",
        f"hole_count_y      = {spec.hole_count_y};",
        f"hole_spacing_x_mm = {_format_opt_mm(spec.hole_spacing_x_mm)};",
        f"hole_spacing_y_mm = {_format_opt_mm(spec.hole_spacing_y_mm)};",
        f"edge_margin_x_mm  = {_format_opt_mm(spec.edge_margin_x_mm)};",
        f"edge_margin_y_mm  = {_format_opt_mm(spec.edge_margin_y_mm)};",
        f"clearance_mm      = {format_mm(spec.clearance_mm)};",
        f"facet_count       = {spec.fn};",
        "",
        "// --- Derived Geometry Metadata (mm) ---",
        f"// effective_hole_diameter_mm = {format_mm(effective.effective_hole_diameter_mm)}",
        f"// resolved_spacing_x_mm      = {format_mm(effective.pattern_x.spacing_mm)}",
        f"// resolved_spacing_y_mm      = {format_mm(effective.pattern_y.spacing_mm)}",
        f"// resolved_edge_margin_x_mm  = {format_mm(effective.pattern_x.edge_margin_mm)}",
        f"// resolved_edge_margin_y_mm  = {format_mm(effective.pattern_y.edge_margin_mm)}",
        f"// total_hole_count           = {len(effective.hole_centers_xy_mm)}",
        f"hole_x_coords_mm  = {x_coords_scad};",
        f"hole_y_coords_mm  = {y_coords_scad};",
        "",
        "module rectangular_block_2d(length, width, corner_radius, fn) {",
        "    if (corner_radius > 0) {",
        "        ox = (length / 2) - corner_radius;",
        "        oy = (width / 2) - corner_radius;",
        "        hull() {",
        "            for (sx = [-1, 1], sy = [-1, 1])",
        "                translate([sx * ox, sy * oy])",
        "                    circle(r = corner_radius, $fn = fn);",
        "        }",
        "    } else {",
        "        square([length, width], center = true);",
        "    }",
        "}",
        "",
        "module rectangular_block(",
        "    length = length_mm,",
        "    width = width_mm,",
        "    height = height_mm,",
        "    corner_radius = corner_radius_mm,",
        "    hole_diameter = hole_diameter_mm,",
        "    clearance = clearance_mm,",
        "    hx_list = hole_x_coords_mm,",
        "    hy_list = hole_y_coords_mm,",
        "    fn = facet_count",
        ") {",
        "    eff_hole_d = hole_diameter > 0 ? hole_diameter + (2 * clearance) : 0;",
        "    linear_extrude(height = height, convexity = 10)",
        "        difference() {",
        "            rectangular_block_2d(length, width, corner_radius, fn);",
        "            if (eff_hole_d > 0 && len(hx_list) > 0 && len(hy_list) > 0) {",
        "                for (hx = hx_list, hy = hy_list)",
        "                    translate([hx, hy])",
        "                        circle(d = eff_hole_d, $fn = fn);",
        "            }",
        "        }",
        "}",
        "",
        "rectangular_block();",
        "",
    ]
    return "\n".join(lines)


def generate_rectangular_block(spec: RectangularBlockSpec | Mapping[str, Any]) -> RectangularBlockResult:
    """Validate *spec* and generate a deterministic Rectangular Block OpenSCAD bundle."""
    validated = spec if isinstance(spec, RectangularBlockSpec) else RectangularBlockSpec.from_dict(spec)
    effective = validate_rectangular_block_dimensions(
        length_mm=validated.length_mm,
        width_mm=validated.width_mm,
        height_mm=validated.height_mm,
        corner_radius_mm=validated.corner_radius_mm,
        hole_diameter_mm=validated.hole_diameter_mm,
        hole_count_x=validated.hole_count_x,
        hole_count_y=validated.hole_count_y,
        hole_spacing_x_mm=validated.hole_spacing_x_mm,
        hole_spacing_y_mm=validated.hole_spacing_y_mm,
        edge_margin_x_mm=validated.edge_margin_x_mm,
        edge_margin_y_mm=validated.edge_margin_y_mm,
        clearance_mm=validated.clearance_mm,
        fn=validated.fn,
    )
    scad_source = render_rectangular_block_scad(validated, effective)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return RectangularBlockResult(
        spec=validated,
        effective_dimensions=effective,
        scad_source=scad_source,
        spec_sha256=validated.spec_sha256(),
        scad_sha256=scad_sha,
    )

