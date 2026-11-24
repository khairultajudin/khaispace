"""Parametric CAD generators for KAI CAD Studio."""

from .custom_adapter import (
    CustomAdapterResult,
    CustomAdapterSpec,
    generate_custom_adapter,
    render_custom_adapter_scad,
)

__all__ = [
    "CustomAdapterResult",
    "CustomAdapterSpec",
    "generate_custom_adapter",
    "render_custom_adapter_scad",
]
