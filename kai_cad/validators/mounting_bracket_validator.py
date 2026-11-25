"""Strict parameter and geometric validator for L-Mounting Bracket (`mounting_bracket`)."""

from __future__ import annotations

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

REQUIRED_BRACKET_FIELDS: Tuple[str, ...] = (
    "base_length_mm",
    "base_width_mm",
    "vertical_height_mm",
    "thickness_mm",
)

OPTIONAL_BRACKET_FLOAT_FIELDS: Tuple[str, ...] = (
    "base_hole_diameter_mm",
    "base_hole_spacing_mm",
    "base_edge_margin_mm",
    "vertical_hole_diameter_mm",
    "vertical_hole_spacing_mm",
    "vertical_edge_margin_mm",
    "inside_corner_radius_mm",
    "clearance_mm",
)

OPTIONAL_BRACKET_INT_FIELDS: Tuple[str, ...] = (
    "base_hole_count",
    "vertical_hole_count",
)

ALLOWED_BRACKET_FIELDS = frozenset(
    REQUIRED_BRACKET_FIELDS
    + OPTIONAL_BRACKET_FLOAT_FIELDS
    + OPTIONAL_BRACKET_INT_FIELDS
    + ("name", "description", "units", "fn")
)


@dataclass(frozen=True)
class EffectiveBracketDimensions:
    """Resolved geometry and hole coordinates (mm) for an L-Mounting Bracket."""

    base_length_mm: float
    base_width_mm: float
    vertical_height_mm: float
    thickness_mm: float
    inside_corner_radius_mm: float
    clearance_mm: float
    clear_base_shelf_mm: float
    clear_vertical_leg_mm: float
    base_hole_x_mm: float
    effective_base_hole_diameter_mm: float
    base_pattern_y: SymmetricAxisPattern
    vertical_hole_z_mm: float
    effective_vertical_hole_diameter_mm: float
    vertical_pattern_y: SymmetricAxisPattern


