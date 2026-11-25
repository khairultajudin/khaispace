"""Deterministic symmetric 1D hole-pattern layout helpers (millimetres)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass(frozen=True)
class SymmetricAxisPattern:
    """Resolved symmetric 1D hole center coordinates along a centered span [-span/2, +span/2]."""

    count: int
    spacing_mm: float
    edge_margin_mm: float
    coordinates_mm: Tuple[float, ...]


def solve_symmetric_1d_pattern(
    *,
    span_mm: float,
    count: int,
    spacing_mm: Optional[float],
    edge_margin_mm: Optional[float],
    axis_label: str,
    tol_mm: float = 1e-5,
) -> SymmetricAxisPattern:
    """Resolve symmetric hole coordinates along `[-span_mm/2, +span_mm/2]`.

    Rules:
    - `count == 0`: returns empty coordinates (`spacing_mm` and `edge_margin_mm` must be None).
    - `count == 1`: places single hole at `0.0`; rejects `spacing_mm` if supplied; if `edge_margin_mm`
      is supplied, requires `edge_margin_mm == span_mm / 2` within `tol_mm`.
    - `count >= 2`:
      - Both `spacing_mm` and `edge_margin_mm` supplied: requires `(count - 1)*spacing + 2*margin == span_mm`.
      - Only `spacing_mm` supplied: derives `edge_margin_mm = (span_mm - (count - 1)*spacing_mm) / 2`.
      - Only `edge_margin_mm` supplied: derives `spacing_mm = (span_mm - 2*edge_margin_mm) / (count - 1)`.
      - Neither supplied: deterministic uniform grid `spacing_mm = edge_margin_mm = span_mm / (count + 1)`.
    Raises ValueError with `(code, message)` formatted string on conflict/ambiguity.
    """
    if count == 0:
        if spacing_mm is not None or edge_margin_mm is not None:
            raise ValueError(
                f"UNUSED_HOLE_PARAMETER: Hole spacing/margin specified on {axis_label} when hole count is 0."
            )
        return SymmetricAxisPattern(count=0, spacing_mm=0.0, edge_margin_mm=0.0, coordinates_mm=())

    if count == 1:
        if spacing_mm is not None:
            raise ValueError(
                f"AMBIGUOUS_HOLE_SPACING: Hole spacing cannot be specified on {axis_label} when hole count is 1."
            )
        expected_margin = span_mm / 2.0
        if edge_margin_mm is not None and abs(edge_margin_mm - expected_margin) > tol_mm:
            raise ValueError(
                f"CONFLICTING_EDGE_MARGIN: Symmetric single hole on {axis_label} sits at 0 mm "
                f"(margin {expected_margin} mm), conflicting with edge_margin={edge_margin_mm} mm."
            )
        return SymmetricAxisPattern(
            count=1,
            spacing_mm=0.0,
            edge_margin_mm=expected_margin,
            coordinates_mm=(0.0,),
        )

    # count >= 2
    if spacing_mm is not None and edge_margin_mm is not None:
        implied_span = (count - 1) * spacing_mm + (2.0 * edge_margin_mm)
        if abs(implied_span - span_mm) > tol_mm:
            raise ValueError(
                f"CONFLICTING_HOLE_LAYOUT: On {axis_label}, (count-1)*spacing + 2*edge_margin = "
                f"{implied_span} mm does not match span {span_mm} mm."
            )
        resolved_spacing = spacing_mm
        resolved_margin = edge_margin_mm
    elif spacing_mm is not None:
        resolved_spacing = spacing_mm
        resolved_margin = (span_mm - ((count - 1) * spacing_mm)) / 2.0
    elif edge_margin_mm is not None:
        if 2.0 * edge_margin_mm >= span_mm:
            raise ValueError(
                f"HOLE_OUTSIDE_BOUNDARY: On {axis_label}, 2 * edge_margin ({2.0 * edge_margin_mm} mm) "
                f"meets or exceeds span ({span_mm} mm)."
            )
        resolved_margin = edge_margin_mm
        resolved_spacing = (span_mm - (2.0 * edge_margin_mm)) / float(count - 1)
    else:
        resolved_spacing = span_mm / float(count + 1)
        resolved_margin = resolved_spacing

    start = -0.5 * float(count - 1) * resolved_spacing
    coords = tuple(start + (i * resolved_spacing) for i in range(count))
    return SymmetricAxisPattern(
        count=count,
        spacing_mm=resolved_spacing,
        edge_margin_mm=resolved_margin,
        coordinates_mm=coords,
    )

