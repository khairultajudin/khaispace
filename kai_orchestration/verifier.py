"""Independent verification engine for Antigravity deliverables."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Sequence

from .brief_generator import SECRET_PATTERNS
from .lifecycle import Phase3State


@dataclass
class VerificationResult:
    passed: bool
    next_state: Phase3State
    changed_files: List[str] = field(default_factory=list)
    test_returncode: Optional[int] = None
    test_output: str = ""
    issues: List[str] = field(default_factory=list)


def verify_workspace_changes(
    repo_dir: Path,
    *,
    expected_files: Sequence[str] = (),
    test_cmd: Optional[Sequence[str]] = None,
) -> VerificationResult:
    """Inspect git status, expected deliverables, secret hygiene, and run tests."""
    repo = Path(repo_dir)
    issues: List[str] = []

    git_proc = subprocess.run(
        ["git", "-C", str(repo), "status", "--short"],
        capture_output=True,
        text=True,
    )
    changed_files = [line[3:].strip() for line in git_proc.stdout.splitlines() if line.strip()]

    for rel in expected_files:
        target = repo / rel
        if not target.exists():
            issues.append(f"Missing expected deliverable: {rel}")
        elif target.is_file():
            content = target.read_text(encoding="utf-8", errors="ignore")
            for pat in SECRET_PATTERNS:
                if pat.search(content):
                    issues.append(f"Potential secret pattern in {rel}: {pat.pattern}")

    test_rc: Optional[int] = None
    test_out = ""
    if test_cmd:
        t_proc = subprocess.run(list(test_cmd), cwd=str(repo), capture_output=True, text=True)
        test_rc = t_proc.returncode
        test_out = (t_proc.stdout + "\n" + t_proc.stderr).strip()[:2000]
        if test_rc != 0:
            issues.append(f"Verification test command exited with code {test_rc}")

    passed = len(issues) == 0
    return VerificationResult(
        passed=passed,
        next_state=Phase3State.VERIFIED if passed else Phase3State.REVISION_REQUIRED,
        changed_files=changed_files,
        test_returncode=test_rc,
        test_output=test_out,
        issues=issues,
    )
