"""Pure-Python parametric geometry utilities and OpenSCAD formatting helpers (mm)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Tuple


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
    Radial clearance (`clearance_mm`) reduces outer mating diameters by `2 * clearance_mm`
    and enlarges non-zero bore diameters by `2 * clearance_mm`.
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
) -> EffectiveAdapterDimensions:
    """Derive effective (clearance-adjusted) dimensions without mutating nominal inputs."""
    body_length = overall_length_mm - (end_a_length_mm + end_b_length_mm)
    eff_end_a_od = end_a_diameter_mm - (2.0 * clearance_mm)
    eff_end_b_od = end_b_diameter_mm - (2.0 * clearance_mm)
    eff_body_od = body_diameter_mm - (2.0 * clearance_mm)
    eff_bore_a = (bore_a_diameter_mm + (2.0 * clearance_mm)) if bore_a_diameter_mm > 0.0 else 0.0
    eff_bore_b = (bore_b_diameter_mm + (2.0 * clearance_mm)) if bore_b_diameter_mm > 0.0 else 0.0
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
