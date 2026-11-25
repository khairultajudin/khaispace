"""Central component registry and dispatcher for KAI CAD Studio."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, Mapping, Protocol, Tuple

from kai_cad.generators.custom_adapter import CustomAdapterSpec, generate_custom_adapter
from kai_cad.generators.enclosure_base import EnclosureBaseSpec, generate_enclosure_base
from kai_cad.generators.enclosure_lid import EnclosureLidSpec, generate_enclosure_lid
from kai_cad.generators.mounting_bracket import MountingBracketSpec, generate_mounting_bracket
from kai_cad.generators.rectangular_block import RectangularBlockSpec, generate_rectangular_block
from kai_cad.generators.spacer_bushing import SpacerBushingSpec, generate_spacer_bushing
from kai_cad.validators.adapter_validator import validate_adapter_dict
from kai_cad.validators.enclosure_base_validator import validate_enclosure_base_dict
from kai_cad.validators.enclosure_lid_validator import validate_enclosure_lid_dict
from kai_cad.validators.errors import KaiCadError
from kai_cad.validators.mounting_bracket_validator import validate_mounting_bracket_dict
from kai_cad.validators.rectangular_block_validator import validate_rectangular_block_dict
from kai_cad.validators.spacer_bushing_validator import validate_spacer_bushing_dict


class UnsupportedComponentError(KaiCadError, ValueError):
    """Raised when an unknown CAD component_type is requested."""


class ComponentSpecProtocol(Protocol):
    name: str

    def to_dict(self) -> Dict[str, Any]: ...

    def spec_sha256(self) -> str: ...


class ComponentResultProtocol(Protocol):
    spec: ComponentSpecProtocol
    effective_dimensions: Any
    scad_source: str
    spec_sha256: str
    scad_sha256: str


@dataclass(frozen=True)
class ComponentRegistration:
    """Registry entry binding a component identifier to its validator, spec class, and generator."""

    component_type: str
    spec_cls: Any
    dict_validator: Callable[[Mapping[str, Any]], None]
    generator: Callable[[Any], ComponentResultProtocol]


COMPONENT_REGISTRY: Dict[str, ComponentRegistration] = {
    "custom_adapter": ComponentRegistration(
        component_type="custom_adapter",
        spec_cls=CustomAdapterSpec,
        dict_validator=validate_adapter_dict,
        generator=generate_custom_adapter,
    ),
    "rectangular_block": ComponentRegistration(
        component_type="rectangular_block",
        spec_cls=RectangularBlockSpec,
        dict_validator=validate_rectangular_block_dict,
        generator=generate_rectangular_block,
    ),
    "mounting_bracket": ComponentRegistration(
        component_type="mounting_bracket",
        spec_cls=MountingBracketSpec,
        dict_validator=validate_mounting_bracket_dict,
        generator=generate_mounting_bracket,
    ),
    "spacer_bushing": ComponentRegistration(
        component_type="spacer_bushing",
        spec_cls=SpacerBushingSpec,
        dict_validator=validate_spacer_bushing_dict,
        generator=generate_spacer_bushing,
    ),
    "enclosure_base": ComponentRegistration(
        component_type="enclosure_base",
        spec_cls=EnclosureBaseSpec,
        dict_validator=validate_enclosure_base_dict,
        generator=generate_enclosure_base,
    ),
    "enclosure_lid": ComponentRegistration(
        component_type="enclosure_lid",
        spec_cls=EnclosureLidSpec,
        dict_validator=validate_enclosure_lid_dict,
        generator=generate_enclosure_lid,
    ),
}

SUPPORTED_COMPONENTS: Tuple[str, ...] = tuple(COMPONENT_REGISTRY.keys())


def get_component_registration(component_type: str) -> ComponentRegistration:
    """Return the `ComponentRegistration` for *component_type*, or raise UnsupportedComponentError."""
    if not isinstance(component_type, str) or component_type not in COMPONENT_REGISTRY:
        raise UnsupportedComponentError(
            f"Unsupported component_type '{component_type}'. Supported: {', '.join(SUPPORTED_COMPONENTS)}."
        )
    return COMPONENT_REGISTRY[component_type]


def validate_component_spec(component_type: str, raw_spec: Mapping[str, Any]) -> ComponentSpecProtocol:
    """Validate *raw_spec* against *component_type* and return its immutable spec instance."""
    reg = get_component_registration(component_type)
    reg.dict_validator(raw_spec)
    return reg.spec_cls.from_dict(raw_spec)


def generate_component(component_type: str, spec: Any) -> ComponentResultProtocol:
    """Dispatch *spec* (dict or typed spec) to the registered component generator."""
    reg = get_component_registration(component_type)
    return reg.generator(spec)
