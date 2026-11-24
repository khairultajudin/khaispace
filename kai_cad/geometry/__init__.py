"""Geometry primitives for KAI CAD Studio."""

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
    "build_stepped_adapter_profile",
    "compute_effective_adapter_dimensions",
    "format_mm",
    "resolve_interface_clearances",
    "validate_profile_polygon",
]
