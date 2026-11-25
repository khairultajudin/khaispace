"""Parametric Cylindrical Spacer / Bushing generator (`spacer_bushing`, all dimensions in mm)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Tuple

from kai_cad.geometry.primitives import format_mm
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue
from kai_cad.validators.spacer_bushing_validator import (
    EffectiveSpacerDimensions,
    validate_spacer_bushing_dict,
    validate_spacer_bushing_dimensions,
)


def _sanitize_comment(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


@dataclass(frozen=True)
class SpacerBushingSpec:
    """Immutable parametric specification for a Cylindrical Spacer / Bushing (all mm).

    Centered on X/Y origin with bottom face at `Z = 0` and top face at `Z = height_mm`.
    """

    outer_diameter_mm: float
    inner_diameter_mm: float
    height_mm: float
    top_chamfer_mm: float = 0.0
    bottom_chamfer_mm: float = 0.0
    clearance_mm: float = 0.0
    name: str = "spacer_bushing"
    description: str = "Parametric cylindrical spacer / bushing"
    units: str = "mm"
    fn: int = 96

    def __post_init__(self) -> None:
        if not isinstance(self.units, str) or self.units.strip().lower() != "mm":
            raise GeometryValidationError(
                [ValidationIssue("units", "INVALID_UNITS", f"Units must be 'mm'; got {self.units!r}.")]
            )
        if not isinstance(self.name, str) or not self.name.strip():
            raise GeometryValidationError(
                [ValidationIssue("name", "INVALID_TYPE", "'name' must be a non-empty string.")]
            )
        validate_spacer_bushing_dimensions(
            outer_diameter_mm=self.outer_diameter_mm,
            inner_diameter_mm=self.inner_diameter_mm,
            height_mm=self.height_mm,
            top_chamfer_mm=self.top_chamfer_mm,
            bottom_chamfer_mm=self.bottom_chamfer_mm,
            clearance_mm=self.clearance_mm,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "SpacerBushingSpec":
        validate_spacer_bushing_dict(data)
        return cls(
            outer_diameter_mm=float(data["outer_diameter_mm"]),
            inner_diameter_mm=float(data["inner_diameter_mm"]),
            height_mm=float(data["height_mm"]),
            top_chamfer_mm=0.0 if data.get("top_chamfer_mm") is None else float(data["top_chamfer_mm"]),
            bottom_chamfer_mm=0.0 if data.get("bottom_chamfer_mm") is None else float(data["bottom_chamfer_mm"]),
            clearance_mm=0.0 if data.get("clearance_mm") is None else float(data["clearance_mm"]),
            name=str(data.get("name", "spacer_bushing")).strip(),
            description=str(data.get("description", "Parametric cylindrical spacer / bushing")),
            units="mm",
            fn=96 if data.get("fn") is None else int(data["fn"]),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "SpacerBushingSpec":
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
class SpacerBushingResult:
    """Output bundle from generating a Cylindrical Spacer / Bushing."""

    spec: SpacerBushingSpec
    effective_dimensions: EffectiveSpacerDimensions
    profile_points_mm: Tuple[Tuple[float, float], ...]
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def render_spacer_bushing_scad(
    spec: SpacerBushingSpec,
    effective: EffectiveSpacerDimensions,
) -> str:
    """Render deterministic, axisymmetric `rotate_extrude` OpenSCAD source for `spacer_bushing`."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — Spacer / Bushing ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        "// Orientation : Axisymmetric on Z; bottom face at Z = 0, top face at Z = height_mm",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.spacer_bushing (Phase 4)",
        "// NOTE        : Nominal dimensions are preserved verbatim below.",
        "//               Radial clearance_mm reduces outer_diameter_mm by 2*clearance_mm",
        "//               and enlarges inner_diameter_mm by 2*clearance_mm.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"outer_diameter_mm = {format_mm(spec.outer_diameter_mm)};",
        f"inner_diameter_mm = {format_mm(spec.inner_diameter_mm)};",
        f"height_mm         = {format_mm(spec.height_mm)};",
        f"top_chamfer_mm    = {format_mm(spec.top_chamfer_mm)};",
        f"bottom_chamfer_mm = {format_mm(spec.bottom_chamfer_mm)};",
        f"clearance_mm      = {format_mm(spec.clearance_mm)};",
        f"facet_count       = {spec.fn};",
        "",
        "// --- Derived Effective Dimensions (mm) ---",
        f"// effective_outer_diameter_mm = {format_mm(effective.outer_diameter_mm)}",
        f"// effective_inner_diameter_mm = {format_mm(effective.inner_diameter_mm)}",
        f"// effective_radial_wall_mm    = {format_mm(effective.radial_wall_thickness_mm)}",
        f"// profile_vertex_count        = {len(effective.profile_points_mm)}",
        "",
        "module spacer_bushing(",
        "    outer_diameter = outer_diameter_mm,",
        "    inner_diameter = inner_diameter_mm,",
        "    height = height_mm,",
        "    top_chamfer = top_chamfer_mm,",
        "    bottom_chamfer = bottom_chamfer_mm,",
        "    clearance = clearance_mm,",
        "    fn = facet_count",
        ") {",
        "    eff_od = outer_diameter - (2 * clearance);",
        "    eff_id = inner_diameter + (2 * clearance);",
        "    r_out  = eff_od / 2;",
        "    r_in   = eff_id / 2;",
        "",
        "    profile = concat(",
        "        [[r_in, 0]],",
        "        bottom_chamfer > 0 ? [[r_out - bottom_chamfer, 0], [r_out, bottom_chamfer]] : [[r_out, 0]],",
        "        top_chamfer > 0 ? [[r_out, height - top_chamfer], [r_out - top_chamfer, height]] : [[r_out, height]],",
        "        [[r_in, height]]",
        "    );",
        "",
        "    rotate_extrude(angle = 360, convexity = 4, $fn = fn)",
        "        polygon(points = profile);",
        "}",
        "",
        "spacer_bushing();",
        "",
    ]
    return "\n".join(lines)


def generate_spacer_bushing(spec: SpacerBushingSpec | Mapping[str, Any]) -> SpacerBushingResult:
    """Validate *spec* and generate a deterministic Spacer / Bushing OpenSCAD bundle."""
    validated = spec if isinstance(spec, SpacerBushingSpec) else SpacerBushingSpec.from_dict(spec)
    effective = validate_spacer_bushing_dimensions(
        outer_diameter_mm=validated.outer_diameter_mm,
        inner_diameter_mm=validated.inner_diameter_mm,
        height_mm=validated.height_mm,
        top_chamfer_mm=validated.top_chamfer_mm,
        bottom_chamfer_mm=validated.bottom_chamfer_mm,
        clearance_mm=validated.clearance_mm,
        fn=validated.fn,
    )
    scad_source = render_spacer_bushing_scad(validated, effective)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return SpacerBushingResult(
        spec=validated,
        effective_dimensions=effective,
        profile_points_mm=effective.profile_points_mm,
        scad_source=scad_source,
        spec_sha256=validated.spec_sha256(),
        scad_sha256=scad_sha,
    )

