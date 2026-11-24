"""Parametric Custom Adapter generator producing deterministic OpenSCAD (.scad) source."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Tuple

from kai_cad.geometry.primitives import (
    EffectiveAdapterDimensions,
    build_stepped_adapter_profile,
    format_mm,
)
from kai_cad.validators.adapter_validator import (
    validate_adapter_dict,
    validate_adapter_dimensions,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue


@dataclass(frozen=True)
class CustomAdapterSpec:
    """Immutable parametric specification for a stepped cylindrical Custom Adapter (all mm).

    User-specified dimensions are preserved verbatim and never silently modified.
    """

    overall_length_mm: float
    body_diameter_mm: float
    end_a_diameter_mm: float
    end_b_diameter_mm: float
    end_a_length_mm: float
    end_b_length_mm: float
    bore_a_diameter_mm: float
    bore_b_diameter_mm: float
    chamfer_mm: float = 0.0
    clearance_mm: float = 0.0
    name: str = "custom_adapter"
    description: str = "Parametric stepped cylindrical adapter"
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
        validate_adapter_dimensions(
            overall_length_mm=self.overall_length_mm,
            body_diameter_mm=self.body_diameter_mm,
            end_a_diameter_mm=self.end_a_diameter_mm,
            end_b_diameter_mm=self.end_b_diameter_mm,
            end_a_length_mm=self.end_a_length_mm,
            end_b_length_mm=self.end_b_length_mm,
            bore_a_diameter_mm=self.bore_a_diameter_mm,
            bore_b_diameter_mm=self.bore_b_diameter_mm,
            chamfer_mm=self.chamfer_mm,
            clearance_mm=self.clearance_mm,
            fn=self.fn,
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "CustomAdapterSpec":
        """Validate a raw dictionary and construct an immutable CustomAdapterSpec."""
        validate_adapter_dict(data)
        return cls(
            overall_length_mm=float(data["overall_length_mm"]),
            body_diameter_mm=float(data["body_diameter_mm"]),
            end_a_diameter_mm=float(data["end_a_diameter_mm"]),
            end_b_diameter_mm=float(data["end_b_diameter_mm"]),
            end_a_length_mm=float(data["end_a_length_mm"]),
            end_b_length_mm=float(data["end_b_length_mm"]),
            bore_a_diameter_mm=float(data["bore_a_diameter_mm"]),
            bore_b_diameter_mm=float(data["bore_b_diameter_mm"]),
            chamfer_mm=float(data.get("chamfer_mm", 0.0) if data.get("chamfer_mm") is not None else 0.0),
            clearance_mm=float(data.get("clearance_mm", 0.0) if data.get("clearance_mm") is not None else 0.0),
            name=str(data.get("name", "custom_adapter")).strip(),
            description=str(data.get("description", "Parametric stepped cylindrical adapter")),
            units="mm",
            fn=int(data.get("fn", 96) if data.get("fn") is not None else 96),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> "CustomAdapterSpec":
        """Load and validate a CustomAdapterSpec from a UTF-8 JSON file."""
        file_path = Path(path)
        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except OSError as exc:
            raise FileNotFoundError(f"Could not read adapter config file '{file_path}': {exc}") from exc
        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise GeometryValidationError(
                [ValidationIssue("json", "INVALID_JSON", f"Malformed JSON in '{file_path}': {exc}")]
            ) from exc
        return cls.from_dict(payload)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize nominal specification to a JSON-compatible dictionary."""
        return asdict(self)

    def spec_sha256(self) -> str:
        """Return a deterministic SHA-256 digest of the canonical nominal spec."""
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class CustomAdapterResult:
    """Output bundle from generating a Custom Adapter."""

    spec: CustomAdapterSpec
    effective_dimensions: EffectiveAdapterDimensions
    profile_points_mm: Tuple[Tuple[float, float], ...]
    scad_source: str
    spec_sha256: str
    scad_sha256: str


