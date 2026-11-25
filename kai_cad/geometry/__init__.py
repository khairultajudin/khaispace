"""Geometry primitives and symmetric layout solvers for KAI CAD Studio."""

from .pattern_layout import SymmetricAxisPattern, solve_symmetric_1d_pattern
from .primitives import (
    MIN_FEATURE_EPSILON_MM,
    EffectiveAdapterDimensions,
    build_stepped_adapter_profile,
    compute_effective_adapter_dimensions,
    format_mm,
    resolve_interface_clearances,
    validate_profile_polygon,
)

__all__ = [
    "EffectiveAdapterDimensions",
    "MIN_FEATURE_EPSILON_MM",
    "SymmetricAxisPattern",
    "build_stepped_adapter_profile",
    "compute_effective_adapter_dimensions",
    "format_mm",
    "resolve_interface_clearances",
    "solve_symmetric_1d_pattern",
    "validate_profile_polygon",
]
