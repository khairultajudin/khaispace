"""Strict parameter, locating-skirt, and screw-hole validator for `enclosure_lid`."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, List, Mapping, Optional, Tuple

from kai_cad.geometry.primitives import MIN_FEATURE_EPSILON_MM
from kai_cad.validators.common import (
    MIN_WALL_THICKNESS_MM,
    is_valid_int,
    is_valid_number,
    validate_common_metadata,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue

REQUIRED_ENCLOSURE_LID_FIELDS: Tuple[str, ...] = (
    "length_mm",
    "width_mm",
    "lid_thickness_mm",
)

OPTIONAL_ENCLOSURE_LID_FLOAT_FIELDS: Tuple[str, ...] = (
    "wall_thickness_mm",
    "skirt_depth_mm",
    "skirt_thickness_mm",
    "skirt_clearance_mm",
    "corner_radius_mm",
    "screw_hole_diameter_mm",
    "boss_offset_x_mm",
    "boss_offset_y_mm",
)

OPTIONAL_ENCLOSURE_LID_INT_FIELDS: Tuple[str, ...] = ("screw_hole_count",)

ALLOWED_ENCLOSURE_LID_FIELDS = frozenset(
    REQUIRED_ENCLOSURE_LID_FIELDS
    + OPTIONAL_ENCLOSURE_LID_FLOAT_FIELDS
    + OPTIONAL_ENCLOSURE_LID_INT_FIELDS
    + ("name", "description", "units", "fn")
)


@dataclass(frozen=True)
class EffectiveEnclosureLidDimensions:
    """Computed skirt dimensions and aligned screw-hole coordinates for `enclosure_lid`."""

    length_mm: float
    width_mm: float
    lid_thickness_mm: float
    corner_radius_mm: float
    skirt_depth_mm: float
    skirt_thickness_mm: float
    skirt_clearance_mm: float
    wall_thickness_mm: float
    skirt_outer_length_mm: float
    skirt_outer_width_mm: float
    skirt_outer_corner_radius_mm: float
    skirt_inner_length_mm: float
    skirt_inner_width_mm: float
    skirt_inner_corner_radius_mm: float
    screw_hole_count: int
    screw_hole_diameter_mm: float
    screw_hole_centers_xy_mm: Tuple[Tuple[float, float], ...]
    total_height_mm: float


def validate_enclosure_lid_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw dict configuration for `enclosure_lid`."""
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Enclosure lid spec must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []
    validate_common_metadata(raw, ALLOWED_ENCLOSURE_LID_FIELDS, issues)

    for field_name in REQUIRED_ENCLOSURE_LID_FIELDS:
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

    for field_name in OPTIONAL_ENCLOSURE_LID_FLOAT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_ENCLOSURE_LID_INT_FIELDS:
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

    validate_enclosure_lid_dimensions(
        length_mm=float(raw["length_mm"]),
        width_mm=float(raw["width_mm"]),
        lid_thickness_mm=float(raw["lid_thickness_mm"]),
        corner_radius_mm=0.0 if raw.get("corner_radius_mm") is None else float(raw["corner_radius_mm"]),
        skirt_depth_mm=0.0 if raw.get("skirt_depth_mm") is None else float(raw["skirt_depth_mm"]),
        skirt_thickness_mm=_opt_float("skirt_thickness_mm"),
        skirt_clearance_mm=_opt_float("skirt_clearance_mm"),
        wall_thickness_mm=_opt_float("wall_thickness_mm"),
        screw_hole_diameter_mm=0.0 if raw.get("screw_hole_diameter_mm") is None else float(raw["screw_hole_diameter_mm"]),
        screw_hole_count=None if raw.get("screw_hole_count") is None else int(raw["screw_hole_count"]),
        boss_offset_x_mm=_opt_float("boss_offset_x_mm"),
        boss_offset_y_mm=_opt_float("boss_offset_y_mm"),
        fn=64 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_enclosure_lid_dimensions(
    *,
    length_mm: float,
    width_mm: float,
    lid_thickness_mm: float,
    corner_radius_mm: float = 0.0,
    skirt_depth_mm: float = 0.0,
    skirt_thickness_mm: Optional[float] = None,
    skirt_clearance_mm: Optional[float] = None,
    wall_thickness_mm: Optional[float] = None,
    screw_hole_diameter_mm: float = 0.0,
    screw_hole_count: Optional[int] = None,
    boss_offset_x_mm: Optional[float] = None,
    boss_offset_y_mm: Optional[float] = None,
    fn: int = 64,
) -> EffectiveEnclosureLidDimensions:
    """Validate all `enclosure_lid` dimensions, skirt fit clearances, and boss-aligned screw holes."""
    issues: List[ValidationIssue] = []

    for name, val in (
        ("length_mm", length_mm),
        ("width_mm", width_mm),
        ("lid_thickness_mm", lid_thickness_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    if is_valid_number(lid_thickness_mm) and 0.0 < lid_thickness_mm < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "lid_thickness_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                f"lid_thickness_mm ({lid_thickness_mm} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
            )
        )

    for name, val in (
        ("corner_radius_mm", corner_radius_mm),
        ("skirt_depth_mm", skirt_depth_mm),
        ("screw_hole_diameter_mm", screw_hole_diameter_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) < 0.0:
            issues.append(ValidationIssue(name, "NEGATIVE_DIMENSION", f"'{name}' must be >= 0 mm; got {val}."))
        elif 0.0 < float(val) < MIN_FEATURE_EPSILON_MM:
            issues.append(ValidationIssue(name, "DEGENERATE_DIMENSION", f"Non-zero '{name}' is below resolution."))

    for name, val in (
        ("skirt_thickness_mm", skirt_thickness_mm),
        ("wall_thickness_mm", wall_thickness_mm),
        ("boss_offset_x_mm", boss_offset_x_mm),
        ("boss_offset_y_mm", boss_offset_y_mm),
    ):
        if val is None:
            continue
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    if skirt_clearance_mm is not None:
        if not is_valid_number(skirt_clearance_mm):
            issues.append(
                ValidationIssue("skirt_clearance_mm", "INVALID_NUMBER", "'skirt_clearance_mm' must be finite.")
            )
        elif float(skirt_clearance_mm) < 0.0:
            issues.append(
                ValidationIssue(
                    "skirt_clearance_mm",
                    "NEGATIVE_DIMENSION",
                    f"'skirt_clearance_mm' must be >= 0 mm; got {skirt_clearance_mm}.",
                )
            )

    if screw_hole_count is not None:
        if not is_valid_int(screw_hole_count):
            issues.append(ValidationIssue("screw_hole_count", "INVALID_TYPE", "'screw_hole_count' must be an integer."))
        elif screw_hole_count not in (0, 2, 4):
            issues.append(
                ValidationIssue(
                    "screw_hole_count",
                    "INVALID_SCREW_HOLE_COUNT",
                    f"Supported screw_hole_count values are 0, 2, or 4; got {screw_hole_count}.",
                )
            )

    if not is_valid_int(fn) or fn < 16 or fn > 720:
        issues.append(ValidationIssue("fn", "INVALID_FACET_COUNT", f"'fn' must be an integer in [16, 720]; got {fn!r}."))

    if issues:
        raise GeometryValidationError(issues)

    # Outer corner radius validation
    if corner_radius_mm > 0.0:
        max_r = 0.5 * min(length_mm, width_mm)
        if corner_radius_mm >= max_r or (max_r - corner_radius_mm) < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "corner_radius_mm",
                    "INVALID_CORNER_RADIUS",
                    f"corner_radius_mm ({corner_radius_mm} mm) must leave a positive flat side (< {max_r} mm).",
                )
            )

    # Downward locating skirt validation (never invent wall_thickness_mm or skirt_thickness_mm!)
    eff_skirt_t = 0.0
    eff_skirt_c = 0.0
    eff_wall_t = 0.0
    skirt_out_l = 0.0
    skirt_out_w = 0.0
    skirt_out_r = 0.0
    skirt_in_l = 0.0
    skirt_in_w = 0.0
    skirt_in_r = 0.0

    if skirt_depth_mm == 0.0:
        if skirt_thickness_mm is not None or skirt_clearance_mm is not None or wall_thickness_mm is not None:
            issues.append(
                ValidationIssue(
                    "skirt_depth_mm",
                    "UNUSED_SKIRT_PARAMETER",
                    "skirt_thickness_mm, skirt_clearance_mm, and wall_thickness_mm require skirt_depth_mm > 0.",
                )
            )
    else:
        if wall_thickness_mm is None:
            issues.append(
                ValidationIssue(
                    "wall_thickness_mm",
                    "MISSING_SKIRT_PARAMETER",
                    "wall_thickness_mm is required when skirt_depth_mm > 0 so the skirt fits the mating enclosure wall.",
                )
            )
        elif wall_thickness_mm < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "wall_thickness_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"wall_thickness_mm ({wall_thickness_mm} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
                )
            )

        if skirt_thickness_mm is None:
            issues.append(
                ValidationIssue(
                    "skirt_thickness_mm",
                    "MISSING_SKIRT_PARAMETER",
                    "skirt_thickness_mm is required when skirt_depth_mm > 0.",
                )
            )
        elif skirt_thickness_mm < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "skirt_thickness_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"skirt_thickness_mm ({skirt_thickness_mm} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
                )
            )

        eff_skirt_c = 0.0 if skirt_clearance_mm is None else skirt_clearance_mm

        if not issues and wall_thickness_mm is not None and skirt_thickness_mm is not None:
            eff_wall_t = wall_thickness_mm
            eff_skirt_t = skirt_thickness_mm
            inset = eff_wall_t + eff_skirt_c
            skirt_out_l = length_mm - (2.0 * inset)
            skirt_out_w = width_mm - (2.0 * inset)
            skirt_out_r = max(0.0, corner_radius_mm - inset)

            skirt_in_l = skirt_out_l - (2.0 * eff_skirt_t)
            skirt_in_w = skirt_out_w - (2.0 * eff_skirt_t)
            skirt_in_r = max(0.0, skirt_out_r - eff_skirt_t)

            if skirt_in_l < MIN_WALL_THICKNESS_MM or skirt_in_w < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "skirt_thickness_mm",
                        "INVALID_SKIRT_DIMENSIONS",
                        (
                            f"Skirt inset ({inset} mm) and skirt_thickness_mm ({eff_skirt_t} mm) "
                            f"collapse inner skirt opening ({skirt_in_l:.3f} x {skirt_in_w:.3f} mm)."
                        ),
                    )
                )

    # Screw holes validation (aligned with enclosure_base boss offsets)
    has_screw_params = (
        screw_hole_diameter_mm > 0.0
        or (screw_hole_count is not None and screw_hole_count > 0)
        or boss_offset_x_mm is not None
        or boss_offset_y_mm is not None
    )
    resolved_hole_count = 0
    hole_centers: List[Tuple[float, float]] = []

    if not has_screw_params:
        resolved_hole_count = 0
    else:
        if screw_hole_count == 0:
            issues.append(
                ValidationIssue(
                    "screw_hole_count",
                    "CONFLICTING_SCREW_HOLE_CONFIG",
                    "screw_hole_count cannot be 0 when screw hole diameter or boss offsets are provided.",
                )
            )
        if screw_hole_diameter_mm <= 0.0:
            issues.append(
                ValidationIssue(
                    "screw_hole_diameter_mm",
                    "MISSING_SCREW_HOLE_PARAMETER",
                    "screw_hole_diameter_mm > 0 is required when boss offsets or screw_hole_count > 0 are supplied.",
                )
            )
        if boss_offset_x_mm is None:
            issues.append(
                ValidationIssue(
                    "boss_offset_x_mm",
                    "MISSING_SCREW_HOLE_PARAMETER",
                    "boss_offset_x_mm is required when screw_hole_diameter_mm > 0.",
                )
            )

        resolved_hole_count = 4 if screw_hole_count is None else screw_hole_count
        if resolved_hole_count == 4 and boss_offset_y_mm is None:
            issues.append(
                ValidationIssue(
                    "boss_offset_y_mm",
                    "MISSING_SCREW_HOLE_PARAMETER",
                    "boss_offset_y_mm is required for 4-corner lid screw holes.",
                )
            )
        if resolved_hole_count == 2 and boss_offset_y_mm is not None and abs(boss_offset_y_mm - (width_mm / 2.0)) > 1e-5:
            issues.append(
                ValidationIssue(
                    "boss_offset_y_mm",
                    "CONFLICTING_BOSS_OFFSET",
                    f"For 2 centerline screw holes, boss_offset_y_mm must be omitted or equal width_mm/2 ({width_mm/2.0} mm).",
                )
            )

        if not issues and boss_offset_x_mm is not None:
            hx = (length_mm / 2.0) - boss_offset_x_mm
            hy = 0.0 if resolved_hole_count == 2 else (width_mm / 2.0) - float(boss_offset_y_mm)  # type: ignore[arg-type]
            r_h = screw_hole_diameter_mm / 2.0

            if hx <= r_h + (MIN_WALL_THICKNESS_MM / 2.0):
                issues.append(
                    ValidationIssue(
                        "boss_offset_x_mm",
                        "OVERLAPPING_SCREW_HOLES",
                        "Opposite X screw holes overlap or fail to maintain ligament.",
                    )
                )
            if resolved_hole_count == 4 and hy <= r_h + (MIN_WALL_THICKNESS_MM / 2.0):
                issues.append(
                    ValidationIssue(
                        "boss_offset_y_mm",
                        "OVERLAPPING_SCREW_HOLES",
                        "Opposite Y screw holes overlap or fail to maintain ligament.",
                    )
                )

            # Outer edge & rounded corner clearance
            if (boss_offset_x_mm - r_h) < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "boss_offset_x_mm",
                        "HOLE_OUTSIDE_BOUNDARY",
                        "Lid screw hole breaches or leaves insufficient wall to X outer edge.",
                    )
                )
            eff_y_margin = (width_mm / 2.0) - abs(hy)
            if (eff_y_margin - r_h) < MIN_WALL_THICKNESS_MM:
                issues.append(
                    ValidationIssue(
                        "boss_offset_y_mm",
                        "HOLE_OUTSIDE_BOUNDARY",
                        "Lid screw hole breaches or leaves insufficient wall to Y outer edge.",
                    )
                )
            if corner_radius_mm > 0.0:
                cx = (length_mm / 2.0) - corner_radius_mm
                cy = (width_mm / 2.0) - corner_radius_mm
                if hx > cx and abs(hy) > cy:
                    dist = math.hypot(hx - cx, abs(hy) - cy) + r_h
                    if (corner_radius_mm - dist) < MIN_WALL_THICKNESS_MM:
                        issues.append(
                            ValidationIssue(
                                "corner_radius_mm",
                                "HOLE_OUTSIDE_BOUNDARY",
                                "Lid screw hole breaches or is too close to rounded outer corner.",
                            )
                        )

            # If downward skirt is present, screw holes must sit cleanly inboard of the skirt inner wall
            if skirt_depth_mm > 0.0:
                in_half_x = skirt_in_l / 2.0
                in_half_y = skirt_in_w / 2.0
                if (in_half_x - hx - r_h) < MIN_WALL_THICKNESS_MM or (in_half_y - abs(hy) - r_h) < MIN_WALL_THICKNESS_MM:
                    issues.append(
                        ValidationIssue(
                            "screw_hole_diameter_mm",
                            "SCREW_HOLE_INTERSECTS_SKIRT",
                            (
                                "Lid screw holes intersect or violate minimum ligament to the downward locating skirt "
                                "(increase boss_offset_x_mm / boss_offset_y_mm or reduce skirt_thickness_mm)."
                            ),
                        )
                    )
                elif skirt_in_r > 0.0:
                    scx = in_half_x - skirt_in_r
                    scy = in_half_y - skirt_in_r
                    if hx > scx and abs(hy) > scy:
                        sdist = math.hypot(hx - scx, abs(hy) - scy) + r_h
                        if (skirt_in_r - sdist) < MIN_WALL_THICKNESS_MM:
                            issues.append(
                                ValidationIssue(
                                    "screw_hole_diameter_mm",
                                    "SCREW_HOLE_INTERSECTS_SKIRT",
                                    "Lid screw hole intersects rounded inner corner of locating skirt.",
                                )
                            )

            if resolved_hole_count == 2:
                hole_centers = [(-hx, 0.0), (hx, 0.0)]
            else:
                hole_centers = [(-hx, -hy), (hx, -hy), (-hx, hy), (hx, hy)]

    if issues:
        raise GeometryValidationError(issues)

    return EffectiveEnclosureLidDimensions(
        length_mm=length_mm,
        width_mm=width_mm,
        lid_thickness_mm=lid_thickness_mm,
        corner_radius_mm=corner_radius_mm,
        skirt_depth_mm=skirt_depth_mm,
        skirt_thickness_mm=eff_skirt_t,
        skirt_clearance_mm=eff_skirt_c,
        wall_thickness_mm=eff_wall_t,
        skirt_outer_length_mm=skirt_out_l,
        skirt_outer_width_mm=skirt_out_w,
        skirt_outer_corner_radius_mm=skirt_out_r,
        skirt_inner_length_mm=skirt_in_l,
        skirt_inner_width_mm=skirt_in_w,
        skirt_inner_corner_radius_mm=skirt_in_r,
        screw_hole_count=resolved_hole_count,
        screw_hole_diameter_mm=screw_hole_diameter_mm,
        screw_hole_centers_xy_mm=tuple(hole_centers),
        total_height_mm=lid_thickness_mm + skirt_depth_mm,
    )
