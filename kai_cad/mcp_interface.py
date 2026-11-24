"""Interfaces for future KAI CAD Studio MCP (Model Context Protocol) integration.

Phase 0 defines the typed tool contracts and a pure-Python local reference adapter
so a future MCP server (stdio or HTTP/SSE) can expose KAI CAD Studio tools without
changing the parametric CAD engine.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Protocol, runtime_checkable

from kai_cad.exporters.openscad_exporter import export_stl_with_openscad, write_scad_file
from kai_cad.generators.custom_adapter import CustomAdapterSpec, generate_custom_adapter
from kai_cad.lifecycle import DesignRecord, DesignState
from kai_cad.validators.errors import GeometryValidationError


@dataclass(frozen=True)
class McpToolResponse:
    """Standardized JSON-serializable envelope returned by KAI CAD MCP tools."""

    ok: bool
    tool: str
    data: Dict[str, Any] = field(default_factory=dict)
    errors: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@runtime_checkable
class KaiCadMcpProvider(Protocol):
    """Protocol implemented by future KAI CAD MCP servers and local adapters."""

    def cad_validate_spec(self, component_type: str, params: Mapping[str, Any]) -> McpToolResponse:
        """Validate component parameters without writing files."""
        ...

    def cad_generate_scad(
        self,
        design_id: str,
        component_type: str,
        params: Mapping[str, Any],
        output_scad_path: str,
    ) -> McpToolResponse:
        """Validate parameters, generate deterministic OpenSCAD source, and write `.scad`."""
        ...

    def cad_export_stl(
        self,
        design_id: str,
        scad_path: str,
        output_stl_path: str,
        openscad_bin: Optional[str] = None,
    ) -> McpToolResponse:
        """Export an STL mesh via local OpenSCAD CLI if installed."""
        ...

    def cad_get_design_state(self, design_id: str) -> McpToolResponse:
        """Retrieve the current lifecycle state and artifacts for a design."""
        ...

    def cad_transition_state(
        self,
        design_id: str,
        target_state: str,
        note: str = "",
    ) -> McpToolResponse:
        """Advance a design through the 6-state KAI CAD lifecycle."""
        ...


class LocalKaiCadMcpAdapter:
    """In-process reference implementation of `KaiCadMcpProvider` (zero external deps)."""

    SUPPORTED_COMPONENTS = ("custom_adapter",)

    def __init__(self) -> None:
        self._records: Dict[str, DesignRecord] = {}

    def cad_validate_spec(self, component_type: str, params: Mapping[str, Any]) -> McpToolResponse:
        if component_type != "custom_adapter":
            return McpToolResponse(
                ok=False,
                tool="cad_validate_spec",
                errors=[{"code": "UNSUPPORTED_COMPONENT", "message": f"Unknown component '{component_type}'."}],
            )
        try:
            spec = CustomAdapterSpec.from_dict(params)
        except GeometryValidationError as exc:
            return McpToolResponse(
                ok=False,
                tool="cad_validate_spec",
                errors=[{"field": i.field, "code": i.code, "message": i.message} for i in exc.issues],
            )
        return McpToolResponse(
            ok=True,
            tool="cad_validate_spec",
            data={"component_type": component_type, "spec": spec.to_dict(), "spec_sha256": spec.spec_sha256()},
        )

    def cad_generate_scad(
        self,
        design_id: str,
        component_type: str,
        params: Mapping[str, Any],
        output_scad_path: str,
    ) -> McpToolResponse:
        if component_type != "custom_adapter":
            return McpToolResponse(
                ok=False,
                tool="cad_generate_scad",
                errors=[{"code": "UNSUPPORTED_COMPONENT", "message": f"Unknown component '{component_type}'."}],
            )
        try:
            result = generate_custom_adapter(params)
        except GeometryValidationError as exc:
            return McpToolResponse(
                ok=False,
                tool="cad_generate_scad",
                errors=[{"field": i.field, "code": i.code, "message": i.message} for i in exc.issues],
            )

        written = write_scad_file(result.scad_source, Path(output_scad_path))
        record = DesignRecord(
            design_id=design_id,
            component_type=component_type,
            scad_path=str(written),
            spec_sha256=result.spec_sha256,
        )
        record.transition(DesignState.GENERATED, note="OpenSCAD source generated.")
        record.transition(DesignState.VALIDATED, note="Dimensions and geometric feasibility validated.")
        self._records[design_id] = record

        return McpToolResponse(
            ok=True,
            tool="cad_generate_scad",
            data={
                "design_id": design_id,
                "state": record.state.value,
                "scad_path": str(written),
                "spec_sha256": result.spec_sha256,
                "scad_sha256": result.scad_sha256,
            },
        )

    def cad_export_stl(
        self,
        design_id: str,
        scad_path: str,
        output_stl_path: str,
        openscad_bin: Optional[str] = None,
    ) -> McpToolResponse:
        export = export_stl_with_openscad(scad_path, output_stl_path, openscad_bin=openscad_bin)
        if not export.success:
            return McpToolResponse(
                ok=False,
                tool="cad_export_stl",
                data={
                    "design_id": design_id,
                    "openscad_available": export.openscad_available,
                },
                errors=[{"code": "STL_EXPORT_FAILED", "message": export.message}],
            )

        record = self._records.get(design_id)
        if record is not None and record.state == DesignState.VALIDATED:
            record.stl_path = str(export.stl_path)
            record.transition(DesignState.EXPORTED, note=export.message)

        return McpToolResponse(
            ok=True,
            tool="cad_export_stl",
            data={
                "design_id": design_id,
                "stl_path": str(export.stl_path),
                "openscad_binary": export.openscad_binary,
                "message": export.message,
                "state": record.state.value if record else None,
            },
        )

    def cad_get_design_state(self, design_id: str) -> McpToolResponse:
        record = self._records.get(design_id)
        if record is None:
            return McpToolResponse(
                ok=False,
                tool="cad_get_design_state",
                errors=[{"code": "NOT_FOUND", "message": f"Design '{design_id}' not found."}],
            )
        return McpToolResponse(
            ok=True,
            tool="cad_get_design_state",
            data={
                "design_id": record.design_id,
                "component_type": record.component_type,
                "state": record.state.value,
                "scad_path": record.scad_path,
                "stl_path": record.stl_path,
                "spec_sha256": record.spec_sha256,
                "history": [asdict(ev) for ev in record.history],
            },
        )

    def cad_transition_state(
        self,
        design_id: str,
        target_state: str,
        note: str = "",
    ) -> McpToolResponse:
        record = self._records.get(design_id)
        if record is None:
            return McpToolResponse(
                ok=False,
                tool="cad_transition_state",
                errors=[{"code": "NOT_FOUND", "message": f"Design '{design_id}' not found."}],
            )
        try:
            target = DesignState(target_state)
            record.transition(target, note=note)
        except ValueError as exc:
            return McpToolResponse(
                ok=False,
                tool="cad_transition_state",
                errors=[{"code": "INVALID_TRANSITION", "message": str(exc)}],
            )
        return McpToolResponse(
            ok=True,
            tool="cad_transition_state",
            data={"design_id": design_id, "state": record.state.value},
        )