def validate_mounting_bracket_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw dict configuration for `mounting_bracket`."""
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Mounting bracket spec must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []
    validate_common_metadata(raw, ALLOWED_BRACKET_FIELDS, issues)

    for field_name in REQUIRED_BRACKET_FIELDS:
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

    for field_name in OPTIONAL_BRACKET_FLOAT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_BRACKET_INT_FIELDS:
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

    validate_mounting_bracket_dimensions(
        base_length_mm=float(raw["base_length_mm"]),
        base_width_mm=float(raw["base_width_mm"]),
        vertical_height_mm=float(raw["vertical_height_mm"]),
        thickness_mm=float(raw["thickness_mm"]),
        base_hole_diameter_mm=0.0 if raw.get("base_hole_diameter_mm") is None else float(raw["base_hole_diameter_mm"]),
        base_hole_count=0 if raw.get("base_hole_count") is None else int(raw["base_hole_count"]),
        base_hole_spacing_mm=_opt_float("base_hole_spacing_mm"),
        base_edge_margin_mm=_opt_float("base_edge_margin_mm"),
        vertical_hole_diameter_mm=0.0 if raw.get("vertical_hole_diameter_mm") is None else float(raw["vertical_hole_diameter_mm"]),
        vertical_hole_count=0 if raw.get("vertical_hole_count") is None else int(raw["vertical_hole_count"]),
        vertical_hole_spacing_mm=_opt_float("vertical_hole_spacing_mm"),
        vertical_edge_margin_mm=_opt_float("vertical_edge_margin_mm"),
        inside_corner_radius_mm=0.0 if raw.get("inside_corner_radius_mm") is None else float(raw["inside_corner_radius_mm"]),
        clearance_mm=0.0 if raw.get("clearance_mm") is None else float(raw["clearance_mm"]),
        fn=64 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_mounting_bracket_dimensions(
    *,
    base_length_mm: float,
    base_width_mm: float,
    vertical_height_mm: float,
    thickness_mm: float,
    base_hole_diameter_mm: float = 0.0,
    base_hole_count: int = 0,
    base_hole_spacing_mm: Optional[float] = None,
    base_edge_margin_mm: Optional[float] = None,
    vertical_hole_diameter_mm: float = 0.0,
    vertical_hole_count: int = 0,
    vertical_hole_spacing_mm: Optional[float] = None,
    vertical_edge_margin_mm: Optional[float] = None,
    inside_corner_radius_mm: float = 0.0,
    clearance_mm: float = 0.0,
    fn: int = 64,
) -> EffectiveBracketDimensions:
    """Validate all dimensions, fillet bounds, and hole layouts for `mounting_bracket`."""
    issues: List[ValidationIssue] = []

    for name, val in (
        ("base_length_mm", base_length_mm),
        ("base_width_mm", base_width_mm),
        ("vertical_height_mm", vertical_height_mm),
        ("thickness_mm", thickness_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))
        elif float(val) < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    name,
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"'{name}' ({val} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
                )
            )

    for name, val in (
        ("base_hole_diameter_mm", base_hole_diameter_mm),
        ("vertical_hole_diameter_mm", vertical_hole_diameter_mm),
        ("inside_corner_radius_mm", inside_corner_radius_mm),
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
        ("base_hole_spacing_mm", base_hole_spacing_mm),
        ("base_edge_margin_mm", base_edge_margin_mm),
        ("vertical_hole_spacing_mm", vertical_hole_spacing_mm),
        ("vertical_edge_margin_mm", vertical_edge_margin_mm),
    )
    for name, val in optional_pos:
        if val is None:
            continue
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    for name, cnt in (("base_hole_count", base_hole_count), ("vertical_hole_count", vertical_hole_count)):
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

    # L-leg and inside corner fillet feasibility
    if thickness_mm >= base_length_mm:
        issues.append(
            ValidationIssue(
                "thickness_mm",
                "INVALID_BRACKET_GEOMETRY",
                f"thickness_mm ({thickness_mm} mm) must be strictly less than base_length_mm ({base_length_mm} mm).",
            )
        )
    if thickness_mm >= vertical_height_mm:
        issues.append(
            ValidationIssue(
                "thickness_mm",
                "INVALID_BRACKET_GEOMETRY",
                f"thickness_mm ({thickness_mm} mm) must be strictly less than vertical_height_mm ({vertical_height_mm} mm).",
            )
        )

    clear_shelf = base_length_mm - thickness_mm - inside_corner_radius_mm
    clear_leg = vertical_height_mm - thickness_mm - inside_corner_radius_mm
    if clear_shelf < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "inside_corner_radius_mm",
                "INVALID_CORNER_RADIUS",
                (
                    f"inside_corner_radius_mm ({inside_corner_radius_mm} mm) + thickness_mm ({thickness_mm} mm) "
                    f"leaves insufficient flat base shelf ({clear_shelf:.4f} mm < {MIN_WALL_THICKNESS_MM} mm)."
                ),
            )
        )
    if clear_leg < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "inside_corner_radius_mm",
                "INVALID_CORNER_RADIUS",
                (
                    f"inside_corner_radius_mm ({inside_corner_radius_mm} mm) + thickness_mm ({thickness_mm} mm) "
                    f"leaves insufficient flat vertical leg ({clear_leg:.4f} mm < {MIN_WALL_THICKNESS_MM} mm)."
                ),
            )
        )

    # Validate base holes & vertical holes configuration
    has_base_holes = base_hole_diameter_mm > 0.0 or base_hole_count > 0
    if has_base_holes and (base_hole_diameter_mm <= 0.0 or base_hole_count <= 0):
        issues.append(
            ValidationIssue(
                "base_hole_diameter_mm",
                "INVALID_HOLE_CONFIGURATION",
                "Base holes require both base_hole_diameter_mm > 0 and base_hole_count >= 1.",
            )
        )
    if not has_base_holes and (base_hole_spacing_mm is not None or base_edge_margin_mm is not None):
        issues.append(
            ValidationIssue(
                "base_hole_spacing_mm",
                "UNUSED_HOLE_PARAMETER",
                "Base hole spacing/margin cannot be specified when base holes are disabled.",
            )
        )

    has_vert_holes = vertical_hole_diameter_mm > 0.0 or vertical_hole_count > 0
    if has_vert_holes and (vertical_hole_diameter_mm <= 0.0 or vertical_hole_count <= 0):
        issues.append(
            ValidationIssue(
                "vertical_hole_diameter_mm",
                "INVALID_HOLE_CONFIGURATION",
                "Vertical holes require both vertical_hole_diameter_mm > 0 and vertical_hole_count >= 1.",
            )
        )
    if not has_vert_holes and (vertical_hole_spacing_mm is not None or vertical_edge_margin_mm is not None):
        issues.append(
            ValidationIssue(
                "vertical_hole_spacing_mm",
                "UNUSED_HOLE_PARAMETER",
                "Vertical hole spacing/margin cannot be specified when vertical holes are disabled.",
            )
        )

    if clearance_mm > 0.0 and not (has_base_holes or has_vert_holes):
        issues.append(
            ValidationIssue(
                "clearance_mm",
                "CLEARANCE_WITHOUT_MATING_HOLES",
                "clearance_mm > 0 cannot be applied when neither base nor vertical mounting holes are enabled.",
            )
        )

    if issues:
        raise GeometryValidationError(issues)

    # Base hole pattern validation
    eff_base_d = (base_hole_diameter_mm + (2.0 * clearance_mm)) if has_base_holes else 0.0
    base_hole_x = (thickness_mm + inside_corner_radius_mm + base_length_mm) / 2.0
    if has_base_holes:
        r_b = eff_base_d / 2.0
        shelf_wall_x = (clear_shelf / 2.0) - r_b
        if shelf_wall_x <= 0.0:
            issues.append(
                ValidationIssue(
                    "base_hole_diameter_mm",
                    "HOLE_OUTSIDE_BOUNDARY",
                    f"Effective base hole ({eff_base_d} mm) exceeds clear flat base shelf ({clear_shelf} mm).",
                )
            )
        elif shelf_wall_x < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "base_hole_diameter_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Remaining X wall around base hole ({shelf_wall_x:.4f} mm) is below {MIN_WALL_THICKNESS_MM} mm.",
                )
            )
        try:
            base_pat = solve_symmetric_1d_pattern(
                span_mm=base_width_mm,
                count=base_hole_count,
                spacing_mm=base_hole_spacing_mm,
                edge_margin_mm=base_edge_margin_mm,
                axis_label="base Y (base_width_mm)",
            )
            wall_by = base_pat.edge_margin_mm - r_b
            if wall_by <= 0.0:
                issues.append(
                    ValidationIssue(
                        "base_hole_diameter_mm",
                        "HOLE_OUTSIDE_BOUNDARY",
                        f"Effective base hole radius ({r_b} mm) exceeds base Y edge margin ({base_pat.edge_margin_mm} mm).",
                    )
                )
            elif wall_by < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "base_hole_diameter_mm",
                        "INSUFFICIENT_WALL_THICKNESS",
                        f"Base hole Y edge wall ({wall_by:.4f} mm) is below {MIN_WALL_THICKNESS_MM} mm.",
                    )
                )
            if base_pat.count >= 2 and (base_pat.spacing_mm - eff_base_d) < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "base_hole_spacing_mm",
                        "INSUFFICIENT_WALL_THICKNESS",
                        "Adjacent base holes overlap or leave insufficient ligament.",
                    )
                )
        except ValueError as exc:
            code, _, msg = str(exc).partition(": ")
            issues.append(ValidationIssue("base_hole_spacing_mm", code or "INVALID_HOLE_LAYOUT", msg or str(exc)))
            base_pat = SymmetricAxisPattern(0, 0.0, 0.0, ())
    else:
        base_pat = SymmetricAxisPattern(0, 0.0, 0.0, ())

    # Vertical hole pattern validation
    eff_vert_d = (vertical_hole_diameter_mm + (2.0 * clearance_mm)) if has_vert_holes else 0.0
    vert_hole_z = (thickness_mm + inside_corner_radius_mm + vertical_height_mm) / 2.0
    if has_vert_holes:
        r_v = eff_vert_d / 2.0
        leg_wall_z = (clear_leg / 2.0) - r_v
        if leg_wall_z <= 0.0:
            issues.append(
                ValidationIssue(
                    "vertical_hole_diameter_mm",
                    "HOLE_OUTSIDE_BOUNDARY",
                    f"Effective vertical hole ({eff_vert_d} mm) exceeds clear flat vertical leg ({clear_leg} mm).",
                )
            )
        elif leg_wall_z < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "vertical_hole_diameter_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Remaining Z wall around vertical hole ({leg_wall_z:.4f} mm) is below {MIN_WALL_THICKNESS_MM} mm.",
                )
            )
        try:
            vert_pat = solve_symmetric_1d_pattern(
                span_mm=base_width_mm,
                count=vertical_hole_count,
                spacing_mm=vertical_hole_spacing_mm,
                edge_margin_mm=vertical_edge_margin_mm,
                axis_label="vertical Y (base_width_mm)",
            )
            wall_vy = vert_pat.edge_margin_mm - r_v
            if wall_vy <= 0.0:
                issues.append(
                    ValidationIssue(
                        "vertical_hole_diameter_mm",
                        "HOLE_OUTSIDE_BOUNDARY",
                        f"Effective vertical hole radius ({r_v} mm) exceeds Y edge margin ({vert_pat.edge_margin_mm} mm).",
                    )
                )
            elif wall_vy < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "vertical_hole_diameter_mm",
                        "INSUFFICIENT_WALL_THICKNESS",
                        f"Vertical hole Y edge wall ({wall_vy:.4f} mm) is below {MIN_WALL_THICKNESS_MM} mm.",
                    )
                )
            if vert_pat.count >= 2 and (vert_pat.spacing_mm - eff_vert_d) < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "vertical_hole_spacing_mm",
                        "INSUFFICIENT_WALL_THICKNESS",
                        "Adjacent vertical holes overlap or leave insufficient ligament.",
                    )
                )
        except ValueError as exc:
            code, _, msg = str(exc).partition(": ")
            issues.append(ValidationIssue("vertical_hole_spacing_mm", code or "INVALID_HOLE_LAYOUT", msg or str(exc)))
            vert_pat = SymmetricAxisPattern(0, 0.0, 0.0, ())
    else:
        vert_pat = SymmetricAxisPattern(0, 0.0, 0.0, ())

    if issues:
        raise GeometryValidationError(issues)

    return EffectiveBracketDimensions(
        base_length_mm=base_length_mm,
        base_width_mm=base_width_mm,
        vertical_height_mm=vertical_height_mm,
        thickness_mm=thickness_mm,
        inside_corner_radius_mm=inside_corner_radius_mm,
        clearance_mm=clearance_mm,
        clear_base_shelf_mm=clear_shelf,
        clear_vertical_leg_mm=clear_leg,
        base_hole_x_mm=base_hole_x,
        effective_base_hole_diameter_mm=eff_base_d,
        base_pattern_y=base_pat,
        vertical_hole_z_mm=vert_hole_z,
        effective_vertical_hole_diameter_mm=eff_vert_d,
        vertical_pattern_y=vert_pat,
    )

