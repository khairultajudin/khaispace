"""Strict parameter, boss, and cable-opening validator for `enclosure_base`."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, List, Mapping, Optional, Sequence, Tuple

from kai_cad.geometry.primitives import MIN_FEATURE_EPSILON_MM
from kai_cad.validators.common import (
    MIN_WALL_THICKNESS_MM,
    is_valid_int,
    is_valid_number,
    validate_common_metadata,
)
from kai_cad.validators.errors import GeometryValidationError, ValidationIssue

REQUIRED_ENCLOSURE_BASE_FIELDS: Tuple[str, ...] = (
    "length_mm",
    "width_mm",
    "height_mm",
    "wall_thickness_mm",
    "floor_thickness_mm",
)

OPTIONAL_ENCLOSURE_BASE_FLOAT_FIELDS: Tuple[str, ...] = (
    "corner_radius_mm",
    "boss_outer_diameter_mm",
    "boss_hole_diameter_mm",
    "boss_offset_x_mm",
    "boss_offset_y_mm",
)

OPTIONAL_ENCLOSURE_BASE_INT_FIELDS: Tuple[str, ...] = ("boss_count",)

ALLOWED_ENCLOSURE_BASE_FIELDS = frozenset(
    REQUIRED_ENCLOSURE_BASE_FIELDS
    + OPTIONAL_ENCLOSURE_BASE_FLOAT_FIELDS
    + OPTIONAL_ENCLOSURE_BASE_INT_FIELDS
    + ("cable_openings", "name", "description", "units", "fn")
)

VALID_WALLS = frozenset({"front", "back", "left", "right"})
VALID_OPENING_SHAPES = frozenset({"circular", "rectangular"})
ALLOWED_OPENING_FIELDS = frozenset(
    {"wall", "shape", "center_z_mm", "offset_mm", "diameter_mm", "width_mm", "height_mm"}
)


@dataclass(frozen=True)
class CableOpeningSpec:
    """Validated parametric wall opening on an `enclosure_base`."""

    wall: str
    shape: str
    center_z_mm: float
    offset_mm: float = 0.0
    diameter_mm: Optional[float] = None
    width_mm: Optional[float] = None
    height_mm: Optional[float] = None

    @property
    def span_width_mm(self) -> float:
        if self.shape == "circular":
            assert self.diameter_mm is not None
            return self.diameter_mm
        assert self.width_mm is not None
        return self.width_mm

    @property
    def span_height_mm(self) -> float:
        if self.shape == "circular":
            assert self.diameter_mm is not None
            return self.diameter_mm
        assert self.height_mm is not None
        return self.height_mm


@dataclass(frozen=True)
class EffectiveEnclosureBaseDimensions:
    """Computed internal cavity, boss coordinates, and validated openings for `enclosure_base`."""

    length_mm: float
    width_mm: float
    height_mm: float
    wall_thickness_mm: float
    floor_thickness_mm: float
    corner_radius_mm: float
    cavity_length_mm: float
    cavity_width_mm: float
    cavity_depth_mm: float
    cavity_corner_radius_mm: float
    boss_count: int
    boss_outer_diameter_mm: float
    boss_hole_diameter_mm: float
    boss_centers_xy_mm: Tuple[Tuple[float, float], ...]
    cable_openings: Tuple[CableOpeningSpec, ...]


def _parse_and_validate_openings(
    raw_openings: Any,
    issues: List[ValidationIssue],
) -> List[CableOpeningSpec]:
    if raw_openings is None:
        return []
    if not isinstance(raw_openings, Sequence) or isinstance(raw_openings, (str, bytes)):
        issues.append(
            ValidationIssue("cable_openings", "INVALID_TYPE", "'cable_openings' must be a JSON array of objects.")
        )
        return []
    if len(raw_openings) > 64:
        issues.append(
            ValidationIssue("cable_openings", "EXCESSIVE_OPENING_COUNT", "'cable_openings' supports at most 64 items.")
        )
        return []

    parsed: List[CableOpeningSpec] = []
    for idx, item in enumerate(raw_openings):
        prefix = f"cable_openings[{idx}]"
        if not isinstance(item, Mapping):
            issues.append(ValidationIssue(prefix, "INVALID_TYPE", "Each cable opening must be a JSON object."))
            continue

        for key in sorted(set(item.keys()) - ALLOWED_OPENING_FIELDS):
            issues.append(
                ValidationIssue(f"{prefix}.{key}", "UNKNOWN_PARAMETER", f"Unrecognized cable opening field '{key}'.")
            )

        wall = item.get("wall")
        if not isinstance(wall, str) or wall not in VALID_WALLS:
            issues.append(
                ValidationIssue(
                    f"{prefix}.wall",
                    "INVALID_OPENING_WALL",
                    f"'wall' must be one of {sorted(VALID_WALLS)}; got {wall!r}.",
                )
            )

        shape = item.get("shape")
        if not isinstance(shape, str) or shape not in VALID_OPENING_SHAPES:
            issues.append(
                ValidationIssue(
                    f"{prefix}.shape",
                    "INVALID_OPENING_SHAPE",
                    f"'shape' must be one of {sorted(VALID_OPENING_SHAPES)}; got {shape!r}.",
                )
            )

        cz = item.get("center_z_mm")
        if cz is None:
            issues.append(
                ValidationIssue(f"{prefix}.center_z_mm", "MISSING_PARAMETER", "'center_z_mm' is required.")
            )
        elif not is_valid_number(cz) or float(cz) <= 0.0:
            issues.append(
                ValidationIssue(
                    f"{prefix}.center_z_mm",
                    "NON_POSITIVE_DIMENSION",
                    f"'center_z_mm' must be a finite number > 0 mm; got {cz!r}.",
                )
            )

        offset = item.get("offset_mm", 0.0)
        if offset is None:
            offset = 0.0
        elif not is_valid_number(offset):
            issues.append(
                ValidationIssue(
                    f"{prefix}.offset_mm",
                    "INVALID_TYPE",
                    f"'offset_mm' must be a finite number in mm; got {offset!r}.",
                )
            )

        if shape == "circular":
            if item.get("width_mm") is not None or item.get("height_mm") is not None:
                issues.append(
                    ValidationIssue(
                        f"{prefix}.shape",
                        "INVALID_OPENING_PARAMETERS",
                        "Circular cable opening must specify 'diameter_mm' and omit 'width_mm'/'height_mm'.",
                    )
                )
            diam = item.get("diameter_mm")
            if diam is None:
                issues.append(
                    ValidationIssue(f"{prefix}.diameter_mm", "MISSING_PARAMETER", "'diameter_mm' is required for circular opening.")
                )
            elif not is_valid_number(diam) or float(diam) <= 0.0:
                issues.append(
                    ValidationIssue(
                        f"{prefix}.diameter_mm",
                        "NON_POSITIVE_DIMENSION",
                        f"'diameter_mm' must be > 0 mm; got {diam!r}.",
                    )
                )
            elif not issues:
                parsed.append(
                    CableOpeningSpec(
                        wall=str(wall),
                        shape="circular",
                        center_z_mm=float(cz),
                        offset_mm=float(offset),
                        diameter_mm=float(diam),
                    )
                )
        elif shape == "rectangular":
            if item.get("diameter_mm") is not None:
                issues.append(
                    ValidationIssue(
                        f"{prefix}.shape",
                        "INVALID_OPENING_PARAMETERS",
                        "Rectangular cable opening must specify 'width_mm' and 'height_mm' and omit 'diameter_mm'.",
                    )
                )
            w = item.get("width_mm")
            h = item.get("height_mm")
            if w is None:
                issues.append(
                    ValidationIssue(f"{prefix}.width_mm", "MISSING_PARAMETER", "'width_mm' is required for rectangular opening.")
                )
            elif not is_valid_number(w) or float(w) <= 0.0:
                issues.append(
                    ValidationIssue(f"{prefix}.width_mm", "NON_POSITIVE_DIMENSION", f"'width_mm' must be > 0 mm; got {w!r}.")
                )
            if h is None:
                issues.append(
                    ValidationIssue(f"{prefix}.height_mm", "MISSING_PARAMETER", "'height_mm' is required for rectangular opening.")
                )
            elif not is_valid_number(h) or float(h) <= 0.0:
                issues.append(
                    ValidationIssue(f"{prefix}.height_mm", "NON_POSITIVE_DIMENSION", f"'height_mm' must be > 0 mm; got {h!r}.")
                )
            if not issues and w is not None and h is not None:
                parsed.append(
                    CableOpeningSpec(
                        wall=str(wall),
                        shape="rectangular",
                        center_z_mm=float(cz),
                        offset_mm=float(offset),
                        width_mm=float(w),
                        height_mm=float(h),
                    )
                )

    return parsed


def validate_enclosure_base_dict(raw: Mapping[str, Any]) -> None:
    """Validate a raw dict configuration for `enclosure_base`."""
    if not isinstance(raw, Mapping):
        raise GeometryValidationError(
            [ValidationIssue("spec", "INVALID_TYPE", "Enclosure base spec must be a JSON object.")]
        )

    issues: List[ValidationIssue] = []
    validate_common_metadata(raw, ALLOWED_ENCLOSURE_BASE_FIELDS, issues)

    for field_name in REQUIRED_ENCLOSURE_BASE_FIELDS:
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

    for field_name in OPTIONAL_ENCLOSURE_BASE_FLOAT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_number(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be a finite number in mm; got {raw[field_name]!r}.",
                )
            )

    for field_name in OPTIONAL_ENCLOSURE_BASE_INT_FIELDS:
        if field_name in raw and raw[field_name] is not None and not is_valid_int(raw[field_name]):
            issues.append(
                ValidationIssue(
                    field_name,
                    "INVALID_TYPE",
                    f"Parameter '{field_name}' must be an integer; got {raw[field_name]!r}.",
                )
            )

    openings = _parse_and_validate_openings(raw.get("cable_openings"), issues)
    if issues:
        raise GeometryValidationError(issues)

    def _opt_float(key: str) -> Optional[float]:
        v = raw.get(key)
        return None if v is None else float(v)

    validate_enclosure_base_dimensions(
        length_mm=float(raw["length_mm"]),
        width_mm=float(raw["width_mm"]),
        height_mm=float(raw["height_mm"]),
        wall_thickness_mm=float(raw["wall_thickness_mm"]),
        floor_thickness_mm=float(raw["floor_thickness_mm"]),
        corner_radius_mm=0.0 if raw.get("corner_radius_mm") is None else float(raw["corner_radius_mm"]),
        boss_count=0 if raw.get("boss_count") is None else int(raw["boss_count"]),
        boss_outer_diameter_mm=0.0 if raw.get("boss_outer_diameter_mm") is None else float(raw["boss_outer_diameter_mm"]),
        boss_hole_diameter_mm=0.0 if raw.get("boss_hole_diameter_mm") is None else float(raw["boss_hole_diameter_mm"]),
        boss_offset_x_mm=_opt_float("boss_offset_x_mm"),
        boss_offset_y_mm=_opt_float("boss_offset_y_mm"),
        cable_openings=tuple(openings),
        fn=64 if raw.get("fn") is None else int(raw["fn"]),
    )


def validate_enclosure_base_dimensions(
    *,
    length_mm: float,
    width_mm: float,
    height_mm: float,
    wall_thickness_mm: float,
    floor_thickness_mm: float,
    corner_radius_mm: float = 0.0,
    boss_count: int = 0,
    boss_outer_diameter_mm: float = 0.0,
    boss_hole_diameter_mm: float = 0.0,
    boss_offset_x_mm: Optional[float] = None,
    boss_offset_y_mm: Optional[float] = None,
    cable_openings: Sequence[CableOpeningSpec] = (),
    fn: int = 64,
) -> EffectiveEnclosureBaseDimensions:
    """Validate all `enclosure_base` dimensions, bosses, and cable openings without mutating inputs."""
    issues: List[ValidationIssue] = []

    for name, val in (
        ("length_mm", length_mm),
        ("width_mm", width_mm),
        ("height_mm", height_mm),
        ("wall_thickness_mm", wall_thickness_mm),
        ("floor_thickness_mm", floor_thickness_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    if is_valid_number(wall_thickness_mm) and 0.0 < wall_thickness_mm < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "wall_thickness_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                f"wall_thickness_mm ({wall_thickness_mm} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
            )
        )
    if is_valid_number(floor_thickness_mm) and 0.0 < floor_thickness_mm < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "floor_thickness_mm",
                "INSUFFICIENT_WALL_THICKNESS",
                f"floor_thickness_mm ({floor_thickness_mm} mm) must be >= {MIN_WALL_THICKNESS_MM} mm.",
            )
        )

    for name, val in (
        ("corner_radius_mm", corner_radius_mm),
        ("boss_outer_diameter_mm", boss_outer_diameter_mm),
        ("boss_hole_diameter_mm", boss_hole_diameter_mm),
    ):
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) < 0.0:
            issues.append(ValidationIssue(name, "NEGATIVE_DIMENSION", f"'{name}' must be >= 0 mm; got {val}."))
        elif 0.0 < float(val) < MIN_FEATURE_EPSILON_MM:
            issues.append(ValidationIssue(name, "DEGENERATE_DIMENSION", f"Non-zero '{name}' is below resolution."))

    for name, val in (("boss_offset_x_mm", boss_offset_x_mm), ("boss_offset_y_mm", boss_offset_y_mm)):
        if val is None:
            continue
        if not is_valid_number(val):
            issues.append(ValidationIssue(name, "INVALID_NUMBER", f"'{name}' must be a finite number."))
        elif float(val) <= 0.0:
            issues.append(ValidationIssue(name, "NON_POSITIVE_DIMENSION", f"'{name}' must be > 0 mm; got {val}."))

    if not is_valid_int(boss_count):
        issues.append(ValidationIssue("boss_count", "INVALID_TYPE", f"'boss_count' must be an integer; got {boss_count!r}."))
    elif boss_count not in (0, 2, 4):
        issues.append(
            ValidationIssue(
                "boss_count",
                "INVALID_BOSS_COUNT",
                f"Supported boss_count values are 0, 2, or 4; got {boss_count}.",
            )
        )

    if not is_valid_int(fn) or fn < 16 or fn > 720:
        issues.append(ValidationIssue("fn", "INVALID_FACET_COUNT", f"'fn' must be an integer in [16, 720]; got {fn!r}."))

    if issues:
        raise GeometryValidationError(issues)

    # Cavity & corner radius validation
    cavity_len = length_mm - (2.0 * wall_thickness_mm)
    cavity_wid = width_mm - (2.0 * wall_thickness_mm)
    cavity_dep = height_mm - floor_thickness_mm

    if cavity_len < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "wall_thickness_mm",
                "INVALID_CAVITY_DIMENSIONS",
                f"2 * wall_thickness_mm ({2.0 * wall_thickness_mm} mm) leaves insufficient X cavity ({cavity_len} mm).",
            )
        )
    if cavity_wid < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "wall_thickness_mm",
                "INVALID_CAVITY_DIMENSIONS",
                f"2 * wall_thickness_mm ({2.0 * wall_thickness_mm} mm) leaves insufficient Y cavity ({cavity_wid} mm).",
            )
        )
    if cavity_dep < MIN_WALL_THICKNESS_MM:
        issues.append(
            ValidationIssue(
                "floor_thickness_mm",
                "INVALID_CAVITY_DIMENSIONS",
                f"floor_thickness_mm ({floor_thickness_mm} mm) leaves insufficient cavity depth ({cavity_dep} mm).",
            )
        )

    if corner_radius_mm > 0.0:
        max_r = 0.5 * min(length_mm, width_mm)
        if corner_radius_mm >= max_r or (max_r - corner_radius_mm) < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "corner_radius_mm",
                    "INVALID_CORNER_RADIUS",
                    f"corner_radius_mm ({corner_radius_mm} mm) must leave a positive flat wall span (< {max_r} mm).",
                )
            )

    cavity_corner_r = max(0.0, corner_radius_mm - wall_thickness_mm)

    if issues:
        raise GeometryValidationError(issues)

    # Internal screw bosses validation
    boss_centers: List[Tuple[float, float]] = []
    any_boss_param = (
        boss_outer_diameter_mm > 0.0
        or boss_hole_diameter_mm > 0.0
        or boss_offset_x_mm is not None
        or boss_offset_y_mm is not None
    )
    if boss_count == 0:
        if any_boss_param:
            issues.append(
                ValidationIssue(
                    "boss_count",
                    "UNUSED_BOSS_PARAMETER",
                    "Boss diameter/offset parameters cannot be specified when boss_count is 0.",
                )
            )
    else:
        if boss_outer_diameter_mm <= 0.0 or boss_hole_diameter_mm <= 0.0:
            issues.append(
                ValidationIssue(
                    "boss_outer_diameter_mm",
                    "MISSING_BOSS_PARAMETER",
                    "boss_outer_diameter_mm > 0 and boss_hole_diameter_mm > 0 are required when boss_count > 0.",
                )
            )
        elif boss_hole_diameter_mm >= boss_outer_diameter_mm:
            issues.append(
                ValidationIssue(
                    "boss_hole_diameter_mm",
                    "BORE_EXCEEDS_OUTER_DIAMETER",
                    (
                        f"boss_hole_diameter_mm ({boss_hole_diameter_mm} mm) must be strictly less than "
                        f"boss_outer_diameter_mm ({boss_outer_diameter_mm} mm)."
                    ),
                )
            )
        elif ((boss_outer_diameter_mm - boss_hole_diameter_mm) / 2.0) < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    "boss_hole_diameter_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Boss annular wall thickness must be >= {MIN_WALL_THICKNESS_MM} mm.",
                )
            )

        if boss_offset_x_mm is None:
            issues.append(
                ValidationIssue(
                    "boss_offset_x_mm",
                    "MISSING_BOSS_PARAMETER",
                    "boss_offset_x_mm is required when boss_count > 0.",
                )
            )
        if boss_count == 4 and boss_offset_y_mm is None:
            issues.append(
                ValidationIssue(
                    "boss_offset_y_mm",
                    "MISSING_BOSS_PARAMETER",
                    "boss_offset_y_mm is required when boss_count == 4.",
                )
            )
        if boss_count == 2 and boss_offset_y_mm is not None and abs(boss_offset_y_mm - (width_mm / 2.0)) > 1e-5:
            issues.append(
                ValidationIssue(
                    "boss_offset_y_mm",
                    "CONFLICTING_BOSS_OFFSET",
                    f"For boss_count == 2 (centerline Y=0), boss_offset_y_mm must be omitted or equal width_mm/2 ({width_mm/2.0} mm).",
                )
            )

        if not issues and boss_offset_x_mm is not None:
            bx = (length_mm / 2.0) - boss_offset_x_mm
            by = 0.0 if boss_count == 2 else (width_mm / 2.0) - float(boss_offset_y_mm)  # type: ignore[arg-type]
            r_boss = boss_outer_diameter_mm / 2.0
            r_hole = boss_hole_diameter_mm / 2.0

            if bx <= r_boss + (MIN_WALL_THICKNESS_MM / 2.0):
                issues.append(
                    ValidationIssue(
                        "boss_offset_x_mm",
                        "OVERLAPPING_BOSSES",
                        "Opposite X bosses overlap or fail to maintain separation across X=0.",
                    )
                )
            if boss_count == 4 and by <= r_boss + (MIN_WALL_THICKNESS_MM / 2.0):
                issues.append(
                    ValidationIssue(
                        "boss_offset_y_mm",
                        "OVERLAPPING_BOSSES",
                        "Opposite Y bosses overlap or fail to maintain separation across Y=0.",
                    )
                )

            # Boss center must lie strictly inside the internal cavity and boss hole must not breach outer wall
            cav_half_x = cavity_len / 2.0
            cav_half_y = cavity_wid / 2.0
            if (cav_half_x - bx) < (r_hole + MIN_WALL_THICKNESS_MM):
                issues.append(
                    ValidationIssue(
                        "boss_offset_x_mm",
                        "BOSS_HOLE_BREACHES_WALL",
                        "Boss hole is too close to or breaches the X enclosure wall.",
                    )
                )
            if (cav_half_y - abs(by)) < (r_hole + MIN_WALL_THICKNESS_MM):
                issues.append(
                    ValidationIssue(
                        "boss_offset_y_mm",
                        "BOSS_HOLE_BREACHES_WALL",
                        "Boss hole is too close to or breaches the Y enclosure wall.",
                    )
                )
            # Also check rounded inner corner clearance for boss hole
            if cavity_corner_r > 0.0:
                icx = cav_half_x - cavity_corner_r
                icy = cav_half_y - cavity_corner_r
                if bx > icx and abs(by) > icy:
                    dist_hole = math.hypot(bx - icx, abs(by) - icy) + r_hole
                    if (cavity_corner_r - dist_hole) < MIN_WALL_THICKNESS_MM:
                        issues.append(
                            ValidationIssue(
                                "corner_radius_mm",
                                "BOSS_HOLE_BREACHES_WALL",
                                "Boss hole breaches or is too close to the rounded corner wall.",
                            )
                        )

            if boss_count == 2:
                boss_centers = [(-bx, 0.0), (bx, 0.0)]
            else:
                boss_centers = [(-bx, -by), (bx, -by), (-bx, by), (bx, by)]

    # Cable openings boundary, ligament, and boss-collision validation
    by_wall: dict[str, List[Tuple[int, CableOpeningSpec]]] = {w: [] for w in VALID_WALLS}
    for idx, op in enumerate(cable_openings):
        by_wall[op.wall].append((idx, op))
        prefix = f"cable_openings[{idx}]"
        half_w = op.span_width_mm / 2.0
        half_h = op.span_height_mm / 2.0

        # Vertical bounds: must keep >= MIN_WALL_THICKNESS_MM above floor and below top rim
        bottom_margin = (op.center_z_mm - half_h) - floor_thickness_mm
        top_margin = height_mm - (op.center_z_mm + half_h)
        if bottom_margin <= 0.0 or top_margin <= 0.0:
            issues.append(
                ValidationIssue(
                    f"{prefix}.center_z_mm",
                    "OPENING_OUTSIDE_WALL",
                    (
                        f"Opening vertical span [{op.center_z_mm - half_h:.3f}, {op.center_z_mm + half_h:.3f}] mm "
                        f"exceeds usable wall height [{floor_thickness_mm}, {height_mm}] mm."
                    ),
                )
            )
        elif bottom_margin < MIN_WALL_THICKNESS_MM or top_margin < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    f"{prefix}.center_z_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Opening leaves insufficient vertical wall ligament (< {MIN_WALL_THICKNESS_MM} mm) to floor or top rim.",
                )
            )

        # Horizontal bounds: must stay inside the flat full-thickness wall zone (clear of side walls & corner arcs)
        wall_outer_span = length_mm if op.wall in ("front", "back") else width_mm
        flat_half_span = (wall_outer_span / 2.0) - max(wall_thickness_mm, corner_radius_mm)
        lateral_margin = flat_half_span - (abs(op.offset_mm) + half_w)
        if lateral_margin <= 0.0:
            issues.append(
                ValidationIssue(
                    f"{prefix}.offset_mm",
                    "OPENING_OUTSIDE_WALL",
                    (
                        f"Opening horizontal span exceeds flat '{op.wall}' wall zone "
                        f"(+/-{flat_half_span:.3f} mm clear of corners/side walls)."
                    ),
                )
            )
        elif lateral_margin < MIN_WALL_THICKNESS_MM:
            issues.append(
                ValidationIssue(
                    f"{prefix}.offset_mm",
                    "INSUFFICIENT_WALL_THICKNESS",
                    f"Opening leaves insufficient lateral wall ligament (< {MIN_WALL_THICKNESS_MM} mm) on '{op.wall}' wall.",
                )
            )

        # Check that the wall opening does not cut into an internal screw boss adjacent to that wall
        if boss_centers and boss_outer_diameter_mm > 0.0:
            r_boss = boss_outer_diameter_mm / 2.0
            for bx_c, by_c in boss_centers:
                if op.wall == "front":
                    wall_inner_dist = (by_c - r_boss) - (-(width_mm / 2.0) + wall_thickness_mm)
                    lat_gap = abs(op.offset_mm - bx_c) - (half_w + r_boss)
                elif op.wall == "back":
                    wall_inner_dist = ((width_mm / 2.0) - wall_thickness_mm) - (by_c + r_boss)
                    lat_gap = abs(op.offset_mm - bx_c) - (half_w + r_boss)
                elif op.wall == "left":
                    wall_inner_dist = (bx_c - r_boss) - (-(length_mm / 2.0) + wall_thickness_mm)
                    lat_gap = abs(op.offset_mm - by_c) - (half_w + r_boss)
                else:
                    wall_inner_dist = ((length_mm / 2.0) - wall_thickness_mm) - (bx_c + r_boss)
                    lat_gap = abs(op.offset_mm - by_c) - (half_w + r_boss)

                if wall_inner_dist < 0.5 and lat_gap < MIN_WALL_THICKNESS_MM:
                    issues.append(
                        ValidationIssue(
                            prefix,
                            "OPENING_INTERSECTS_BOSS",
                            f"Opening on '{op.wall}' wall intersects or leaves insufficient clearance to an internal screw boss.",
                        )
                    )
                    break

    # Pairwise separation check between multiple openings on the same wall
    for wall_name, indexed_ops in by_wall.items():
        for i in range(len(indexed_ops)):
            idx_a, a = indexed_ops[i]
            for j in range(i + 1, len(indexed_ops)):
                idx_b, b = indexed_ops[j]
                dx = abs(a.offset_mm - b.offset_mm) - ((a.span_width_mm + b.span_width_mm) / 2.0)
                dz = abs(a.center_z_mm - b.center_z_mm) - ((a.span_height_mm + b.span_height_mm) / 2.0)
                if max(dx, dz) < MIN_WALL_THICKNESS_MM:
                    issues.append(
                        ValidationIssue(
                            f"cable_openings[{idx_b}]",
                            "OVERLAPPING_OPENINGS",
                            f"Openings [{idx_a}] and [{idx_b}] on '{wall_name}' wall overlap or violate {MIN_WALL_THICKNESS_MM} mm ligament.",
                        )
                    )

    if issues:
        raise GeometryValidationError(issues)

    return EffectiveEnclosureBaseDimensions(
        length_mm=length_mm,
        width_mm=width_mm,
        height_mm=height_mm,
        wall_thickness_mm=wall_thickness_mm,
        floor_thickness_mm=floor_thickness_mm,
        corner_radius_mm=corner_radius_mm,
        cavity_length_mm=cavity_len,
        cavity_width_mm=cavity_wid,
        cavity_depth_mm=cavity_dep,
        cavity_corner_radius_mm=cavity_corner_r,
        boss_count=boss_count,
        boss_outer_diameter_mm=boss_outer_diameter_mm,
        boss_hole_diameter_mm=boss_hole_diameter_mm,
        boss_centers_xy_mm=tuple(boss_centers),
        cable_openings=tuple(cable_openings),
    )
