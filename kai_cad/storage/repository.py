"""Isolated, workspace-scoped local file repository for KAI CAD Studio designs.

Workspace layout:
    <workspace_root>/
      designs/
        <design_id>/
          record.json
          spec.json
          <output_name>.scad
          <output_name>.stl   (when exported)
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Protocol

from kai_cad.lifecycle import DesignRecord, DesignState
from kai_cad.validators.errors import KaiCadError

logger = logging.getLogger(__name__)

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")
DEFAULT_WORKSPACE_ENV = "KAI_CAD_WORKSPACE"


class PathSecurityError(KaiCadError, ValueError):
    """Raised when an identifier or path attempts to escape the configured CAD workspace."""


class CorruptedRecordError(KaiCadError, ValueError):
    """Raised when a persisted design record or specification JSON is unreadable or invalid."""


def validate_design_id(design_id: str) -> str:
    """Validate that *design_id* is safe for use as a single workspace directory name."""
    if not isinstance(design_id, str) or not _SAFE_ID_RE.match(design_id):
        raise PathSecurityError(
            "Invalid design_id: must match ^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$ "
            "(no path separators, dots, or spaces)."
        )
    return design_id


def validate_output_name(output_name: str) -> str:
    """Validate that *output_name* is a safe base filename without extension or path traversal."""
    if not isinstance(output_name, str) or not _SAFE_ID_RE.match(output_name):
        raise PathSecurityError(
            "Invalid output_name: must match ^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$ "
            "(no path separators, dots, or spaces)."
        )
    return output_name


def ensure_within_workspace(path: Path, workspace_root: Path) -> Path:
    """Resolve *path* and guarantee it lies strictly within *workspace_root*."""
    root_resolved = workspace_root.resolve()
    target_resolved = path.resolve()
    try:
        target_resolved.relative_to(root_resolved)
    except ValueError as exc:
        raise PathSecurityError(
            f"Access denied: path '{path}' escapes configured CAD workspace."
        ) from exc
    return target_resolved


def resolve_workspace_root(workspace_root: Optional[Path | str] = None) -> Path:
    """Resolve the CAD workspace directory from explicit arg, KAI_CAD_WORKSPACE env, or default."""
    if workspace_root is not None:
        return Path(workspace_root).expanduser().resolve()
    env_dir = os.environ.get(DEFAULT_WORKSPACE_ENV, "").strip()
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    return (Path.cwd() / ".kai_cad_workspace").resolve()


@dataclass
class PersistedDesign:
    """Full persisted representation of a CAD design inside the workspace."""

    record: DesignRecord
    output_name: str
    spec_path: str
    scad_sha256: Optional[str]
    created_at_utc: str
    updated_at_utc: str


class DesignRepository(Protocol):
    """Storage abstraction for persisting and querying KAI CAD designs."""

    @property
    def workspace_root(self) -> Path: ...

    def design_dir(self, design_id: str) -> Path: ...

    def save(self, persisted: PersistedDesign, spec_data: Optional[Mapping[str, Any]] = None) -> PersistedDesign: ...

    def load(self, design_id: str) -> Optional[PersistedDesign]: ...

    def load_spec(self, design_id: str) -> Dict[str, Any]: ...

    def list_designs(
        self,
        *,
        component_type: Optional[str] = None,
        state: Optional[DesignState] = None,
        limit: int = 50,
    ) -> List[PersistedDesign]: ...


def _atomic_write_json(target: Path, payload: Mapping[str, Any]) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = target.with_suffix(target.suffix + ".tmp")
    content = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    with tmp_path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)
    os.replace(tmp_path, target)


class FileDesignRepository:
    """Workspace-scoped JSON file repository surviving MCP server restarts."""

    def __init__(self, workspace_root: Optional[Path | str] = None) -> None:
        self._workspace_root = resolve_workspace_root(workspace_root)
        self._designs_root = self._workspace_root / "designs"
        self._designs_root.mkdir(parents=True, exist_ok=True)

    @property
    def workspace_root(self) -> Path:
        return self._workspace_root

    def design_dir(self, design_id: str) -> Path:
        safe_id = validate_design_id(design_id)
        candidate = self._designs_root / safe_id
        return ensure_within_workspace(candidate, self._workspace_root)

    def _record_file(self, design_id: str) -> Path:
        return ensure_within_workspace(self.design_dir(design_id) / "record.json", self._workspace_root)

    def _spec_file(self, design_id: str) -> Path:
        return ensure_within_workspace(self.design_dir(design_id) / "spec.json", self._workspace_root)

    def save(self, persisted: PersistedDesign, spec_data: Optional[Mapping[str, Any]] = None) -> PersistedDesign:
        design_id = validate_design_id(persisted.record.design_id)
        validate_output_name(persisted.output_name)
        ddir = self.design_dir(design_id)
        ddir.mkdir(parents=True, exist_ok=True)

        # Ensure any artifact paths stored in record remain within workspace.
        if persisted.record.scad_path:
            ensure_within_workspace(Path(persisted.record.scad_path), self._workspace_root)
        if persisted.record.stl_path:
            ensure_within_workspace(Path(persisted.record.stl_path), self._workspace_root)
        ensure_within_workspace(Path(persisted.spec_path), self._workspace_root)

        now_utc = datetime.now(timezone.utc).isoformat()
        persisted.updated_at_utc = now_utc

        if spec_data is not None:
            _atomic_write_json(self._spec_file(design_id), spec_data)

        envelope: Dict[str, Any] = {
            "schema_version": 1,
            "record": persisted.record.to_dict(),
            "output_name": persisted.output_name,
            "spec_path": persisted.spec_path,
            "scad_sha256": persisted.scad_sha256,
            "created_at_utc": persisted.created_at_utc,
            "updated_at_utc": persisted.updated_at_utc,
        }
        _atomic_write_json(self._record_file(design_id), envelope)
        return persisted

    def load(self, design_id: str) -> Optional[PersistedDesign]:
        safe_id = validate_design_id(design_id)
        rec_path = self._record_file(safe_id)
        if not rec_path.exists():
            return None
        try:
            raw = json.loads(rec_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CorruptedRecordError(f"Corrupted design record for '{safe_id}': {exc}") from exc

        if not isinstance(raw, Mapping) or not isinstance(raw.get("record"), Mapping):
            raise CorruptedRecordError(f"Corrupted design record structure for '{safe_id}'.")

        try:
            record = DesignRecord.from_persisted(raw["record"])
            output_name = validate_output_name(str(raw.get("output_name", "")))
            spec_path = str(raw.get("spec_path", ""))
            if not spec_path:
                raise ValueError("Missing 'spec_path'.")
            ensure_within_workspace(Path(spec_path), self._workspace_root)
            if record.scad_path:
                ensure_within_workspace(Path(record.scad_path), self._workspace_root)
            if record.stl_path:
                ensure_within_workspace(Path(record.stl_path), self._workspace_root)
            created_at = str(raw.get("created_at_utc", ""))
            updated_at = str(raw.get("updated_at_utc", ""))
            datetime.fromisoformat(created_at)
            datetime.fromisoformat(updated_at)
        except Exception as exc:
            raise CorruptedRecordError(f"Invalid persisted metadata for '{safe_id}': {exc}") from exc

        return PersistedDesign(
            record=record,
            output_name=output_name,
            spec_path=spec_path,
            scad_sha256=raw.get("scad_sha256") if isinstance(raw.get("scad_sha256"), str) else None,
            created_at_utc=created_at,
            updated_at_utc=updated_at,
        )

    def load_spec(self, design_id: str) -> Dict[str, Any]:
        safe_id = validate_design_id(design_id)
        spec_path = self._spec_file(safe_id)
        if not spec_path.is_file():
            raise CorruptedRecordError(f"Specification file missing for design '{safe_id}'.")
        try:
            data = json.loads(spec_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CorruptedRecordError(f"Corrupted specification JSON for '{safe_id}': {exc}") from exc
        if not isinstance(data, dict):
            raise CorruptedRecordError(f"Specification JSON for '{safe_id}' must be a JSON object.")
        return data

    def list_designs(
        self,
        *,
        component_type: Optional[str] = None,
        state: Optional[DesignState] = None,
        limit: int = 50,
    ) -> List[PersistedDesign]:
        results: List[PersistedDesign] = []
        if not self._designs_root.is_dir():
            return results

        for entry in sorted(self._designs_root.iterdir()):
            if not entry.is_dir():
                continue
            try:
                persisted = self.load(entry.name)
            except (CorruptedRecordError, PathSecurityError) as exc:
                logger.warning("Skipping unreadable design directory '%s': %s", entry.name, exc)
                continue
            if persisted is None:
                continue
            if component_type is not None and persisted.record.component_type != component_type:
                continue
            if state is not None and persisted.record.state != state:
                continue
            results.append(persisted)

        results.sort(key=lambda item: item.updated_at_utc, reverse=True)
        return results[:limit]
