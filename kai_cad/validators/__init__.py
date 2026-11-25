"""Validation modules for KAI CAD Studio."""

from .adapter_validator import (
    ALLOWED_SPEC_FIELDS,
    OPTIONAL_NUMERIC_FIELDS,
    PER_INTERFACE_CLEARANCE_FIELDS,
    REQUIRED_ADAPTER_FIELDS,
    validate_adapter_dict,
    validate_adapter_dimensions,
)
from .common import MIN_WALL_THICKNESS_MM, is_valid_int, is_valid_number, validate_common_metadata
from .enclosure_base_validator import (
    ALLOWED_ENCLOSURE_BASE_FIELDS,
    CableOpeningSpec,
    EffectiveEnclosureBaseDimensions,
    REQUIRED_ENCLOSURE_BASE_FIELDS,
    validate_enclosure_base_dict,
    validate_enclosure_base_dimensions,
)
from .enclosure_lid_validator import (
    ALLOWED_ENCLOSURE_LID_FIELDS,
    EffectiveEnclosureLidDimensions,
    REQUIRED_ENCLOSURE_LID_FIELDS,
    validate_enclosure_lid_dict,
    validate_enclosure_lid_dimensions,
)
from .errors import ExportDependencyError, GeometryValidationError, KaiCadError, ValidationIssue
from .mounting_bracket_validator import (
    ALLOWED_BRACKET_FIELDS,
    EffectiveBracketDimensions,
    REQUIRED_BRACKET_FIELDS,
    validate_mounting_bracket_dict,
    validate_mounting_bracket_dimensions,
)
from .rectangular_block_validator import (
    ALLOWED_BLOCK_FIELDS,
    EffectiveBlockDimensions,
    REQUIRED_BLOCK_FIELDS,
    validate_rectangular_block_dict,
    validate_rectangular_block_dimensions,
)
from .spacer_bushing_validator import (
    ALLOWED_SPACER_FIELDS,
    EffectiveSpacerDimensions,
    REQUIRED_SPACER_FIELDS,
    build_spacer_profile,
    validate_spacer_bushing_dict,
    validate_spacer_bushing_dimensions,
)

__all__ = [
    "ALLOWED_BLOCK_FIELDS",
    "ALLOWED_BRACKET_FIELDS",
    "ALLOWED_ENCLOSURE_BASE_FIELDS",
    "ALLOWED_ENCLOSURE_LID_FIELDS",
    "ALLOWED_SPACER_FIELDS",
    "ALLOWED_SPEC_FIELDS",
    "CableOpeningSpec",
    "EffectiveBlockDimensions",
    "EffectiveBracketDimensions",
    "EffectiveEnclosureBaseDimensions",
    "EffectiveEnclosureLidDimensions",
    "EffectiveSpacerDimensions",
    "ExportDependencyError",
    "GeometryValidationError",
    "KaiCadError",
    "MIN_WALL_THICKNESS_MM",
    "OPTIONAL_NUMERIC_FIELDS",
    "PER_INTERFACE_CLEARANCE_FIELDS",
    "REQUIRED_ADAPTER_FIELDS",
    "REQUIRED_BLOCK_FIELDS",
    "REQUIRED_BRACKET_FIELDS",
    "REQUIRED_ENCLOSURE_BASE_FIELDS",
    "REQUIRED_ENCLOSURE_LID_FIELDS",
    "REQUIRED_SPACER_FIELDS",
    "ValidationIssue",
    "build_spacer_profile",
    "is_valid_int",
    "is_valid_number",
    "validate_adapter_dict",
    "validate_adapter_dimensions",
    "validate_common_metadata",
    "validate_enclosure_base_dict",
    "validate_enclosure_base_dimensions",
    "validate_enclosure_lid_dict",
    "validate_enclosure_lid_dimensions",
    "validate_mounting_bracket_dict",
    "validate_mounting_bracket_dimensions",
    "validate_rectangular_block_dict",
    "validate_rectangular_block_dimensions",
    "validate_spacer_bushing_dict",
    "validate_spacer_bushing_dimensions",
]
