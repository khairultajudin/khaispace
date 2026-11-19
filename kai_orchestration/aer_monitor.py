"""AER heartbeat/poll monitoring for long-running Antigravity relay tasks.

Runs `agy` in the background and polls with periodic heartbeats so KAI can
monitor progress without Khai needing to be at the PC.
"""

from __future__ import annotations

import json
import subprocess
import time
from typing import Any, Dict, List, Optional

from .agy_bridge import detect_auth_failure, resolve_agy_binary, resolve_workspace_paths


def monitor_relay(
    task: str,
    workspace_dir: str,
    *,
    conversation_id: Optional[str] = None,
    timeout_seconds: int = 300,
    heartbeat_seconds: int = 15,
    heartbeat=None,
) -> Dict[str, Any]:
    """Dispatch a relay task in the background and poll until completion.

    `heartbeat` is an optional callback(elapsed_seconds) invoked every heartbeat interval.
    Returns {"status", "conversation_id", "response", "error"}.
    """
    agy_bin = resolve_agy_binary()
    if not agy_bin:
        return {"status": "ERROR", "conversation_id": conversation_id, "response": "", "error": "Antigravity CLI (agy) binary not found."}

    cwd, win_dir = resolve_workspace_paths(workspace_dir)

    prompt = (
        f"Task: {task}\n\n"
        f"Workspace: {win_dir}\n"
        "Execute the task fully and autonomously (accept-edits). You may create/modify files, "
        "run commands, and use git within the workspace as needed. "
        "Report concisely: what you did, what you tested, and the final result."
    )

    cmd: List[str] = [
        agy_bin,
        "--output-format", "json",
        "--mode", "accept-edits",
        "--dangerously-skip-permissions",
        "--print-timeout", f"{timeout_seconds}s",
        "--add-dir", win_dir,
    ]
    if conversation_id:
        cmd.extend(["--conversation", conversation_id])
    cmd.append(f"-p={prompt}")

    proc = subprocess.Popen(
        cmd, cwd=cwd, stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )

    t0 = time.time()
    while proc.poll() is None:
        elapsed = time.time() - t0
        if heartbeat:
            heartbeat(int(elapsed))
        if elapsed > timeout_seconds + 30:
            proc.kill()
            return {"status": "TIMEOUT", "conversation_id": conversation_id, "response": "", "error": "timed out"}
        time.sleep(heartbeat_seconds)

    out, err = proc.communicate()
    combined = f"{err or ''}\n{out or ''}"
    auth_err = detect_auth_failure(combined)
    if auth_err:
        return {"status": "AUTH_FAILED", "conversation_id": conversation_id, "response": "", "error": auth_err}

    if proc.returncode != 0:
        return {"status": f"EXIT_{proc.returncode}", "conversation_id": conversation_id, "response": "", "error": (err or out)[:1000]}

    try:
        data = json.loads(out.strip())
        return {
            "status": data.get("status", "SUCCESS"),
            "conversation_id": data.get("conversation_id") or conversation_id,
            "response": data.get("response", ""),
            "error": None,
        }
    except json.JSONDecodeError:
        return {"status": "SUCCESS", "conversation_id": conversation_id, "response": out.strip(), "error": None}
