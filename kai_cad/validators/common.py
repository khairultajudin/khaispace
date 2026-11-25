"""Shared schema and numeric validation utilities for KAI CAD Studio validators."""

from __future__ import annotations

import math
from typing import Any, FrozenSet, List, Mapping

from kai_cad.validators.errors import ValidationIssue

# Minimum remaining solid ligament / wall thickness (mm) around holes and thin walls
# for Phase 4 structural-geometry sanity (geometric floor, not load certification).
MIN_WALL_THICKNESS_MM: float = 0.2


def is_valid_number(value: Any) -> bool:
    """Return True when *value* is a finite int or float (explicitly excluding bool)."""
    if isinstance(value, bool):
        return False
    if not isinstance(value, (int, float)):
        return False
    return math.isfinite(float(value))


def is_valid_int(value: Any) -> bool:
    """Return True when *value* is an int (explicitly excluding bool)."""
    return not isinstance(value, bool) and isinstance(value, int)


def validate_common_metadata(
    raw: Mapping[str, Any],
    allowed_fields: FrozenSet[str],
    issues: List[ValidationIssue],
) -> None:
    """Validate units ('mm'), unknown keys, name, description, and facet count 'fn'."""
    units = raw.get("units", "mm")
    if not isinstance(units, str) or units.strip().lower() != "mm":
        issues.append(
            ValidationIssue(
                "units",
                "INVALID_UNITS",
                f"KAI CAD Studio requires millimetres ('mm'); got {units!r}.",
            )
        )

    for key in sorted(set(raw.keys()) - allowed_fields):
        issues.append(
            ValidationIssue(
                key,
                "UNKNOWN_PARAMETER",
                f"Unrecognized parameter '{key}'.",
            )
        )

    if "name" in raw and raw["name"] is not None:
        if not isinstance(raw["name"], str) or not raw["name"].strip():
            issues.append(
                ValidationIssue("name", "INVALID_TYPE", "'name' must be a non-empty string.")
            )

    if "description" in raw and raw["description"] is not None:
        if not isinstance(raw["description"], str):
            issues.append(
                ValidationIssue("description", "INVALID_TYPE", "'description' must be a string.")
            )

    if "fn" in raw and raw["fn"] is not None:
        fn_val = raw["fn"]
        if not is_valid_int(fn_val):
            issues.append(
                ValidationIssue("fn", "INVALID_TYPE", f"'fn' must be an integer; got {fn_val!r}.")
            )
        elif fn_val < 16 or fn_val > 720:
            issues.append(
                ValidationIssue(
                    "fn",
                    "INVALID_FACET_COUNT",
                    f"'fn' must be an integer in [16, 720]; got {fn_val!r}.",
                )
            )