def _sanitize_comment(text: str) -> str:
    """Remove newlines from comment strings to preserve valid single-line SCAD comments."""
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def render_custom_adapter_scad(
    spec: CustomAdapterSpec,
    effective: EffectiveAdapterDimensions,
    profile_points: List[Tuple[float, float]],
) -> str:
    """Render deterministic, self-contained, parametric OpenSCAD source code."""
    name_comment = _sanitize_comment(spec.name)
    desc_comment = _sanitize_comment(spec.description)
    spec_hash = spec.spec_sha256()

    lines: List[str] = [
        "// ============================================================================",
        f"// KAI CAD Studio — Custom Adapter ({name_comment})",
        f"// Description : {desc_comment}",
        "// Units       : millimetres (mm)",
        f"// Spec SHA256 : {spec_hash}",
        "// Generator   : kai_cad.generators.custom_adapter (Phase 1)",
        "// NOTE        : Nominal user dimensions are preserved verbatim below.",
        "//               Radial clearance_mm reduces outer diameters by 2*clearance_mm",
        "//               and enlarges non-zero bore diameters by 2*clearance_mm.",
        "// ============================================================================",
        "",
        "// --- Nominal User Parameters (mm) ---",
        f"overall_length_mm  = {format_mm(spec.overall_length_mm)};",
        f"body_diameter_mm   = {format_mm(spec.body_diameter_mm)};",
        f"end_a_diameter_mm  = {format_mm(spec.end_a_diameter_mm)};",
        f"end_b_diameter_mm  = {format_mm(spec.end_b_diameter_mm)};",
        f"end_a_length_mm    = {format_mm(spec.end_a_length_mm)};",
        f"end_b_length_mm    = {format_mm(spec.end_b_length_mm)};",
        f"bore_a_diameter_mm = {format_mm(spec.bore_a_diameter_mm)};",
        f"bore_b_diameter_mm = {format_mm(spec.bore_b_diameter_mm)};",
        f"chamfer_mm         = {format_mm(spec.chamfer_mm)};",
        f"clearance_mm       = {format_mm(spec.clearance_mm)};",
        f"facet_count        = {spec.fn};",
        "",
        "// --- Derived Effective Dimensions (mm, for audit & inspection) ---",
        f"// body_length_mm          = {format_mm(effective.body_length_mm)}",
        f"// effective_body_od_mm    = {format_mm(effective.body_diameter_mm)}",
        f"// effective_end_a_od_mm   = {format_mm(effective.end_a_diameter_mm)}",
        f"// effective_end_b_od_mm   = {format_mm(effective.end_b_diameter_mm)}",
        f"// effective_bore_a_mm     = {format_mm(effective.bore_a_diameter_mm)}",
        f"// effective_bore_b_mm     = {format_mm(effective.bore_b_diameter_mm)}",
        f"// profile_vertex_count    = {len(profile_points)}",
        "",
        "module custom_adapter(",
        "    overall_length = overall_length_mm,",
        "    body_diameter = body_diameter_mm,",
        "    end_a_diameter = end_a_diameter_mm,",
        "    end_b_diameter = end_b_diameter_mm,",
        "    end_a_length = end_a_length_mm,",
        "    end_b_length = end_b_length_mm,",
        "    bore_a_diameter = bore_a_diameter_mm,",
        "    bore_b_diameter = bore_b_diameter_mm,",
        "    chamfer = chamfer_mm,",
        "    clearance = clearance_mm,",
        "    fn = facet_count",
        ") {",
        "    body_length = overall_length - (end_a_length + end_b_length);",
        "    z1 = end_a_length;",
        "    z2 = end_a_length + body_length;",
        "    z_mid = end_a_length + (body_length / 2);",
        "",
        "    eff_end_a_od = end_a_diameter - (2 * clearance);",
        "    eff_body_od  = body_diameter - (2 * clearance);",
        "    eff_end_b_od = end_b_diameter - (2 * clearance);",
        "    eff_bore_a   = bore_a_diameter > 0 ? bore_a_diameter + (2 * clearance) : 0;",
        "    eff_bore_b   = bore_b_diameter > 0 ? bore_b_diameter + (2 * clearance) : 0;",
        "",
        "    ra_out    = eff_end_a_od / 2;",
        "    rbody_out = eff_body_od / 2;",
        "    rb_out    = eff_end_b_od / 2;",
        "    ra_in     = eff_bore_a / 2;",
        "    rb_in     = eff_bore_b / 2;",
        "",
        "    profile = concat(",
        "        [[ra_in, 0]],",
        "        chamfer > 0 ? [[ra_out - chamfer, 0], [ra_out, chamfer]] : [[ra_out, 0]],",
        "        [[ra_out, z1]],",
        "        abs(rbody_out - ra_out) > 1e-9 ? [[rbody_out, z1]] : [],",
        "        [[rbody_out, z2]],",
        "        abs(rb_out - rbody_out) > 1e-9 ? [[rb_out, z2]] : [],",
        "        chamfer > 0 ? [[rb_out, overall_length - chamfer], [rb_out - chamfer, overall_length]] : [[rb_out, overall_length]],",
        "        [[rb_in, overall_length]],",
        "        abs(rb_in - ra_in) > 1e-9 ? [[rb_in, z_mid], [ra_in, z_mid]] : []",
        "    );",
        "",
        "    rotate_extrude(angle = 360, convexity = 10, $fn = fn)",
        "        polygon(points = profile);",
        "}",
        "",
        "custom_adapter();",
        "",
    ]
    return "\n".join(lines)


def generate_custom_adapter(spec: CustomAdapterSpec | Mapping[str, Any]) -> CustomAdapterResult:
    """Validate *spec* and generate a reproducible Custom Adapter OpenSCAD source bundle."""
    validated_spec = spec if isinstance(spec, CustomAdapterSpec) else CustomAdapterSpec.from_dict(spec)
    effective = validate_adapter_dimensions(
        overall_length_mm=validated_spec.overall_length_mm,
        body_diameter_mm=validated_spec.body_diameter_mm,
        end_a_diameter_mm=validated_spec.end_a_diameter_mm,
        end_b_diameter_mm=validated_spec.end_b_diameter_mm,
        end_a_length_mm=validated_spec.end_a_length_mm,
        end_b_length_mm=validated_spec.end_b_length_mm,
        bore_a_diameter_mm=validated_spec.bore_a_diameter_mm,
        bore_b_diameter_mm=validated_spec.bore_b_diameter_mm,
        chamfer_mm=validated_spec.chamfer_mm,
        clearance_mm=validated_spec.clearance_mm,
        fn=validated_spec.fn,
    )
    profile_points = build_stepped_adapter_profile(effective)
    scad_source = render_custom_adapter_scad(validated_spec, effective, profile_points)
    scad_sha = hashlib.sha256(scad_source.encode("utf-8")).hexdigest()
    return CustomAdapterResult(
        spec=validated_spec,
        effective_dimensions=effective,
        profile_points_mm=tuple(profile_points),
        scad_source=scad_source,
        spec_sha256=validated_spec.spec_sha256(),
        scad_sha256=scad_sha,
    )
