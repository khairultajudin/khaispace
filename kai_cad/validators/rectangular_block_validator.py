"""Strict parameter and geometric validator for Rectangular Block (`rectangular_block`)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, List, Mapping, Optional, Sequence, Tuple

from kai_cad.geometry.pattern_layout import SymmetricAxisPattern, solve_symmetric_1d_pattern
from kai_cad.geometry.primitives import MIN_FEATURE_EPSILON_MM
from kai_cad.validators.common import (
    MIN_WALL_THICKNESS_MM,
    is_valid_int,
    is_valid_number,
    validate_common_metadata,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue

REQUIRED_BLOCK_FIELDS: Tuple[str, ...] = (
    "length_mm",
    "width_mm",
    "height_mm",
)

OPTIONAL_BLOCK_FLOAT_FIELDS: Tuple[str, ...] = (
    "corner_radius_mm",
    "hole_diameter_mm",
    "hole_spacing_x_mm",
    "hole_spacing_y_mm",
    "edge_margin_x_mm",
    "edge_margin_y_mm",
    "clearance_mm",
)

OPTIONAL_BLOCK_INT_FIELDS: Tuple[str, ...] = (
    "hole_count_x",
    "hole_count_y",
)

ALLOWED_BLOCK_FIELDS = frozenset(
    REQUIRED_BLOCK_FIELDS
    + OPTIONAL_BLOCK_FLOAT_FIELDS
    + OPTIONAL_BLOCK_INT_FIELDS
    + ("name", "description", "units", "fn")
)


@dataclass(frozen=True)
class EffectiveBlockDimensions:
    """Resolved geometry and hole coordinates (mm) for a Rectangular Block."""

    length_mm: float
    width_mm: float
    height_mm: float
    corner_radius_mm: float
    nominal_hole_diameter_mm: float
    effective_hole_diameter_mm: float
    clearance_mm: float
    pattern_x: SymmetricAxisPattern
    pattern_y: SymmetricAxisPattern
    hole_centers_xy_mm: Tuple[Tuple[float, float], ...]


def validate_rectangular_block_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw dict configuration for `rectangular_block`."""
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Rectangular block spec must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []
    validate_common_metadata(raw, ALLOWED_BLOCK_FIELDS, issues)

    for field_name in REQUIRED_BLOCK_FIELDS:
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

    for field_name in OPTIONAL_BLOCK_FLOAT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_BLOCK_INT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_int(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be an integer; got {raw[field_name]!r}.",
                )
            )

    if issues:
        raise GeometryValidationError(issues)

    def _opt_float(key: str) -> Optional[float]:
        v = raw.get(key)
        return None if v is None else float(v)

    validate_rectangular_block_dimensions(
        length_mm=float(raw["length_mm"]),
        width_mm=float(raw["width_mm"]),
        height_mm=float(raw["height_mm"]),
        corner_radius_mm=0.0 if raw.get("corner_radius_mm") is None else float(raw["corner_radius_mm"]),
        hole_diameter_mm=0.0 if raw.get("hole_diameter_mm") is None else float(raw["hole_diameter_mm"]),
        hole_count_x=0 if raw.get("hole_count_x") is None else int(raw["hole_count_x"]),
        hole_count_y=0 if raw.get("hole_count_y") is None else int(raw["hole_count_y"]),
        hole_spacing_x_mm=_opt_float("hole_spacing_x_mm"),
        hole_spacing_y_mm=_opt_float("hole_spacing_y_mm"),
        edge_margin_x_mm=_opt_float("edge_margin_x_mm"),
        edge_margin_y_mm=_opt_float("edge_margin_y_mm"),
        clearance_mm=0.0 if raw.get("clearance_mm") is None else float(raw["clearance_mm"]),
        fn=64 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_rectangular_block_dimensions(
    *,
    length_mm: float,
    width_mm: float,
    height_mm: float,
    corner_radius_mm: float = 0.0,
    hole_diameter_mm: float = 0.0,
    hole_count_x: int = 0,
    hole_count_y: int = 0,
    hole_spacing_x_mm: Optional[float] = None,
    hole_spacing_y_mm: Optional[float] = None,
    edge_margin_x_mm: Optional[float] = None,
    edge_margin_y_mm: Optional[float] = None,
    clearance_mm: float = 0.0,
    fn: int = 64,
) -> EffectiveBlockDimensions:
    """Validate all dimensions & hole patterns for `rectangular_block` without mutating user inputs."""
    issues: List[ValidationIssue] = []

    for name, val in (("length_mm", length_mm), ("width_mm", width_mm), ("height_mm", height_mm)):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))
        elif float(val) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(name, "DEGENERATE_DIMENSION", f"'{name}' is below minimum geometric resolution.")
            )

    for name, val in (
        ("corner_radius_mm", corner_radius_mm),
        ("hole_diameter_mm", hole_diameter_mm),
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

    optional_pos: Sequence[Tuple[str, Optional[float]]] = (
        ("hole_spacing_x_mm", hole_spacing_x_mm),
        ("hole_spacing_y_mm", hole_spacing_y_mm),
        ("edge_margin_x_mm", edge_margin_x_mm),
        ("edge_margin_y_mm", edge_margin_y_mm),
    )
    for name, val in optional_pos:
        if val is None:
            continue
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    for name, cnt in (("hole_count_x", hole_count_x), ("hole_count_y", hole_count_y)):
        if not is_valid_int(cnt):
            issues.append(ValidationIssue(name, "INVALID_TYPE", f"'{name}' must be an integer; got {cnt!r}."))
        elif cnt < 0:
            issues.append(ValidationIssue(name, "NEGATIVE_COUNT", f"'{name}' must be >= 0; got {cnt}."))
        elif cnt > 200:
            issues.append(ValidationIssue(name, "EXCESSIVE_HOLE_COUNT", f"'{name}' exceeds maximum supported count (200)."))

    if not is_valid_int(fn) or fn < 16 or fn > 720:
        issues.append(ValidationIssue("fn", "INVALID_FACET_COUNT", f"'fn' must be an integer in [16, 720]; got {fn!r}."))

    if issues:
        raise GeometryValidationError(issues)

    # Corner radius feasibility: must leave a strictly positive straight side on both X and Y
    if corner_radius_mm > 0.0:
        max_r = 0.5 * min(length_mm, width_mm)
        if corner_radius_mm >= max_r or (max_r - corner_radius_mm) < MIN_FEATURE_EPSILON_MM:
            issues.append(
                ValidationIssue(
                    "corner_radius_mm",
                    "INVALID_CORNER_RADIUS",
                    (
                        f"corner_radius_mm ({corner_radius_mm} mm) must be strictly less than half the shorter "
                        f"planar dimension ({max_r} mm)."
                    ),
                )
            )

    # Hole presence & consistency checks
    has_holes = hole_diameter_mm > 0.0 or hole_count_x > 0 or hole_count_y > 0
    if has_holes:
        if hole_diameter_mm <= 0.0 or hole_count_x <= 0 or hole_count_y <= 0:
            issues.append(
                ValidationIssue(
                    "hole_diameter_mm",
                    "INVALID_HOLE_CONFIGURATION",
                    (
                        "Mounting holes require hole_diameter_mm > 0, hole_count_x >= 1, and hole_count_y >= 1 "
                        f"(got hole_diameter_mm={hole_diameter_mm}, hole_count_x={hole_count_x}, hole_count_y={hole_count_y})."
                    ),
                )
            )
    else:
        if clearance_mm > 0.0:
            issues.append(
                ValidationIssue(
                    "clearance_mm",
                    "CLEARANCE_WITHOUT_MATING_HOLES",
                    "clearance_mm > 0 cannot be applied when no mounting holes are enabled on rectangular_block.",
                )
            )
        for name, val in optional_pos:
            if val is not None:
                issues.append(
                    ValidationIssue(
                        name,
                        "UNUSED_HOLE_PARAMETER",
                        f"'{name}' cannot be specified when mounting holes are disabled.",
                    )
                )

    if issues:
        raise GeometryValidationError(issues)

    if not has_holes:
        empty_pat = SymmetricAxisPattern(count=0, spacing_mm=0.0, edge_margin_mm=0.0, coordinates_mm=())
        return EffectiveBlockDimensions(
            length_mm=length_mm,
            width_mm=width_mm,
            height_mm=height_mm,
            corner_radius_mm=corner_radius_mm,
            nominal_hole_diameter_mm=0.0,
            effective_hole_diameter_mm=0.0,
            clearance_mm=clearance_mm,
            pattern_x=empty_pat,
            pattern_y=empty_pat,
            hole_centers_xy_mm=(),
        )

    eff_hole_d = hole_diameter_mm + (2.0 * clearance_mm)
    r_hole = eff_hole_d / 2.0

    pat_x: Optional[SymmetricAxisPattern] = None
    pat_y: Optional[SymmetricAxisPattern] = None

    try:
        pat_x = solve_symmetric_1d_pattern(
            span_mm=length_mm,
            count=hole_count_x,
            spacing_mm=hole_spacing_x_mm,
            edge_margin_mm=edge_margin_x_mm,
            axis_label="X (length_mm)",
        )
    except ValueError as exc:
        code, _, msg = str(exc).partition(": ")
        issues.append(ValidationIssue("hole_spacing_x_mm", code or "INVALID_HOLE_LAYOUT", msg or str(exc)))

    try:
        pat_y = solve_symmetric_1d_pattern(
            span_mm=width_mm,
            count=hole_count_y,
            spacing_mm=hole_spacing_y_mm,
            edge_margin_mm=edge_margin_y_mm,
            axis_label="Y (width_mm)",
        )
    except ValueError as exc:
        code, _, msg = str(exc).partition(": ")
        issues.append(ValidationIssue("hole_spacing_y_mm", code or "INVALID_HOLE_LAYOUT", msg or str(exc)))

    if issues or pat_x is None or pat_y is None:
        raise GeometryValidationError(issues)

    # Check outer wall margin & inter-hole ligament along X and Y
    wall_x = pat_x.edge_margin_mm - r_hole
    if wall_x <= 0.0:
        issues.append(
            ValidationIssue(
                "hole_diameter_mm",
                "HOLE_OUTSIDE_BOUNDARY",
                f"Effective hole radius ({r_hole} mm) reaches or exceeds X edge margin ({pat_x.edge_margin_mm} mm).",
            )
        )
    elif wall_x < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "hole_diameter_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                f"Remaining X edge wall thickness ({wall_x:.4f} mm) is below minimum ({MIN_WALL_THICKNESS_MM} mm).",
            )
        )

    wall_y = pat_y.edge_margin_mm - r_hole
    if wall_y <= 0.0:
        issues.append(
            ValidationIssue(
                "hole_diameter_mm",
                "HOLE_OUTSIDE_BOUNDARY",
                f"Effective hole radius ({r_hole} mm) reaches or exceeds Y edge margin ({pat_y.edge_margin_mm} mm).",
            )
        )
    elif wall_y < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "hole_diameter_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                f"Remaining Y edge wall thickness ({wall_y:.4f} mm) is below minimum ({MIN_WALL_THICKNESS_MM} mm).",
            )
        )

    if pat_x.count >= 2:
        lig_x = pat_x.spacing_mm - eff_hole_d
        if lig_x < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "hole_spacing_x_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Adjacent X holes overlap or leave insufficient ligament ({lig_x:.4f} mm < {MIN_WALL_THICKNESS_MM} mm).",
                )
            )

    if pat_y.count >= 2:
        lig_y = pat_y.spacing_mm - eff_hole_d
        if lig_y < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "hole_spacing_y_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Adjacent Y holes overlap or leave insufficient ligament ({lig_y:.4f} mm < {MIN_WALL_THICKNESS_MM} mm).",
                )
            )

    centers: List[Tuple[float, float]] = []
    cx_arc = (length_mm / 2.0) - corner_radius_mm
    cy_arc = (width_mm / 2.0) - corner_radius_mm
    for x in pat_x.coordinates_mm:
        for y in pat_y.coordinates_mm:
            centers.append((x, y))
            if corner_radius_mm > 0.0 and abs(x) > cx_arc and abs(y) > cy_arc:
                dist = math.hypot(abs(x) - cx_arc, abs(y) - cy_arc)
                corner_wall = corner_radius_mm - (dist + r_hole)
                if corner_wall <= 0.0:
                    issues.append(
                        ValidationIssue(
                            "corner_radius_mm",
                            "HOLE_OUTSIDE_BOUNDARY",
                            f"Hole at ({x:.3f}, {y:.3f}) breaches rounded corner boundary (radius={corner_radius_mm} mm).",
                        )
                    )
                elif corner_wall < MIN_WALL_THICKNESS_MM:
                    issues.append(
                        ValidationIssue(
                            "corner_radius_mm",
                            "INSUFFICIENT_WALL_THICKNESS",
                            f"Hole at ({x:.3f}, {y:.3f}) leaves insufficient wall ({corner_wall:.4f} mm) to rounded corner.",
                        )
                    )

    if issues:
        raise GeometryValidationError(issues)

    return EffectiveBlockDimensions(
        length_mm=length_mm,
        width_mm=width_mm,
        height_mm=height_mm,
        corner_radius_mm=corner_radius_mm,
        nominal_hole_diameter_mm=hole_diameter_mm,
        effective_hole_diameter_mm=eff_hole_d,
        clearance_mm=clearance_mm,
        pattern_x=pat_x,
        pattern_y=pat_y,
        hole_centers_xy_mm=tuple(centers),
    )

