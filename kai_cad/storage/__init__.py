"""Local workspace persistence layer for KAI CAD Studio MCP Server (Phase 2)."""

from .repository import (
    CorruptedRecordError,
    DesignRepository,
    FileDesignRepository,
    PersistedDesign,
    PathSecurityError,
    ensure_within_workspace,
    resolve_workspace_root,
    validate_design_id,
    validate_output_name,
)

__all__ = [
    "CorruptedRecordError",
    "DesignRepository",
    "FileDesignRepository",
    "PathSecurityError",
    "PersistedDesign",
    "ensure_within_workspace",
    "resolve_workspace_root",
    "validate_design_id",
    "validate_output_name",
]
