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
    "ALLOWED_SPACER_FIELDS",
    "ALLOWED_SPEC_FIELDS",
    "EffectiveBlockDimensions",
    "EffectiveBracketDimensions",
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
    "REQUIRED_SPACER_FIELDS",
    "ValidationIssue",
    "build_spacer_profile",
    "is_valid_int",
    "is_valid_number",
    "validate_adapter_dict",
    "validate_adapter_dimensions",
    "validate_common_metadata",
    "validate_mounting_bracket_dict",
    "validate_mounting_bracket_dimensions",
    "validate_rectangular_block_dict",
    "validate_rectangular_block_dimensions",
    "validate_spacer_bushing_dict",
    "validate_spacer_bushing_dimensions",
]
