"""Validation modules for KAI CAD Studio."""

from .adapter_validator import (
    ALLOWED_SPEC_FIELDS,
    OPTIONAL_NUMERIC_FIELDS,
    PER_INTERFACE_CLEARANCE_FIELDS,
    REQUIRED_ADAPTER_FIELDS,
    validate_adapter_dict,
    validate_adapter_dimensions,
)
from .errors import ExportDependencyError, GeometryValidationError, KaiCadError, ValidationIssue

__all__ = [
    "ALLOWED_SPEC_FIELDS",
    "ExportDependencyError",
    "GeometryValidationError",
    "KaiCadError",
    "OPTIONAL_NUMERIC_FIELDS",
    "PER_INTERFACE_CLEARANCE_FIELDS",
    "REQUIRED_ADAPTER_FIELDS",
    "ValidationIssue",
    "validate_adapter_dict",
    "validate_adapter_dimensions",
]
