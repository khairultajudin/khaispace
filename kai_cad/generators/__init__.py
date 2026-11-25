"""Parametric CAD generators and component registry for KAI CAD Studio."""

from .custom_adapter import (
    CustomAdapterResult,
    CustomAdapterSpec,
    generate_custom_adapter,
    render_custom_adapter_scad,
)
from .enclosure_base import (
    EnclosureBaseResult,
    EnclosureBaseSpec,
    generate_enclosure_base,
    render_enclosure_base_scad,
)
from .enclosure_lid import (
    EnclosureLidResult,
    EnclosureLidSpec,
    generate_enclosure_lid,
    render_enclosure_lid_scad,
)
from .mounting_bracket import (
    MountingBracketResult,
    MountingBracketSpec,
    generate_mounting_bracket,
    render_mounting_bracket_scad,
)
from .rectangular_block import (
    RectangularBlockResult,
    RectangularBlockSpec,
    generate_rectangular_block,
    render_rectangular_block_scad,
)
from .registry import (
    COMPONENT_REGISTRY,
    SUPPORTED_COMPONENTS,
    ComponentRegistration,
    UnsupportedComponentError,
    generate_component,
    get_component_registration,
    validate_component_spec,
)
from .spacer_bushing import (
    SpacerBushingResult,
    SpacerBushingSpec,
    generate_spacer_bushing,
    render_spacer_bushing_scad,
)

__all__ = [
    "COMPONENT_REGISTRY",
    "ComponentRegistration",
    "CustomAdapterResult",
    "CustomAdapterSpec",
    "EnclosureBaseResult",
    "EnclosureBaseSpec",
    "EnclosureLidResult",
    "EnclosureLidSpec",
    "MountingBracketResult",
    "MountingBracketSpec",
    "RectangularBlockResult",
    "RectangularBlockSpec",
    "SUPPORTED_COMPONENTS",
    "SpacerBushingResult",
    "SpacerBushingSpec",
    "UnsupportedComponentError",
    "generate_component",
    "generate_custom_adapter",
    "generate_enclosure_base",
    "generate_enclosure_lid",
    "generate_mounting_bracket",
    "generate_rectangular_block",
    "generate_spacer_bushing",
    "get_component_registration",
    "render_custom_adapter_scad",
    "render_enclosure_base_scad",
    "render_enclosure_lid_scad",
    "render_mounting_bracket_scad",
    "render_rectangular_block_scad",
    "render_spacer_bushing_scad",
    "validate_component_spec",
]
