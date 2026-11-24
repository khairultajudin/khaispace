"""KAI CAD Studio — Deterministic Parametric CAD Engine for Khaispace."""

from kai_cad.exporters import (
    StlExportResult,
    export_stl_with_openscad,
    resolve_openscad_binary,
    write_scad_file,
)
from kai_cad.generators import (
    CustomAdapterResult,
    CustomAdapterSpec,
    generate_custom_adapter,
    render_custom_adapter_scad,
)
from kai_cad.lifecycle import (
    DesignRecord,
    DesignState,
    LifecycleEvent,
    can_transition,
    map_to_hub_status,
)
from kai_cad.mcp_interface import KaiCadMcpProvider, LocalKaiCadMcpAdapter, McpToolResponse
from kai_cad.validators import (
    ExportDependencyError,
    GeometryValidationError,
    KaiCadError,
    ValidationIssue,
    validate_adapter_dict,
    validate_adapter_dimensions,
)

__all__ = [
    "CustomAdapterResult",
    "CustomAdapterSpec",
    "DesignRecord",
    "DesignState",
    "ExportDependencyError",
    "GeometryValidationError",
    "KaiCadError",
    "KaiCadMcpProvider",
    "LifecycleEvent",
    "LocalKaiCadMcpAdapter",
    "McpToolResponse",
    "StlExportResult",
    "ValidationIssue",
    "can_transition",
    "export_stl_with_openscad",
    "generate_custom_adapter",
    "map_to_hub_status",
    "render_custom_adapter_scad",
    "resolve_openscad_binary",
    "validate_adapter_dict",
    "validate_adapter_dimensions",
    "write_scad_file",
]
