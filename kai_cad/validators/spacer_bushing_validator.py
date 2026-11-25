"""Strict parameter and geometric validator for Spacer / Bushing (`spacer_bushing`)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Mapping, Tuple

from kai_cad.geometry.primitives import MIN_FEATURE_EPSILON_MM, validate_profile_polygon
from kai_cad.validators.common import (
    MIN_WALL_THICKNESS_MM,
    is_valid_int,
    is_valid_number,
    validate_common_metadata,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue

REQUIRED_SPACER_FIELDS: Tuple[str, ...] = (
    "outer_diameter_mm",
    "inner_diameter_mm",
    "height_mm",
)

OPTIONAL_SPACER_FLOAT_FIELDS: Tuple[str, ...] = (
    "top_chamfer_mm",
    "bottom_chamfer_mm",
    "clearance_mm",
)

ALLOWED_SPACER_FIELDS = frozenset(
    REQUIRED_SPACER_FIELDS
    + OPTIONAL_SPACER_FLOAT_FIELDS
    + ("name", "description", "units", "fn")
)


@dataclass(frozen=True)
class EffectiveSpacerDimensions:
    """Computed clearance-adjusted dimensions and 2D revolution profile for `spacer_bushing`."""

    outer_diameter_mm: float
    inner_diameter_mm: float
    height_mm: float
    top_chamfer_mm: float
    bottom_chamfer_mm: float
    clearance_mm: float
    radial_wall_thickness_mm: float
    profile_points_mm: Tuple[Tuple[float, float], ...]


def build_spacer_profile(
    *,
    effective_outer_diameter_mm: float,
    effective_inner_diameter_mm: float,
    height_mm: float,
    top_chamfer_mm: float,
    bottom_chamfer_mm: float,
) -> List[Tuple[float, float]]:
    """Build counter-clockwise 2D `(r, z)` profile for OpenSCAD `rotate_extrude`."""
    r_in = effective_inner_diameter_mm / 2.0
    r_out = effective_outer_diameter_mm / 2.0
    cb = bottom_chamfer_mm
    ct = top_chamfer_mm

    pts: List[Tuple[float, float]] = [(r_in, 0.0)]
    if cb > 0.0:
        pts.append((r_out - cb, 0.0))
        pts.append((r_out, cb))
    else:
        pts.append((r_out, 0.0))

    if ct > 0.0:
        pts.append((r_out, height_mm - ct))
        pts.append((r_out - ct, height_mm))
    else:
        pts.append((r_out, height_mm))

    pts.append((r_in, height_mm))
    return pts


def validate_spacer_bushing_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw dict configuration for `spacer_bushing`."""
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Spacer / bushing spec must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []
    validate_common_metadata(raw, ALLOWED_SPACER_FIELDS, issues)

    for field_name in REQUIRED_SPACER_FIELDS:
        if field_name not in raw or raw[field_name] is None:
            issues.append(
                ValidationIssue(field_name, "MISSING_PARAMETER", f"Required parameter '{field_name}' is missing.")
            )
        elif not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_SPACER_FLOAT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    if issues:
        raise GeometryValidationError(issues)

    validate_spacer_bushing_dimensions(
        outer_diameter_mm=float(raw["outer_diameter_mm"]),
        inner_diameter_mm=float(raw["inner_diameter_mm"]),
        height_mm=float(raw["height_mm"]),
        top_chamfer_mm=0.0 if raw.get("top_chamfer_mm") is None else float(raw["top_chamfer_mm"]),
        bottom_chamfer_mm=0.0 if raw.get("bottom_chamfer_mm") is None else float(raw["bottom_chamfer_mm"]),
        clearance_mm=0.0 if raw.get("clearance_mm") is None else float(raw["clearance_mm"]),
        fn=96 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_spacer_bushing_dimensions(
    *,
    outer_diameter_mm: float,
    inner_diameter_mm: float,
    height_mm: float,
    top_chamfer_mm: float = 0.0,
    bottom_chamfer_mm: float = 0.0,
    clearance_mm: float = 0.0,
    fn: int = 96,
) -> EffectiveSpacerDimensions:
    """Validate all dimensions, wall thickness, clearances, and chamfers for `spacer_bushing`."""
    issues: List[ValidationIssue] = []

    for name, val in (
        ("outer_diameter_mm", outer_diameter_mm),
        ("inner_diameter_mm", inner_diameter_mm),
        ("height_mm", height_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))
        elif float(val) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(name, "DEGENERATE_DIMENSION", f"'{name}' is below minimum geometric resolution.")
            )

    for name, val in (
        ("top_chamfer_mm", top_chamfer_mm),
        ("bottom_chamfer_mm", bottom_chamfer_mm),
        ("clearance_mm", clearance_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) < 0.0:
            issues.append(ValidationIssue(name, "NEGATIVE_DIMENSION", f"'{name}' must be >= 0 mm; got {val}."))
        elif 0.0 < float(val) < MIN_FEATURE_EPSILON_MM and name != "clearance_mm":
            issues.append(
                ValidationIssue(name, "DEGENERATE_DIMENSION", f"Non-zero '{name}' is below minimum resolution.")
            )

    if not is_valid_int(fn) or fn < 16 or fn > 720:
        issues.append(ValidationIssue("fn", "INVALID_FACET_COUNT", f"'fn' must be an integer in [16, 720]; got {fn!r}."))

    if issues:
        raise GeometryValidationError(issues)

    # Nominal ID < OD check
    if inner_diameter_mm >= outer_diameter_mm:
        issues.append(
            ValidationIssue(
                "inner_diameter_mm",
                "BORE_EXCEEDS_OUTER_DIAMETER",
                (
                    f"inner_diameter_mm ({inner_diameter_mm} mm) must be strictly less than "
                    f"outer_diameter_mm ({outer_diameter_mm} mm)."
                ),
            )
        )

    eff_od = outer_diameter_mm - (2.0 * clearance_mm)
    eff_id = inner_diameter_mm + (2.0 * clearance_mm)
    radial_wall = (eff_od - eff_id) / 2.0

    if eff_od < MIN_FEATURE_EPSILON_MM:
        issues.append(
            ValidationIssue(
                "clearance_mm",
                "CLEARANCE_COLLAPSES_DIAMETER",
                f"clearance_mm ({clearance_mm} mm) collapses effective outer_diameter_mm to {eff_od} mm.",
            )
        )
    elif eff_id >= eff_od:
        issues.append(
            ValidationIssue(
                "clearance_mm",
                "EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER",
                (
                    f"After applying clearance_mm={clearance_mm} mm, effective inner_diameter_mm ({eff_id} mm) "
                    f"meets or exceeds effective outer_diameter_mm ({eff_od} mm)."
                ),
            )
        )
    elif radial_wall < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "inner_diameter_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                (
                    f"Effective radial wall thickness ({radial_wall:.4f} mm) must be >= "
                    f"{MIN_WALL_THICKNESS_MM} mm."
                ),
            )
        )

    # Chamfer checks
    if top_chamfer_mm > 0.0 or bottom_chamfer_mm > 0.0:
        combined_chamfers = top_chamfer_mm + bottom_chamfer_mm
        if combined_chamfers >= height_mm or (height_mm - combined_chamfers) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "top_chamfer_mm",
                    "CHAMFER_EXCEEDS_HEIGHT",
                    (
                        f"top_chamfer_mm ({top_chamfer_mm}) + bottom_chamfer_mm ({bottom_chamfer_mm}) = "
                        f"{combined_chamfers} mm must be strictly less than height_mm ({height_mm} mm)."
                    ),
                )
            )
        if top_chamfer_mm > 0.0 and (
            top_chamfer_mm >= radial_wall or (radial_wall - top_chamfer_mm) < MIN_FEATURE_EPSILON_MM
        ):
            issues.append(
                ValidationIssue(
                    "top_chamfer_mm",
                    "CHAMFER_EXCEEDS_WALL_THICKNESS",
                    f"top_chamfer_mm ({top_chamfer_mm} mm) must be strictly less than radial wall ({radial_wall:.4f} mm).",
                )
            )
        if bottom_chamfer_mm > 0.0 and (
            bottom_chamfer_mm >= radial_wall or (radial_wall - bottom_chamfer_mm) < MIN_FEATURE_EPSILON_MM
        ):
            issues.append(
                ValidationIssue(
                    "bottom_chamfer_mm",
                    "CHAMFER_EXCEEDS_WALL_THICKNESS",
                    (
                        f"bottom_chamfer_mm ({bottom_chamfer_mm} mm) must be strictly less than radial wall "
                        f"({radial_wall:.4f} mm)."
                    ),
                )
            )

    if issues:
        raise GeometryValidationError(issues)

    profile = build_spacer_profile(
        effective_outer_diameter_mm=eff_od,
        effective_inner_diameter_mm=eff_id,
        height_mm=height_mm,
        top_chamfer_mm=top_chamfer_mm,
        bottom_chamfer_mm=bottom_chamfer_mm,
    )
    try:
        validate_profile_polygon(profile)
    except ValueError as exc:
        raise GeometryValidationError([ValidationIssue("profile", "DEGENERATE_PROFILE", str(exc))]) from exc

    return EffectiveSpacerDimensions(
        outer_diameter_mm=eff_od,
        inner_diameter_mm=eff_id,
        height_mm=height_mm,
        top_chamfer_mm=top_chamfer_mm,
        bottom_chamfer_mm=bottom_chamfer_mm,
        clearance_mm=clearance_mm,
        radial_wall_thickness_mm=radial_wall,
        profile_points_mm=tuple(profile),
    )

