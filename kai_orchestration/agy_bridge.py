"""Antigravity CLI (agy) bridge with persistent handoff queue, idempotency, and recovery."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .approval import evaluate_action_risk
from .brief_generator import EngineeringBrief, generate_brief_markdown
from .lifecycle import Phase3State, can_transition

WSL_AGY_PATH = "/mnt/c/Users/user/AppData/Local/agy/bin/agy.exe"
DEFAULT_HANDOFF_DIR = Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes")) / "handoffs"

_WSL_MNT_RE = re.compile(r"^/mnt/([a-zA-Z])(?:/(.*))?$")
_WIN_DRIVE_RE = re.compile(r"^([a-zA-Z]):[\\/](.*)$")
_AUTH_FAILURE_MARKERS = (
    "authentication required",
    "silent auth failed",
    "oauth2/auth",
    "authentication failed or timed out",
    "not authenticated, trying silent auth",
    "paste the authorization code",
)


def _detect_wsl() -> bool:
    """Return True when executing inside WSL2 on Linux."""
    if os.name != "posix":
        return False
    try:
        return "microsoft" in Path("/proc/version").read_text(encoding="utf-8", errors="ignore").lower()
    except OSError:
        return False


def detect_auth_failure(output: str) -> Optional[str]:
    """Detect Antigravity CLI authentication failures and return a redacted owner-facing notice."""
    lower = (output or "").lower()
    if any(marker in lower for marker in _AUTH_FAILURE_MARKERS):
        return (
            "Antigravity CLI authentication failed (silent auth unavailable or OAuth required). "
            "Verify Windows Credential Manager login via interactive `agy` on Windows and ensure "
            "a Windows-mounted workspace path (/mnt/<drive>/... or <D>:\\...) is used."
        )
    return None


def resolve_workspace_paths(workspace_dir: str, *, is_wsl: Optional[bool] = None) -> Tuple[str, str]:
    """Resolve (subprocess_cwd, windows_add_dir) for Win32 agy.exe execution.

    On WSL2, rejects Linux ext4 paths (e.g. /home/user/.hermes) because WSL2 maps them
    to UNC \\\\wsl.localhost\\... paths that break agy.exe silent authentication.
    """
    raw = (workspace_dir or "").strip()
    if not raw:
        raise ValueError("workspace_dir must be non-empty.")

    wsl_mode = _detect_wsl() if is_wsl is None else is_wsl

    mnt_match = _WSL_MNT_RE.match(raw)
    win_match = _WIN_DRIVE_RE.match(raw)

    if wsl_mode:
        if mnt_match:
            drive = mnt_match.group(1).upper()
            rest = (mnt_match.group(2) or "").rstrip("/")
            win_path = f"{drive}:\\" + rest.replace("/", "\\") if rest else f"{drive}:\\"
            wsl_cwd = f"/mnt/{drive.lower()}/{rest}" if rest else f"/mnt/{drive.lower()}"
            return wsl_cwd, win_path
        if win_match:
            drive = win_match.group(1).upper()
            rest = win_match.group(2).replace("\\", "/").strip("/")
            win_path = f"{drive}:\\" + rest.replace("/", "\\") if rest else f"{drive}:\\"
            wsl_cwd = f"/mnt/{drive.lower()}/{rest}" if rest else f"/mnt/{drive.lower()}"
            return wsl_cwd, win_path
        raise ValueError(
            f"Unsupported Linux ext4 workspace CWD for Win32 agy.exe: '{raw}'. "
            "Use a Windows-mounted drive path (/mnt/<drive>/... or <D>:\\...)."
        )

    # Native Windows execution
    if mnt_match:
        drive = mnt_match.group(1).upper()
        rest = (mnt_match.group(2) or "").rstrip("/")
        win_path = f"{drive}:\\" + rest.replace("/", "\\") if rest else f"{drive}:\\"
        return win_path, win_path
    if win_match:
        drive = win_match.group(1).upper()
        rest = win_match.group(2).replace("/", "\\").rstrip("\\")
        win_path = f"{drive}:\\{rest}" if rest else f"{drive}:\\"
        return win_path, win_path
    return raw, raw


def resolve_agy_binary() -> Optional[str]:
    """Locate the Antigravity CLI binary across WSL2 interop or native Windows."""
    if os.path.exists(WSL_AGY_PATH) and os.access(WSL_AGY_PATH, os.X_OK):
        return WSL_AGY_PATH
    return shutil.which("agy") or shutil.which("agy.exe")


@dataclass
class HandoffRecord:
    brief_id: str
    idempotency_key: str
    state: str
    mode: str
    workspace_dir: str
    conversation_id: Optional[str] = None
    attempts: int = 0
    max_attempts: int = 2
    last_status: Optional[str] = None
    last_response: Optional[str] = None
    last_error: Optional[str] = None
    updated_at: str = ""


class AgyBridge:
    """Manages idempotent dispatch, persistence, and recovery for Antigravity jobs."""

    def __init__(
        self,
        handoff_dir: Optional[Path] = None,
        agy_bin: Optional[str] = None,
        *,
        is_wsl: Optional[bool] = None,
    ) -> None:
        self.handoff_dir = Path(handoff_dir) if handoff_dir else DEFAULT_HANDOFF_DIR
        self.handoff_dir.mkdir(parents=True, exist_ok=True)
        self.agy_bin = agy_bin or resolve_agy_binary()
        self._is_wsl = _detect_wsl() if is_wsl is None else is_wsl

    def _record_path(self, brief_id: str) -> Path:
        safe_id = "".join(c for c in brief_id if c.isalnum() or c in ("-", "_"))
        return self.handoff_dir / f"{safe_id}.json"

    def _brief_path(self, brief_id: str) -> Path:
        safe_id = "".join(c for c in brief_id if c.isalnum() or c in ("-", "_"))
        return self.handoff_dir / f"{safe_id}.md"

    def load_record(self, brief_id: str) -> Optional[HandoffRecord]:
        p = self._record_path(brief_id)
        if not p.exists():
            return None
        return HandoffRecord(**json.loads(p.read_text(encoding="utf-8")))

    def save_record(self, rec: HandoffRecord) -> HandoffRecord:
        rec.updated_at = datetime.now(timezone.utc).isoformat()
        self._record_path(rec.brief_id).write_text(
            json.dumps(asdict(rec), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        return rec

    def prepare_handoff(
        self,
        brief: EngineeringBrief,
        *,
        idempotency_key: str,
        workspace_dir: str,
        mode: str = "plan",
        owner_approved: bool = False,
    ) -> HandoffRecord:
        """Validate brief, check Level 3 approval, and persist handoff idempotently."""
        if mode not in ("plan", "accept-edits"):
            raise ValueError(f"Unsupported agy mode: {mode}")

        existing = self.load_record(brief.brief_id)
        if existing and existing.idempotency_key == idempotency_key:
            return existing

        brief_md = generate_brief_markdown(brief)
        self._brief_path(brief.brief_id).write_text(brief_md, encoding="utf-8")

        decision = evaluate_action_risk(brief.action_tags, owner_approved=owner_approved)
        initial_state = Phase3State.READY_FOR_HANDOFF if decision.allowed else Phase3State.AWAITING_APPROVAL
        rec = HandoffRecord(
            brief_id=brief.brief_id,
            idempotency_key=idempotency_key,
            state=initial_state.value,
            mode=mode,
            workspace_dir=workspace_dir,
            last_error=None if decision.allowed else decision.reason,
        )
        return self.save_record(rec)

    def dispatch(
        self,
        brief_id: str,
        *,
        timeout_seconds: int = 120,
        sandbox: bool = True,
        skip_permissions: bool = False,
        runner: Any = subprocess.run,
    ) -> HandoffRecord:
        """Dispatch a prepared handoff to Antigravity CLI (`agy -p=... --output-format json`)."""
        rec = self.load_record(brief_id)
        if rec is None:
            raise FileNotFoundError(f"Handoff record not found: {brief_id}")

        current = Phase3State(rec.state)
        if current == Phase3State.AWAITING_APPROVAL:
            return rec
        if current in (Phase3State.VERIFIED, Phase3State.COMPLETED):
            return rec
        if rec.attempts >= rec.max_attempts:
            rec.state = Phase3State.BLOCKED.value
            rec.last_error = f"Max attempts ({rec.max_attempts}) reached; manual review required."
            return self.save_record(rec)
        if not self.agy_bin:
            rec.state = Phase3State.BLOCKED.value
            rec.last_error = "Antigravity CLI (agy) binary not found."
            return self.save_record(rec)
        if not can_transition(current, Phase3State.DISPATCHED):
            raise ValueError(f"Cannot dispatch from state {current.value}")

        try:
            subprocess_cwd, win_add_dir = resolve_workspace_paths(rec.workspace_dir, is_wsl=self._is_wsl)
        except ValueError as exc:
            rec.state = Phase3State.BLOCKED.value
            rec.last_status = "INVALID_WORKSPACE_CWD"
            rec.last_error = str(exc)
            return self.save_record(rec)

        brief_md = self._brief_path(brief_id).read_text(encoding="utf-8")
        prompt = (
            f"Execute the following KAI Engineering Brief in {rec.mode} mode.\n"
            "Report exact changed files, test commands run, and verification evidence.\n\n"
            f"{brief_md}"
        )

        cmd: List[str] = [
            self.agy_bin,
            "--output-format", "json",
            "--mode", rec.mode,
            "--print-timeout", f"{timeout_seconds}s",
            "--add-dir", win_add_dir,
        ]
        if sandbox:
            cmd.append("--sandbox")
        if skip_permissions:
            cmd.append("--dangerously-skip-permissions")
        if rec.conversation_id:
            cmd.extend(["--conversation", rec.conversation_id])
        cmd.append(f"-p={prompt}")

        rec.state = Phase3State.DISPATCHED.value
        rec.attempts += 1
        self.save_record(rec)

        try:
            proc = runner(
                cmd,
                cwd=subprocess_cwd,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=timeout_seconds + 15,
            )
        except Exception as exc:
            rec.state = Phase3State.BLOCKED.value
            rec.last_error = f"Dispatch exception: {type(exc).__name__}: {exc}"
            return self.save_record(rec)

        combined_output = f"{proc.stderr or ''}\n{proc.stdout or ''}"
        auth_err = detect_auth_failure(combined_output)
        if auth_err:
            rec.state = Phase3State.BLOCKED.value
            rec.last_status = "AUTH_FAILED"
            rec.last_error = auth_err
            rec.attempts = rec.max_attempts  # Fast-fail: prevent repeated OAuth timeouts
            return self.save_record(rec)

        if proc.returncode != 0:
            rec.state = Phase3State.BLOCKED.value
            rec.last_status = f"EXIT_{proc.returncode}"
            rec.last_error = (proc.stderr or proc.stdout or "").strip()[:1000]
            return self.save_record(rec)

        try:
            data: Dict[str, Any] = json.loads(proc.stdout.strip())
            rec.conversation_id = data.get("conversation_id") or rec.conversation_id
            rec.last_status = data.get("status", "SUCCESS")
            rec.last_response = data.get("response", "")
            rec.last_error = None
            rec.state = Phase3State.REVIEW_REQUIRED.value
        except json.JSONDecodeError:
            rec.state = Phase3State.BLOCKED.value
            rec.last_status = "INVALID_JSON"
            rec.last_error = (proc.stdout or "")[:500]

        return self.save_record(rec)

    def relay_dispatch(
        self,
        task: str,
        workspace_dir: str,
        *,
        conversation_id: Optional[str] = None,
        timeout_seconds: int = 300,
        runner: Any = subprocess.run,
    ) -> Dict[str, Any]:
        """Lightweight AER relay: send a plain task to Antigravity in accept-edits auto-approve mode.

        Uses a minimal prompt (no full EngineeringBrief) to keep Hermes token usage low.
        Returns {"status", "conversation_id", "response", "error"}.
        """
        if not self.agy_bin:
            return {"status": "ERROR", "conversation_id": conversation_id, "response": "", "error": "Antigravity CLI (agy) binary not found."}

        try:
            subprocess_cwd, win_add_dir = resolve_workspace_paths(workspace_dir, is_wsl=self._is_wsl)
        except ValueError as exc:
            return {"status": "INVALID_WORKSPACE_CWD", "conversation_id": conversation_id, "response": "", "error": str(exc)}

        prompt = (
            f"Task: {task}\n\n"
            f"Workspace: {win_add_dir}\n"
            "Execute the task fully and autonomously (accept-edits). You may create/modify files, "
            "run commands, and use git within the workspace as needed. "
            "Report concisely: what you did, what you tested, and the final result."
        )

        cmd: List[str] = [
            self.agy_bin,
            "--output-format", "json",
            "--mode", "accept-edits",
            "--dangerously-skip-permissions",
            "--print-timeout", f"{timeout_seconds}s",
            "--add-dir", win_add_dir,
        ]
        if conversation_id:
            cmd.extend(["--conversation", conversation_id])
        cmd.append(f"-p={prompt}")

        try:
            proc = runner(
                cmd,
                cwd=subprocess_cwd,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=timeout_seconds + 15,
            )
        except Exception as exc:
            return {"status": "ERROR", "conversation_id": conversation_id, "response": "", "error": f"{type(exc).__name__}: {exc}"}

        combined_output = f"{proc.stderr or ''}\n{proc.stdout or ''}"
        auth_err = detect_auth_failure(combined_output)
        if auth_err:
            return {"status": "AUTH_FAILED", "conversation_id": conversation_id, "response": "", "error": auth_err}

        if proc.returncode != 0:
            return {
                "status": f"EXIT_{proc.returncode}",
                "conversation_id": conversation_id,
                "response": "",
                "error": (proc.stderr or proc.stdout or "").strip()[:1000],
            }

        try:
            data = json.loads(proc.stdout.strip())
            return {
                "status": data.get("status", "SUCCESS"),
                "conversation_id": data.get("conversation_id") or conversation_id,
                "response": data.get("response", ""),
                "error": None,
            }
        except json.JSONDecodeError:
            # Some resumed turns return plain text instead of JSON; surface as success with raw output.
            return {
                "status": "SUCCESS",
                "conversation_id": conversation_id,
                "response": (proc.stdout or "").strip(),
                "error": None,
            }
