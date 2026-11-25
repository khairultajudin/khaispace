"""Thin MCP service layer delegating to the existing kai_cad engine and local persistence."""

from __future__ import annotations

import hashlib
import re
import subprocess
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from kai_cad.exporters.openscad_exporter import export_stl_with_openscad, write_scad_file
from kai_cad.generators.registry import (
    SUPPORTED_COMPONENTS,
    generate_component,
    validate_component_spec,
)
from kai_cad.lifecycle import DesignRecord, DesignState, can_transition
from kai_cad.storage.repository import (
    CorruptedRecordError,
    FileDesignRepository,
    PathSecurityError,
    PersistedDesign,
    ensure_within_workspace,
    validate_design_id,
    validate_output_name,
)
from kai_cad.validators.errors import GeometryValidationError

MAX_TEXT_ARTIFACT_BYTES = 262_144  # 256 KiB cap for inline text artifact retrieval
MIN_EXPORT_TIMEOUT_S = 1
MAX_EXPORT_TIMEOUT_S = 600


def _error_response(tool: str, code: str, message: str, *, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "ok": False,
        "tool": tool,
        "error": {"code": code, "message": message},
        "errors": [{"code": code, "message": message}],
    }
    if extra:
        payload.update(extra)
    return payload


def _file_sha256(path: Path) -> Optional[str]:
    if not path.is_file():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _sanitize_output_stem(raw_name: str, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", raw_name.strip()).strip("_-")
    if not cleaned:
        return fallback
    return cleaned[:64]


def _artifact_summary(path_str: Optional[str]) -> Dict[str, Any]:
    if not path_str:
        return {"path": None, "exists": False, "size_bytes": 0}
    p = Path(path_str)
    if p.is_file():
        return {"path": str(p), "exists": True, "size_bytes": p.stat().st_size}
    return {"path": str(p), "exists": False, "size_bytes": 0}


class KaiCadMcpService:
    """Implements the six Phase 2 MCP tools on top of the existing kai_cad engine."""

    def __init__(
        self,
        workspace_root: Optional[Path | str] = None,
        *,
        openscad_bin: Optional[str] = None,
        stl_runner: Any = subprocess.run,
    ) -> None:
        self.repository = FileDesignRepository(workspace_root=workspace_root)
        self._openscad_bin = openscad_bin
        self._stl_runner = stl_runner

    def cad_generate_design(
        self,
        component_type: str,
        spec: Mapping[str, Any],
        design_id: Optional[str] = None,
        output_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Tool A: Validate spec, generate deterministic .scad, persist design in Generated state."""
        tool = "cad_generate_design"
        if component_type not in SUPPORTED_COMPONENTS:
            return _error_response(
                tool,
                "UNSUPPORTED_COMPONENT",
                f"Unsupported component_type '{component_type}'. Supported: {', '.join(SUPPORTED_COMPONENTS)}.",
            )
        if not isinstance(spec, Mapping):
            return _error_response(tool, "INVALID_SPEC", "'spec' must be a JSON object.")

        try:
            if design_id is not None:
                resolved_id = validate_design_id(design_id)
                if self.repository.load(resolved_id) is not None:
                    return _error_response(
                        tool,
                        "DESIGN_ALREADY_EXISTS",
                        f"Design '{resolved_id}' already exists. Choose a new design_id.",
                    )
            else:
                resolved_id = f"cad-{uuid.uuid4().hex[:12]}"
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_DESIGN_ID", str(exc))
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        try:
            result = generate_component(component_type, spec)
        except GeometryValidationError as exc:
            return {
                "ok": False,
                "tool": tool,
                "error": {"code": "VALIDATION_FAILED", "message": str(exc)},
                "errors": [
                    {"field": i.field, "code": i.code, "message": i.message}
                    for i in exc.issues
                ],
            }

        try:
            if output_name is not None:
                safe_output = validate_output_name(output_name)
            else:
                safe_output = validate_output_name(
                    _sanitize_output_stem(result.spec.name, resolved_id)
                )
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_OUTPUT_NAME", str(exc))

        ddir = self.repository.design_dir(resolved_id)
        scad_path = ensure_within_workspace(ddir / f"{safe_output}.scad", self.repository.workspace_root)
        spec_path = ensure_within_workspace(ddir / "spec.json", self.repository.workspace_root)

        write_scad_file(result.scad_source, scad_path)

        record = DesignRecord(
            design_id=resolved_id,
            component_type=component_type,
            scad_path=str(scad_path),
            spec_sha256=result.spec_sha256,
        )
        record.transition(DesignState.GENERATED, note="OpenSCAD source generated via MCP.")

        now_utc = datetime.now(timezone.utc).isoformat()
        persisted = PersistedDesign(
            record=record,
            output_name=safe_output,
            spec_path=str(spec_path),
            scad_sha256=result.scad_sha256,
            created_at_utc=now_utc,
            updated_at_utc=now_utc,
        )
        self.repository.save(persisted, spec_data=result.spec.to_dict())

        return {
            "ok": True,
            "tool": tool,
            "design_id": resolved_id,
            "component_type": component_type,
            "state": record.state.value,
            "scad_path": str(scad_path),
            "spec_path": str(spec_path),
            "spec_sha256": result.spec_sha256,
            "scad_sha256": result.scad_sha256,
            "created_at_utc": persisted.created_at_utc,
            "updated_at_utc": persisted.updated_at_utc,
        }

    def cad_validate_design(self, design_id: str) -> Dict[str, Any]:
        """Tool B: Re-validate persisted design spec & SCAD presence; advance Generated -> Validated."""
        tool = "cad_validate_design"
        try:
            persisted = self.repository.load(design_id)
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_DESIGN_ID", str(exc))
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        if persisted is None:
            return _error_response(tool, "DESIGN_NOT_FOUND", f"Design '{design_id}' not found.")

        if persisted.record.component_type not in SUPPORTED_COMPONENTS:
            return _error_response(
                tool,
                "UNSUPPORTED_COMPONENT",
                f"Unsupported component_type '{persisted.record.component_type}'.",
            )

        try:
            spec_data = self.repository.load_spec(design_id)
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        try:
            spec = validate_component_spec(persisted.record.component_type, spec_data)
        except GeometryValidationError as exc:
            return {
                "ok": False,
                "tool": tool,
                "design_id": design_id,
                "valid": False,
                "state": persisted.record.state.value,
                "error": {"code": "VALIDATION_FAILED", "message": str(exc)},
                "issues": [
                    {"field": i.field, "code": i.code, "message": i.message}
                    for i in exc.issues
                ],
                "errors": [
                    {"field": i.field, "code": i.code, "message": i.message}
                    for i in exc.issues
                ],
            }

        scad_path = Path(persisted.record.scad_path) if persisted.record.scad_path else None
        if scad_path is None or not scad_path.is_file():
            return _error_response(
                tool,
                "MISSING_SCAD_ARTIFACT",
                f"Generated .scad artifact is missing for design '{design_id}'.",
                extra={"design_id": design_id, "valid": False, "state": persisted.record.state.value},
            )

        transitioned = False
        if can_transition(persisted.record.state, DesignState.VALIDATED):
            persisted.record.transition(
                DesignState.VALIDATED,
                note="Specification and geometry validated via MCP.",
            )
            self.repository.save(persisted)
            transitioned = True

        return {
            "ok": True,
            "tool": tool,
            "design_id": design_id,
            "valid": True,
            "state": persisted.record.state.value,
            "transitioned": transitioned,
            "spec_sha256": spec.spec_sha256(),
            "issues": [],
        }

    def cad_export_stl(
        self,
        design_id: str,
        timeout_seconds: int = 120,
    ) -> Dict[str, Any]:
        """Tool C: Export a validated design to STL via server-configured OpenSCAD CLI."""
        tool = "cad_export_stl"
        if isinstance(timeout_seconds, bool) or not isinstance(timeout_seconds, int) or not (
            MIN_EXPORT_TIMEOUT_S <= timeout_seconds <= MAX_EXPORT_TIMEOUT_S
        ):
            return _error_response(
                tool,
                "INVALID_TIMEOUT",
                f"timeout_seconds must be an integer between {MIN_EXPORT_TIMEOUT_S} and {MAX_EXPORT_TIMEOUT_S}.",
            )

        try:
            persisted = self.repository.load(design_id)
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_DESIGN_ID", str(exc))
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        if persisted is None:
            return _error_response(tool, "DESIGN_NOT_FOUND", f"Design '{design_id}' not found.")

        if not can_transition(persisted.record.state, DesignState.EXPORTED):
            return _error_response(
                tool,
                "INVALID_LIFECYCLE_TRANSITION",
                (
                    f"Design '{design_id}' is in state '{persisted.record.state.value}'; "
                    "must be in 'Validated' state before exporting STL (run cad_validate_design first)."
                ),
                extra={"design_id": design_id, "state": persisted.record.state.value},
            )

        if not persisted.record.scad_path:
            return _error_response(
                tool,
                "MISSING_SCAD_ARTIFACT",
                f"No .scad path recorded for design '{design_id}'.",
                extra={"design_id": design_id, "state": persisted.record.state.value},
            )

        scad_path = ensure_within_workspace(Path(persisted.record.scad_path), self.repository.workspace_root)
        if not scad_path.is_file():
            return _error_response(
                tool,
                "MISSING_SCAD_ARTIFACT",
                f"OpenSCAD source file not found for design '{design_id}'.",
                extra={"design_id": design_id, "state": persisted.record.state.value},
            )

        stl_path = ensure_within_workspace(
            self.repository.design_dir(design_id) / f"{persisted.output_name}.stl",
            self.repository.workspace_root,
        )

        export = export_stl_with_openscad(
            scad_path,
            stl_path,
            openscad_bin=self._openscad_bin,
            timeout_seconds=timeout_seconds,
            runner=self._stl_runner,
        )
        if not export.success or export.stl_path is None or not export.stl_path.is_file() or export.stl_path.stat().st_size == 0:
            code = "OPENSCAD_UNAVAILABLE" if not export.openscad_available else "STL_EXPORT_FAILED"
            return _error_response(
                tool,
                code,
                export.message,
                extra={
                    "design_id": design_id,
                    "state": persisted.record.state.value,
                    "openscad_available": export.openscad_available,
                    "openscad_binary": export.openscad_binary,
                    "returncode": export.returncode,
                    "stderr": export.stderr[:1000] if export.stderr else "",
                },
            )

        stl_size = export.stl_path.stat().st_size
        persisted.record.stl_path = str(export.stl_path)
        persisted.record.transition(
            DesignState.EXPORTED,
            note=f"STL exported via OpenSCAD ({stl_size} bytes).",
        )
        self.repository.save(persisted)

        return {
            "ok": True,
            "tool": tool,
            "design_id": design_id,
            "state": persisted.record.state.value,
            "stl_path": str(export.stl_path),
            "stl_size_bytes": stl_size,
            "openscad_available": export.openscad_available,
            "openscad_binary": export.openscad_binary,
            "message": export.message,
        }

    def cad_get_design(self, design_id: str) -> Dict[str, Any]:
        """Tool D: Retrieve full metadata, audit history, and artifact availability for one design."""
        tool = "cad_get_design"
        try:
            persisted = self.repository.load(design_id)
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_DESIGN_ID", str(exc))
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        if persisted is None:
            return _error_response(tool, "DESIGN_NOT_FOUND", f"Design '{design_id}' not found.")

        rec = persisted.record
        return {
            "ok": True,
            "tool": tool,
            "design_id": rec.design_id,
            "component_type": rec.component_type,
            "state": rec.state.value,
            "spec_sha256": rec.spec_sha256,
            "scad_sha256": persisted.scad_sha256,
            "spec_path": persisted.spec_path,
            "scad_path": rec.scad_path,
            "stl_path": rec.stl_path,
            "created_at_utc": persisted.created_at_utc,
            "updated_at_utc": persisted.updated_at_utc,
            "history": [asdict(ev) for ev in rec.history],
            "artifacts": {
                "spec_json": _artifact_summary(persisted.spec_path),
                "scad": _artifact_summary(rec.scad_path),
                "stl": _artifact_summary(rec.stl_path),
            },
        }

    def cad_list_designs(
        self,
        component_type: Optional[str] = None,
        state: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Tool E: List persisted designs with optional component_type, state, and limit filters."""
        tool = "cad_list_designs"
        if isinstance(limit, bool) or not isinstance(limit, int) or not (1 <= limit <= 500):
            return _error_response(tool, "INVALID_LIMIT", "limit must be an integer between 1 and 500.")

        state_enum: Optional[DesignState] = None
        if state is not None:
            try:
                state_enum = DesignState(state)
            except ValueError:
                valid_states = ", ".join(s.value for s in DesignState)
                return _error_response(
                    tool,
                    "INVALID_STATE_FILTER",
                    f"Invalid state filter '{state}'. Valid states: {valid_states}.",
                )

        items = self.repository.list_designs(
            component_type=component_type,
            state=state_enum,
            limit=limit,
        )
        designs: List[Dict[str, Any]] = []
        for item in items:
            rec = item.record
            designs.append(
                {
                    "design_id": rec.design_id,
                    "component_type": rec.component_type,
                    "state": rec.state.value,
                    "spec_sha256": rec.spec_sha256,
                    "created_at_utc": item.created_at_utc,
                    "updated_at_utc": item.updated_at_utc,
                    "artifacts": {
                        "spec_json": Path(item.spec_path).is_file(),
                        "scad": bool(rec.scad_path and Path(rec.scad_path).is_file()),
                        "stl": bool(rec.stl_path and Path(rec.stl_path).is_file()),
                    },
                }
            )

        return {
            "ok": True,
            "tool": tool,
            "count": len(designs),
            "designs": designs,
        }

    def cad_get_design_artifact(
        self,
        design_id: str,
        artifact_type: str,
        include_content: bool = False,
    ) -> Dict[str, Any]:
        """Tool F: Retrieve artifact metadata and optional bounded text content (never binary STL text)."""
        tool = "cad_get_design_artifact"
        if artifact_type not in ("spec_json", "scad", "stl"):
            return _error_response(
                tool,
                "INVALID_ARTIFACT_TYPE",
                "artifact_type must be one of 'spec_json', 'scad', or 'stl'.",
            )

        try:
            persisted = self.repository.load(design_id)
        except PathSecurityError as exc:
            return _error_response(tool, "INVALID_DESIGN_ID", str(exc))
        except CorruptedRecordError as exc:
            return _error_response(tool, "CORRUPTED_RECORD", str(exc))

        if persisted is None:
            return _error_response(tool, "DESIGN_NOT_FOUND", f"Design '{design_id}' not found.")

        raw_path: Optional[str]
        mime_type: str
        if artifact_type == "spec_json":
            raw_path = persisted.spec_path
            mime_type = "application/json"
        elif artifact_type == "scad":
            raw_path = persisted.record.scad_path
            mime_type = "text/plain"
        else:
            raw_path = persisted.record.stl_path
            mime_type = "model/stl"

        if not raw_path:
            return _error_response(
                tool,
                "ARTIFACT_NOT_AVAILABLE",
                f"Artifact '{artifact_type}' has not been generated for design '{design_id}'.",
                extra={"design_id": design_id, "artifact_type": artifact_type},
            )

        try:
            artifact_path = ensure_within_workspace(Path(raw_path), self.repository.workspace_root)
        except PathSecurityError as exc:
            return _error_response(tool, "PATH_SECURITY_ERROR", str(exc))

        if not artifact_path.is_file():
            return _error_response(
                tool,
                "ARTIFACT_NOT_FOUND",
                f"Artifact file for '{artifact_type}' is missing on disk.",
                extra={"design_id": design_id, "artifact_type": artifact_type},
            )

        size_bytes = artifact_path.stat().st_size
        metadata: Dict[str, Any] = {
            "ok": True,
            "tool": tool,
            "design_id": design_id,
            "artifact_type": artifact_type,
            "path": str(artifact_path),
            "exists": True,
            "size_bytes": size_bytes,
            "sha256": _file_sha256(artifact_path),
            "mime_type": mime_type,
            "content_included": False,
        }

        if include_content:
            if artifact_type == "stl":
                return _error_response(
                    tool,
                    "BINARY_ARTIFACT_CONTENT_NOT_SUPPORTED",
                    "STL binary content cannot be returned as inline text. Use the local 'path' instead.",
                    extra={
                        "design_id": design_id,
                        "artifact_type": artifact_type,
                        "path": str(artifact_path),
                        "size_bytes": size_bytes,
                        "sha256": metadata["sha256"],
                        "mime_type": mime_type,
                    },
                )
            if size_bytes > MAX_TEXT_ARTIFACT_BYTES:
                return _error_response(
                    tool,
                    "ARTIFACT_TOO_LARGE",
                    f"Artifact exceeds inline content limit ({size_bytes} > {MAX_TEXT_ARTIFACT_BYTES} bytes).",
                    extra={
                        "design_id": design_id,
                        "artifact_type": artifact_type,
                        "path": str(artifact_path),
                        "size_bytes": size_bytes,
                    },
                )
            metadata["content"] = artifact_path.read_text(encoding="utf-8")
            metadata["content_included"] = True

        return metadata
