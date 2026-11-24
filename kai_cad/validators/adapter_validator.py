"""Strict parameter and geometric feasibility validator for Custom Adapter specs."""

from __future__ import annotations

import math
from typing import Any, List, Mapping, Optional, Sequence, Tuple

from kai_cad.geometry.primitives import (
    MIN_FEATURE_EPSILON_MM,
    EffectiveAdapterDimensions,
    build_stepped_adapter_profile,
    compute_effective_adapter_dimensions,
    validate_profile_polygon,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue

REQUIRED_ADAPTER_FIELDS: Tuple[str, ...] = (
    "overall_length_mm",
    "body_diameter_mm",
    "end_a_diameter_mm",
    "end_b_diameter_mm",
    "end_a_length_mm",
    "end_b_length_mm",
    "bore_a_diameter_mm",
    "bore_b_diameter_mm",
)

PER_INTERFACE_CLEARANCE_FIELDS: Tuple[str, ...] = (
    "body_clearance_mm",
    "end_a_clearance_mm",
    "end_b_clearance_mm",
    "bore_a_clearance_mm",
    "bore_b_clearance_mm",
)

OPTIONAL_NUMERIC_FIELDS: Tuple[str, ...] = (
    "chamfer_mm",
    "clearance_mm",
) + PER_INTERFACE_CLEARANCE_FIELDS

ALLOWED_SPEC_FIELDS = frozenset(
    REQUIRED_ADAPTER_FIELDS
    + OPTIONAL_NUMERIC_FIELDS
    + ("name", "description", "units", "fn")
)


def _is_valid_number(value: Any) -> bool:
    """Return True if value is a finite real number (excluding bool)."""
    if isinstance(value, bool):
        return False
    if not isinstance(value, (int, float)):
        return False
    return math.isfinite(float(value))


def validate_adapter_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw JSON/dict adapter configuration before constructing a spec.

    Raises GeometryValidationError if required fields are missing, units are not
    millimetres, types are invalid, or any geometric constraint fails.
    """
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Adapter configuration must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []

    units = raw.get("units", "mm")
    if not isinstance(units, str) or units.strip().lower() != "mm":
        issues.append(
            ValidationIssue(
                "units",
                "INVALID_UNITS",
                f"KAI CAD Studio requires millimetres ('mm'); got {units!r}.",
            )
        )

    unknown_keys = sorted(set(raw.keys()) - ALLOWED_SPEC_FIELDS)
    for key in unknown_keys:
        issues.append(
            ValidationIssue(
                key,
                "UNKNOWN_PARAMETER",
                f"Unrecognized adapter parameter '{key}'.",
            )
        )

    for field_name in REQUIRED_ADAPTER_FIELDS:
        if field_name not in raw or raw[field_name] is None:
            issues.append(
                ValidationIssue(
                    field_name,
                    "MISSING_PARAMETER",
                    f"Required parameter '{field_name}' is missing.",
                )
            )
        elif not _is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_NUMERIC_FIELDS:
        if field_name in raw and raw[field_name] is not None and not _is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    if "fn" in raw and raw["fn"] is not None:
        fn_val = raw["fn"]
        if isinstance(fn_val, bool) or not isinstance(fn_val, int):
            issues.append(
                ValidationIssue("fn", "INVALID_TYPE", f"'fn' must be an integer; got {fn_val!r}.")
            )

    if "name" in raw and raw["name"] is not None:
        if not isinstance(raw["name"], str) or not raw["name"].strip():
            issues.append(
                ValidationIssue("name", "INVALID_TYPE", "'name' must be a non-empty string.")
            )

    if issues:
        raise GeometryValidationError(issues)

    def _opt_float(key: str) -> Optional[float]:
        val = raw.get(key)
        return None if val is None else float(val)

    validate_adapter_dimensions(
        overall_length_mm=float(raw["overall_length_mm"]),
        body_diameter_mm=float(raw["body_diameter_mm"]),
        end_a_diameter_mm=float(raw["end_a_diameter_mm"]),
        end_b_diameter_mm=float(raw["end_b_diameter_mm"]),
        end_a_length_mm=float(raw["end_a_length_mm"]),
        end_b_length_mm=float(raw["end_b_length_mm"]),
        bore_a_diameter_mm=float(raw["bore_a_diameter_mm"]),
        bore_b_diameter_mm=float(raw["bore_b_diameter_mm"]),
        chamfer_mm=0.0 if raw.get("chamfer_mm") is None else float(raw["chamfer_mm"]),
        clearance_mm=0.0 if raw.get("clearance_mm") is None else float(raw["clearance_mm"]),
        body_clearance_mm=_opt_float("body_clearance_mm"),
        end_a_clearance_mm=_opt_float("end_a_clearance_mm"),
        end_b_clearance_mm=_opt_float("end_b_clearance_mm"),
        bore_a_clearance_mm=_opt_float("bore_a_clearance_mm"),
        bore_b_clearance_mm=_opt_float("bore_b_clearance_mm"),
        fn=96 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_adapter_dimensions(
    *,
    overall_length_mm: float,
    body_diameter_mm: float,
    end_a_diameter_mm: float,
    end_b_diameter_mm: float,
    end_a_length_mm: float,
    end_b_length_mm: float,
    bore_a_diameter_mm: float,
    bore_b_diameter_mm: float,
    chamfer_mm: float = 0.0,
    clearance_mm: float = 0.0,
    body_clearance_mm: Optional[float] = None,
    end_a_clearance_mm: Optional[float] = None,
    end_b_clearance_mm: Optional[float] = None,
    bore_a_clearance_mm: Optional[float] = None,
    bore_b_clearance_mm: Optional[float] = None,
    fn: int = 96,
) -> EffectiveAdapterDimensions:
    """Validate all Custom Adapter dimensions and return computed effective dimensions.

    Never mutates or clamps user-specified dimensions. Raises GeometryValidationError
    with all detected issues when geometry is invalid, degenerate, or physically impossible.
    """
    issues: List[ValidationIssue] = []

    strictly_positive: Sequence[Tuple[str, float]] = (
        ("overall_length_mm", overall_length_mm),
        ("body_diameter_mm", body_diameter_mm),
        ("end_a_diameter_mm", end_a_diameter_mm),
        ("end_b_diameter_mm", end_b_diameter_mm),
        ("end_a_length_mm", end_a_length_mm),
        ("end_b_length_mm", end_b_length_mm),
    )
    for name, val in strictly_positive:
        if not _is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(
                ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}.")
            )
        elif float(val) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    name,
                    "DEGENERATE_DIMENSION",
                    f"'{name}' ({val} mm) is below minimum geometric resolution ({MIN_FEATURE_EPSILON_MM} mm).",
                )
            )

    non_negative: Sequence[Tuple[str, float]] = (
        ("bore_a_diameter_mm", bore_a_diameter_mm),
        ("bore_b_diameter_mm", bore_b_diameter_mm),
        ("chamfer_mm", chamfer_mm),
        ("clearance_mm", clearance_mm),
    )
    for name, val in non_negative:
        if not _is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) < 0.0:
            issues.append(
                ValidationIssue(name, "NEGATIVE_DIMENSION", f"'{name}' must be >= 0 mm; got {val}.")
            )
        elif 0.0 < float(val) < MIN_FEATURE_EPSILON_MM and name in ("bore_a_diameter_mm", "bore_b_diameter_mm", "chamfer_mm"):
            issues.append(
                ValidationIssue(
                    name,
                    "DEGENERATE_DIMENSION",
                    f"Non-zero '{name}' ({val} mm) is below minimum geometric resolution ({MIN_FEATURE_EPSILON_MM} mm).",
                )
            )

    optional_clearances: Sequence[Tuple[str, Optional[float]]] = (
        ("body_clearance_mm", body_clearance_mm),
        ("end_a_clearance_mm", end_a_clearance_mm),
        ("end_b_clearance_mm", end_b_clearance_mm),
        ("bore_a_clearance_mm", bore_a_clearance_mm),
        ("bore_b_clearance_mm", bore_b_clearance_mm),
    )
    for name, val in optional_clearances:
        if val is None:
            continue
        if not _is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) < 0.0:
            issues.append(
                ValidationIssue(name, "NEGATIVE_DIMENSION", f"'{name}' must be >= 0 mm; got {val}.")
            )

    if isinstance(fn, bool) or not isinstance(fn, int) or fn < 16 or fn > 720:
        issues.append(
            ValidationIssue("fn", "INVALID_FACET_COUNT", f"'fn' must be an integer in [16, 720]; got {fn!r}.")
        )

    # Stop early if basic numeric positivity failed to avoid misleading secondary checks.
    if issues:
        raise GeometryValidationError(issues)

    # Reject explicit positive bore clearance on a solid (0 mm) bore to avoid silently ignoring input.
    if bore_a_diameter_mm == 0.0 and bore_a_clearance_mm is not None and bore_a_clearance_mm > 0.0:
        issues.append(
            ValidationIssue(
                "bore_a_clearance_mm",
                "CLEARANCE_ON_ZERO_BORE",
                "Explicit bore_a_clearance_mm > 0 cannot be applied when bore_a_diameter_mm is 0.",
            )
        )
    if bore_b_diameter_mm == 0.0 and bore_b_clearance_mm is not None and bore_b_clearance_mm > 0.0:
        issues.append(
            ValidationIssue(
                "bore_b_clearance_mm",
                "CLEARANCE_ON_ZERO_BORE",
                "Explicit bore_b_clearance_mm > 0 cannot be applied when bore_b_diameter_mm is 0.",
            )
        )

    # Shoulder & overall length feasibility
    combined_shoulders = end_a_length_mm + end_b_length_mm
    body_length = overall_length_mm - combined_shoulders
    if combined_shoulders >= overall_length_mm:
        issues.append(
            ValidationIssue(
                "overall_length_mm",
                "INVALID_SHOULDER_CONFIGURATION",
                (
                    f"Sum of shoulder lengths (end_a_length_mm={end_a_length_mm} + "
                    f"end_b_length_mm={end_b_length_mm} = {combined_shoulders} mm) must be strictly "
                    f"less than overall_length_mm ({overall_length_mm} mm) to leave a positive central body."
                ),
            )
        )
    elif body_length < MIN_FEATURE_EPSILON_MM:
        issues.append(
            ValidationIssue(
                "overall_length_mm",
                "DEGENERATE_BODY_LENGTH",
                (
                    f"Remaining central body length ({body_length} mm) is below minimum geometric "
                    f"resolution ({MIN_FEATURE_EPSILON_MM} mm)."
                ),
            )
        )

    # Nominal bore vs outer diameter checks
    if bore_a_diameter_mm > 0.0:
        if bore_a_diameter_mm >= end_a_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_a_diameter_mm",
                    "BORE_EXCEEDS_OUTER_DIAMETER",
                    (
                        f"bore_a_diameter_mm ({bore_a_diameter_mm} mm) must be strictly less than "
                        f"end_a_diameter_mm ({end_a_diameter_mm} mm)."
                    ),
                )
            )
        if bore_a_diameter_mm >= body_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_a_diameter_mm",
                    "BORE_EXCEEDS_BODY_DIAMETER",
                    (
                        f"bore_a_diameter_mm ({bore_a_diameter_mm} mm) must be strictly less than "
                        f"body_diameter_mm ({body_diameter_mm} mm)."
                    ),
                )
            )

    if bore_b_diameter_mm > 0.0:
        if bore_b_diameter_mm >= end_b_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_b_diameter_mm",
                    "BORE_EXCEEDS_OUTER_DIAMETER",
                    (
                        f"bore_b_diameter_mm ({bore_b_diameter_mm} mm) must be strictly less than "
                        f"end_b_diameter_mm ({end_b_diameter_mm} mm)."
                    ),
                )
            )
        if bore_b_diameter_mm >= body_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_b_diameter_mm",
                    "BORE_EXCEEDS_BODY_DIAMETER",
                    (
                        f"bore_b_diameter_mm ({bore_b_diameter_mm} mm) must be strictly less than "
                        f"body_diameter_mm ({body_diameter_mm} mm)."
                    ),
                )
            )

    # Compute clearance-adjusted effective dimensions and validate feasibility
    eff = compute_effective_adapter_dimensions(
        overall_length_mm=overall_length_mm,
        body_diameter_mm=body_diameter_mm,
        end_a_diameter_mm=end_a_diameter_mm,
        end_b_diameter_mm=end_b_diameter_mm,
        end_a_length_mm=end_a_length_mm,
        end_b_length_mm=end_b_length_mm,
        bore_a_diameter_mm=bore_a_diameter_mm,
        bore_b_diameter_mm=bore_b_diameter_mm,
        chamfer_mm=chamfer_mm,
        clearance_mm=clearance_mm,
        body_clearance_mm=body_clearance_mm,
        end_a_clearance_mm=end_a_clearance_mm,
        end_b_clearance_mm=end_b_clearance_mm,
        bore_a_clearance_mm=bore_a_clearance_mm,
        bore_b_clearance_mm=bore_b_clearance_mm,
    )

    if eff.end_a_diameter_mm < MIN_FEATURE_EPSILON_MM:
        issues.append(
            ValidationIssue(
                "end_a_clearance_mm" if end_a_clearance_mm is not None else "clearance_mm",
                "CLEARANCE_COLLAPSES_DIAMETER",
                f"Resolved End A clearance ({eff.end_a_clearance_mm} mm) collapses effective end_a_diameter_mm to {eff.end_a_diameter_mm} mm.",
            )
        )
    if eff.body_diameter_mm < MIN_FEATURE_EPSILON_MM:
        issues.append(
            ValidationIssue(
                "body_clearance_mm" if body_clearance_mm is not None else "clearance_mm",
                "CLEARANCE_COLLAPSES_DIAMETER",
                f"Resolved body clearance ({eff.body_clearance_mm} mm) collapses effective body_diameter_mm to {eff.body_diameter_mm} mm.",
            )
        )
    if eff.end_b_diameter_mm < MIN_FEATURE_EPSILON_MM:
        issues.append(
            ValidationIssue(
                "end_b_clearance_mm" if end_b_clearance_mm is not None else "clearance_mm",
                "CLEARANCE_COLLAPSES_DIAMETER",
                f"Resolved End B clearance ({eff.end_b_clearance_mm} mm) collapses effective end_b_diameter_mm to {eff.end_b_diameter_mm} mm.",
            )
        )

    if eff.bore_a_diameter_mm > 0.0 and eff.end_a_diameter_mm >= MIN_FEATURE_EPSILON_MM:
        if eff.bore_a_diameter_mm >= eff.end_a_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_a_clearance_mm" if bore_a_clearance_mm is not None else "clearance_mm",
                    "EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER",
                    (
                        f"After applying clearances, effective bore_a ({eff.bore_a_diameter_mm} mm) "
                        f"meets or exceeds effective end_a OD ({eff.end_a_diameter_mm} mm)."
                    ),
                )
            )
        elif (eff.end_a_diameter_mm - eff.bore_a_diameter_mm) / 2.0 < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "bore_a_diameter_mm",
                    "DEGENERATE_WALL_THICKNESS",
                    "Effective End A radial wall thickness is below minimum geometric resolution.",
                )
            )
        if eff.bore_a_diameter_mm >= eff.body_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_a_clearance_mm" if bore_a_clearance_mm is not None else "clearance_mm",
                    "EFFECTIVE_BORE_EXCEEDS_BODY_DIAMETER",
                    (
                        f"After applying clearances, effective bore_a ({eff.bore_a_diameter_mm} mm) "
                        f"meets or exceeds effective body OD ({eff.body_diameter_mm} mm)."
                    ),
                )
            )
        elif (eff.body_diameter_mm - eff.bore_a_diameter_mm) / 2.0 < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "bore_a_diameter_mm",
                    "DEGENERATE_WALL_THICKNESS",
                    "Effective body radial wall thickness at Bore A is below minimum geometric resolution.",
                )
            )

    if eff.bore_b_diameter_mm > 0.0 and eff.end_b_diameter_mm >= MIN_FEATURE_EPSILON_MM:
        if eff.bore_b_diameter_mm >= eff.end_b_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_b_clearance_mm" if bore_b_clearance_mm is not None else "clearance_mm",
                    "EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER",
                    (
                        f"After applying clearances, effective bore_b ({eff.bore_b_diameter_mm} mm) "
                        f"meets or exceeds effective end_b OD ({eff.end_b_diameter_mm} mm)."
                    ),
                )
            )
        elif (eff.end_b_diameter_mm - eff.bore_b_diameter_mm) / 2.0 < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "bore_b_diameter_mm",
                    "DEGENERATE_WALL_THICKNESS",
                    "Effective End B radial wall thickness is below minimum geometric resolution.",
                )
            )
        if eff.bore_b_diameter_mm >= eff.body_diameter_mm:
            issues.append(
                ValidationIssue(
                    "bore_b_clearance_mm" if bore_b_clearance_mm is not None else "clearance_mm",
                    "EFFECTIVE_BORE_EXCEEDS_BODY_DIAMETER",
                    (
                        f"After applying clearances, effective bore_b ({eff.bore_b_diameter_mm} mm) "
                        f"meets or exceeds effective body OD ({eff.body_diameter_mm} mm)."
                    ),
                )
            )
        elif (eff.body_diameter_mm - eff.bore_b_diameter_mm) / 2.0 < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "bore_b_diameter_mm",
                    "DEGENERATE_WALL_THICKNESS",
                    "Effective body radial wall thickness at Bore B is below minimum geometric resolution.",
                )
            )

    # Chamfer checks
    if chamfer_mm > 0.0:
        if chamfer_mm >= end_a_length_mm:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "CHAMFER_EXCEEDS_SHOULDER_LENGTH",
                    f"chamfer_mm ({chamfer_mm} mm) must be strictly less than end_a_length_mm ({end_a_length_mm} mm).",
                )
            )
        elif (end_a_length_mm - chamfer_mm) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "DEGENERATE_CHAMFER_MARGIN",
                    "Remaining End A straight shoulder length after chamfer is below minimum geometric resolution.",
                )
            )
        if chamfer_mm >= end_b_length_mm:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "CHAMFER_EXCEEDS_SHOULDER_LENGTH",
                    f"chamfer_mm ({chamfer_mm} mm) must be strictly less than end_b_length_mm ({end_b_length_mm} mm).",
                )
            )
        elif (end_b_length_mm - chamfer_mm) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "DEGENERATE_CHAMFER_MARGIN",
                    "Remaining End B straight shoulder length after chamfer is below minimum geometric resolution.",
                )
            )
        end_a_radial_wall = (eff.end_a_diameter_mm - eff.bore_a_diameter_mm) / 2.0
        if chamfer_mm >= end_a_radial_wall:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "CHAMFER_EXCEEDS_WALL_THICKNESS",
                    (
                        f"chamfer_mm ({chamfer_mm} mm) must be strictly less than End A radial wall "
                        f"thickness ({end_a_radial_wall} mm)."
                    ),
                )
            )
        elif (end_a_radial_wall - chamfer_mm) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "DEGENERATE_CHAMFER_MARGIN",
                    "Remaining End A face width after chamfer is below minimum geometric resolution.",
                )
            )
        end_b_radial_wall = (eff.end_b_diameter_mm - eff.bore_b_diameter_mm) / 2.0
        if chamfer_mm >= end_b_radial_wall:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "CHAMFER_EXCEEDS_WALL_THICKNESS",
                    (
                        f"chamfer_mm ({chamfer_mm} mm) must be strictly less than End B radial wall "
                        f"thickness ({end_b_radial_wall} mm)."
                    ),
                )
            )
        elif (end_b_radial_wall - chamfer_mm) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "chamfer_mm",
                    "DEGENERATE_CHAMFER_MARGIN",
                    "Remaining End B face width after chamfer is below minimum geometric resolution.",
                )
            )

    if issues:
        raise GeometryValidationError(issues)

    # Final 2D polygon integrity check (non-degenerate, positive CCW area, non-self-intersecting).
    profile = build_stepped_adapter_profile(eff)
    try:
        validate_profile_polygon(profile)
    except ValueError as exc:
        raise GeometryValidationError(
            [ValidationIssue("profile", "DEGENERATE_PROFILE", str(exc))]
        ) from exc

    return eff
