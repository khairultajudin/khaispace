"""KAI CAD Studio — Live STDIO MCP Server (Official Python MCP SDK).

Stdout is reserved exclusively for MCP JSON-RPC protocol frames.
All diagnostics and logging are directed strictly to stderr.
OpenSCAD executable selection is strictly server-controlled (OPENSCAD_BIN or safe auto-detection)
and is never exposed as an MCP tool argument.
"""

from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Literal, Optional, Sequence

from kai_cad.mcp_service import KaiCadMcpService


def _configure_stderr_logging(level: str = "WARNING") -> None:
    """Configure logging strictly to stderr so stdout stays clean for MCP STDIO."""
    logging.basicConfig(
        stream=sys.stderr,
        level=getattr(logging, level.upper(), logging.WARNING),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        force=True,
    )


def _enforce_strict_tool_schemas(mcp: Any) -> None:
    """Forbid undeclared extra arguments on all registered MCP tools (additionalProperties=false)."""
    try:
        from pydantic import ConfigDict
    except ImportError:
        return

    tool_manager = getattr(mcp, "_tool_manager", None)
    if tool_manager is None or not hasattr(tool_manager, "list_tools"):
        return

    for tool in tool_manager.list_tools():
        if isinstance(getattr(tool, "parameters", None), dict):
            tool.parameters["additionalProperties"] = False
        fn_meta = getattr(tool, "fn_metadata", None)
        arg_model = getattr(fn_meta, "arg_model", None)
        if arg_model is not None and hasattr(arg_model, "model_config"):
            strict_model = type(
                arg_model.__name__,
                (arg_model,),
                {"model_config": ConfigDict(extra="forbid")},
            )
            strict_model.model_rebuild(force=True)
            fn_meta.arg_model = strict_model


def _load_mcp_server_class() -> Any:
    """Import high-level MCP server class across official Python MCP SDK v1.x and v2.x."""
    try:
        from mcp.server.fastmcp import FastMCP

        return FastMCP
    except ImportError:
        pass
    try:
        from mcp.server.mcpserver import MCPServer

        return MCPServer
    except ImportError as exc:
        raise RuntimeError(
            "The official Python MCP SDK ('mcp') is required to run the KAI CAD MCP server. "
            "Install it with: pip install 'mcp>=1.9.0,<3.0'"
        ) from exc


def create_mcp_server(
    workspace_root: Optional[Path | str] = None,
    *,
    openscad_bin: Optional[str] = None,
    stl_runner: Any = subprocess.run,
) -> Any:
    """Build and configure the MCP server exposing the six KAI CAD Studio tools."""
    server_cls = _load_mcp_server_class()

    service = KaiCadMcpService(
        workspace_root=workspace_root,
        openscad_bin=openscad_bin,
        stl_runner=stl_runner,
    )
    mcp = server_cls(
        name="kai-cad-studio",
        instructions=(
            "KAI CAD Studio parametric CAD engine (OpenSCAD, all dimensions in mm). "
            "Lifecycle: Draft -> Generated -> Validated -> Exported -> Imported -> Completed. "
            "Generate a design (.scad canonical source), validate it, then export STL mesh."
        ),
    )

    @mcp.tool(
        name="cad_generate_design",
        description=(
            "Generate a deterministic parametric OpenSCAD (.scad) CAD design from a JSON "
            "specification in millimetres and persist the design record in 'Generated' state."
        ),
    )
    def cad_generate_design(
        component_type: str,
        spec: Dict[str, Any],
        design_id: Optional[str] = None,
        output_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        return service.cad_generate_design(
            component_type=component_type,
            spec=spec,
            design_id=design_id,
            output_name=output_name,
        )

    @mcp.tool(
        name="cad_validate_design",
        description=(
            "Validate an existing persisted CAD design specification and advance its lifecycle "
            "to 'Validated' when valid. Does not export STL automatically."
        ),
    )
    def cad_validate_design(design_id: str) -> Dict[str, Any]:
        return service.cad_validate_design(design_id=design_id)

    @mcp.tool(
        name="cad_export_stl",
        description=(
            "Export a validated CAD design to an STL mesh using the server-configured OpenSCAD CLI "
            "(OPENSCAD_BIN or auto-detected system OpenSCAD) and advance its lifecycle to 'Exported'."
        ),
    )
    def cad_export_stl(
        design_id: str,
        timeout_seconds: int = 120,
    ) -> Dict[str, Any]:
        return service.cad_export_stl(
            design_id=design_id,
            timeout_seconds=timeout_seconds,
        )

    @mcp.tool(
        name="cad_get_design",
        description=(
            "Retrieve a persisted CAD design's metadata, lifecycle state, SHA-256 hashes, "
            "audit history, and artifact availability."
        ),
    )
    def cad_get_design(design_id: str) -> Dict[str, Any]:
        return service.cad_get_design(design_id=design_id)

    @mcp.tool(
        name="cad_list_designs",
        description=(
            "List persisted CAD designs in the configured workspace with optional "
            "component_type, lifecycle state, and limit filters."
        ),
    )
    def cad_list_designs(
        component_type: Optional[str] = None,
        state: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        return service.cad_list_designs(
            component_type=component_type,
            state=state,
            limit=limit,
        )

    @mcp.tool(
        name="cad_get_design_artifact",
        description=(
            "Retrieve metadata (and optional bounded text content for 'spec_json' or 'scad') "
            "for a persisted design artifact ('spec_json', 'scad', or 'stl')."
        ),
    )
    def cad_get_design_artifact(
        design_id: str,
        artifact_type: Literal["spec_json", "scad", "stl"],
        include_content: bool = False,
    ) -> Dict[str, Any]:
        return service.cad_get_design_artifact(
            design_id=design_id,
            artifact_type=artifact_type,
            include_content=include_content,
        )

    _enforce_strict_tool_schemas(mcp)
    return mcp


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kai-cad-mcp",
        description="KAI CAD Studio STDIO MCP Server (stderr logging only).",
    )
    parser.add_argument(
        "--workspace",
        help="Path to the CAD workspace root directory (defaults to KAI_CAD_WORKSPACE or ./.kai_cad_workspace).",
    )
    parser.add_argument(
        "--log-level",
        default="WARNING",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
        help="Stderr logging verbosity (default: WARNING).",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> None:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    _configure_stderr_logging(args.log_level)
    try:
        server = create_mcp_server(workspace_root=args.workspace)
        server.run(transport="stdio")
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as exc:
        logging.getLogger(__name__).error("KAI CAD MCP server terminated with error: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
