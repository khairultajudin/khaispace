"""Pure-Python parametric geometry utilities and OpenSCAD formatting helpers (mm)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

# Minimum positive geometric feature / margin (0.0001 mm = 0.1 micrometre).
# Well above the 1e-6 mm formatting precision so valid features never silently round to 0.
MIN_FEATURE_EPSILON_MM: float = 1e-4


def format_mm(value: float) -> str:
    """Format a millimetre float deterministically for reproducible OpenSCAD output."""
    if not math.isfinite(value):
        raise ValueError(f"Dimension must be finite, got: {value!r}")
    # Normalize -0.0 to 0.0 and format up to 6 decimal places without trailing zeros.
    normalized = 0.0 if abs(value) < 1e-12 else round(float(value), 6)
    text = f"{normalized:.6f}".rstrip("0").rstrip(".")
    return text if text else "0"


@dataclass(frozen=True)
class EffectiveAdapterDimensions:
    """Computed clearance-adjusted dimensions (mm) derived from nominal user parameters.

    Nominal user parameters are preserved separately and never mutated.
    Each mating surface resolves its radial clearance via:
      `surface_clearance = <surface>_clearance_mm if provided else clearance_mm`.
    Radial clearance reduces outer diameters by `2 * surface_clearance` and enlarges
    non-zero bore diameters by `2 * surface_clearance`.
    """

    overall_length_mm: float
    end_a_length_mm: float
    body_length_mm: float
    end_b_length_mm: float
    body_diameter_mm: float
    end_a_diameter_mm: float
    end_b_diameter_mm: float
    bore_a_diameter_mm: float
    bore_b_diameter_mm: float
    chamfer_mm: float
    clearance_mm: float
    body_clearance_mm: float = 0.0
    end_a_clearance_mm: float = 0.0
    end_b_clearance_mm: float = 0.0
    bore_a_clearance_mm: float = 0.0
    bore_b_clearance_mm: float = 0.0


def resolve_interface_clearances(
    *,
    clearance_mm: float,
    body_clearance_mm: Optional[float] = None,
    end_a_clearance_mm: Optional[float] = None,
    end_b_clearance_mm: Optional[float] = None,
    bore_a_clearance_mm: Optional[float] = None,
    bore_b_clearance_mm: Optional[float] = None,
) -> Tuple[float, float, float, float, float]:
    """Resolve per-surface radial clearances using explicit override -> global fallback precedence."""
    eff_body = clearance_mm if body_clearance_mm is None else body_clearance_mm
    eff_end_a = clearance_mm if end_a_clearance_mm is None else end_a_clearance_mm
    eff_end_b = clearance_mm if end_b_clearance_mm is None else end_b_clearance_mm
    eff_bore_a = clearance_mm if bore_a_clearance_mm is None else bore_a_clearance_mm
    eff_bore_b = clearance_mm if bore_b_clearance_mm is None else bore_b_clearance_mm
    return (eff_body, eff_end_a, eff_end_b, eff_bore_a, eff_bore_b)


def compute_effective_adapter_dimensions(
    *,
    overall_length_mm: float,
    body_diameter_mm: float,
    end_a_diameter_mm: float,
    end_b_diameter_mm: float,
    end_a_length_mm: float,
    end_b_length_mm: float,
    bore_a_diameter_mm: float,
    bore_b_diameter_mm: float,
    chamfer_mm: float,
    clearance_mm: float,
    body_clearance_mm: Optional[float] = None,
    end_a_clearance_mm: Optional[float] = None,
    end_b_clearance_mm: Optional[float] = None,
    bore_a_clearance_mm: Optional[float] = None,
    bore_b_clearance_mm: Optional[float] = None,
) -> EffectiveAdapterDimensions:
    """Derive effective (clearance-adjusted) dimensions without mutating nominal inputs."""
    c_body, c_end_a, c_end_b, c_bore_a, c_bore_b = resolve_interface_clearances(
        clearance_mm=clearance_mm,
        body_clearance_mm=body_clearance_mm,
        end_a_clearance_mm=end_a_clearance_mm,
        end_b_clearance_mm=end_b_clearance_mm,
        bore_a_clearance_mm=bore_a_clearance_mm,
        bore_b_clearance_mm=bore_b_clearance_mm,
    )
    body_length = overall_length_mm - (end_a_length_mm + end_b_length_mm)
    eff_end_a_od = end_a_diameter_mm - (2.0 * c_end_a)
    eff_end_b_od = end_b_diameter_mm - (2.0 * c_end_b)
    eff_body_od = body_diameter_mm - (2.0 * c_body)
    eff_bore_a = (bore_a_diameter_mm + (2.0 * c_bore_a)) if bore_a_diameter_mm > 0.0 else 0.0
    eff_bore_b = (bore_b_diameter_mm + (2.0 * c_bore_b)) if bore_b_diameter_mm > 0.0 else 0.0
    return EffectiveAdapterDimensions(
        overall_length_mm=overall_length_mm,
        end_a_length_mm=end_a_length_mm,
        body_length_mm=body_length,
        end_b_length_mm=end_b_length_mm,
        body_diameter_mm=eff_body_od,
        end_a_diameter_mm=eff_end_a_od,
        end_b_diameter_mm=eff_end_b_od,
        bore_a_diameter_mm=eff_bore_a,
        bore_b_diameter_mm=eff_bore_b,
        chamfer_mm=chamfer_mm,
        clearance_mm=clearance_mm,
        body_clearance_mm=c_body,
        end_a_clearance_mm=c_end_a,
        end_b_clearance_mm=c_end_b,
        bore_a_clearance_mm=c_bore_a if bore_a_diameter_mm > 0.0 else 0.0,
        bore_b_clearance_mm=c_bore_b if bore_b_diameter_mm > 0.0 else 0.0,
    )


def build_stepped_adapter_profile(dims: EffectiveAdapterDimensions) -> List[Tuple[float, float]]:
    """Build the closed 2D (radius_mm, z_mm) revolution profile for `rotate_extrude`.

    Points are ordered counter-clockwise in the r >= 0 half-plane so OpenSCAD
    produces a single watertight, manifold solid with zero coplanar z-fighting.
    """
    z1 = dims.end_a_length_mm
    z2 = dims.end_a_length_mm + dims.body_length_mm
    z_mid = dims.end_a_length_mm + (dims.body_length_mm / 2.0)
    z_top = dims.overall_length_mm

    ra_out = dims.end_a_diameter_mm / 2.0
    rbody_out = dims.body_diameter_mm / 2.0
    rb_out = dims.end_b_diameter_mm / 2.0

    ra_in = dims.bore_a_diameter_mm / 2.0
    rb_in = dims.bore_b_diameter_mm / 2.0
    c = dims.chamfer_mm

    points: List[Tuple[float, float]] = [(ra_in, 0.0)]

    # End A bottom face + optional 45-degree outer chamfer
    if c > 0.0:
        points.append((ra_out - c, 0.0))
        points.append((ra_out, c))
    else:
        points.append((ra_out, 0.0))

    # End A -> Body step at z = z1
    points.append((ra_out, z1))
    if abs(rbody_out - ra_out) > 1e-9:
        points.append((rbody_out, z1))

    # Body -> End B step at z = z2
    points.append((rbody_out, z2))
    if abs(rb_out - rbody_out) > 1e-9:
        points.append((rb_out, z2))

    # End B top face + optional 45-degree outer chamfer
    if c > 0.0:
        points.append((rb_out, z_top - c))
        points.append((rb_out - c, z_top))
    else:
        points.append((rb_out, z_top))

    # Inner bore return path from z = z_top down to z = 0
    points.append((rb_in, z_top))
    if abs(rb_in - ra_in) > 1e-9:
        points.append((rb_in, z_mid))
        points.append((ra_in, z_mid))

    return points


def _cross(o: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def _on_segment(a: Tuple[float, float], b: Tuple[float, float], p: Tuple[float, float], eps: float = 1e-9) -> bool:
    return (
        min(a[0], b[0]) - eps <= p[0] <= max(a[0], b[0]) + eps
        and min(a[1], b[1]) - eps <= p[1] <= max(a[1], b[1]) + eps
    )


def _segments_intersect(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    p3: Tuple[float, float],
    p4: Tuple[float, float],
    eps: float = 1e-9,
) -> bool:
    """Return True if closed segments [p1, p2] and [p3, p4] intersect."""
    d1 = _cross(p3, p4, p1)
    d2 = _cross(p3, p4, p2)
    d3 = _cross(p1, p2, p3)
    d4 = _cross(p1, p2, p4)

    if ((d1 > eps and d2 < -eps) or (d1 < -eps and d2 > eps)) and (
        (d3 > eps and d4 < -eps) or (d3 < -eps and d4 > eps)
    ):
        return True
    if abs(d1) <= eps and _on_segment(p3, p4, p1, eps):
        return True
    if abs(d2) <= eps and _on_segment(p3, p4, p2, eps):
        return True
    if abs(d3) <= eps and _on_segment(p1, p2, p3, eps):
        return True
    if abs(d4) <= eps and _on_segment(p1, p2, p4, eps):
        return True
    return False


def validate_profile_polygon(points: Sequence[Tuple[float, float]]) -> float:
    """Verify that *points* form a simple, non-degenerate, CCW 2D polygon in r >= 0, z >= 0.

    Returns the positive polygon area (mm^2). Raises ValueError if invalid.
    """
    n = len(points)
    if n < 3:
        raise ValueError(f"Profile polygon must have at least 3 vertices; got {n}.")

    for idx, (r, z) in enumerate(points):
        if not (math.isfinite(r) and math.isfinite(z)):
            raise ValueError(f"Profile vertex {idx} has non-finite coordinate: ({r!r}, {z!r}).")
        if r < -1e-9:
            raise ValueError(f"Profile vertex {idx} has negative radius r={r} mm (invalid for rotate_extrude).")
        if z < -1e-9:
            raise ValueError(f"Profile vertex {idx} has negative z={z} mm.")

    # Check consecutive edge lengths (no duplicate adjacent vertices) and compute signed area.
    area2 = 0.0
    for i in range(n):
        p1 = points[i]
        p2 = points[(i + 1) % n]
        seg_len = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        if seg_len <= 1e-6:
            raise ValueError(
                f"Degenerate zero-length profile edge between vertex {i} {p1} and vertex {(i + 1) % n} {p2}."
            )
        area2 += p1[0] * p2[1] - p2[0] * p1[1]

    area = area2 * 0.5
    if area <= 1e-8:
        raise ValueError(
            f"Profile polygon must have strictly positive CCW area for rotate_extrude; got {area} mm^2."
        )

    # Check all non-adjacent segment pairs for self-intersection.
    for i in range(n):
        a1 = points[i]
        a2 = points[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue  # Adjacent via wrap-around
            b1 = points[j]
            b2 = points[(j + 1) % n]
            if _segments_intersect(a1, a2, b1, b2):
                raise ValueError(
                    f"Self-intersecting profile polygon detected between edge {i} ({a1}->{a2}) "
                    f"and edge {j} ({b1}->{b2})."
                )

    return area
