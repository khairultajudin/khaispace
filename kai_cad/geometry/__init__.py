"""Geometry primitives for KAI CAD Studio."""

from .primitives import (
    EffectiveAdapterDimensions,
    build_stepped_adapter_profile,
    compute_effective_adapter_dimensions,
    format_mm,
)

__all__ = [
    "EffectiveAdapterDimensions",
    "build_stepped_adapter_profile",
    "compute_effective_adapter_dimensions",
    "format_mm",
]
