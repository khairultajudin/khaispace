"""OpenSCAD source writer and optional OpenSCAD CLI STL exporter."""

from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional

_WINDOWS_OPENSCAD_CANDIDATES = (
    Path(r"C:\Program Files\OpenSCAD\openscad.com"),
    Path(r"C:\Program Files\OpenSCAD\openscad.exe"),
    Path(r"C:\Program Files (x86)\OpenSCAD\openscad.com"),
    Path(r"C:\Program Files (x86)\OpenSCAD\openscad.exe"),
)

_MACOS_OPENSCAD_CANDIDATES = (
    Path("/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"),
)


def resolve_openscad_binary(explicit_bin: Optional[str] = None) -> Optional[str]:
    """Locate the OpenSCAD CLI executable, returning None if unavailable.

    Resolution order:
      1. Explicit `explicit_bin` argument (if provided and exists/executable)
      2. `OPENSCAD_BIN` environment variable
      3. `PATH` lookup (`openscad`, `openscad.exe`, `openscad.com`)
      4. Standard OS install locations (Windows Program Files, macOS Applications)
    """
    if explicit_bin is not None:
        candidate = explicit_bin.strip()
        if not candidate:
            return None
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
        p = Path(candidate)
        if p.is_file():
            return str(p)
        return None

    env_bin = os.environ.get("OPENSCAD_BIN", "").strip()
    if env_bin:
        resolved = shutil.which(env_bin)
        if resolved:
            return resolved
        if Path(env_bin).is_file():
            return env_bin

    for name in ("openscad", "openscad.exe", "openscad.com"):
        found = shutil.which(name)
        if found:
            return found

    if os.name == "nt":
        for path in _WINDOWS_OPENSCAD_CANDIDATES:
            if path.is_file():
                return str(path)
    else:
        for path in _MACOS_OPENSCAD_CANDIDATES:
            if path.is_file() and os.access(path, os.X_OK):
                return str(path)

    return None


def write_scad_file(scad_source: str, output_path: Path | str) -> Path:
    """Write OpenSCAD source deterministically (UTF-8, LF line endings)."""
    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(scad_source)
    return target


@dataclass(frozen=True)
class StlExportResult:
    """Outcome of an STL export attempt via OpenSCAD CLI."""

    success: bool
    stl_path: Optional[Path]
    openscad_available: bool
    openscad_binary: Optional[str]
    message: str
    stdout: str = ""
    stderr: str = ""
    returncode: Optional[int] = None


def export_stl_with_openscad(
    scad_path: Path | str,
    stl_path: Path | str,
    *,
    openscad_bin: Optional[str] = None,
    timeout_seconds: int = 120,
    runner: Any = subprocess.run,
) -> StlExportResult:
    """Export an STL mesh from *scad_path* using the local OpenSCAD CLI.

    If OpenSCAD CLI is unavailable, returns `StlExportResult(success=False, openscad_available=False, ...)`
    with a clear dependency notice and never creates a fake or empty STL file.
    """
    src = Path(scad_path)
    dst = Path(stl_path)

    if not src.is_file():
        return StlExportResult(
            success=False,
            stl_path=None,
            openscad_available=False,
            openscad_binary=None,
            message=f"OpenSCAD source file not found: '{src}'.",
        )

    binary = resolve_openscad_binary(openscad_bin)
    if not binary:
        return StlExportResult(
            success=False,
            stl_path=None,
            openscad_available=False,
            openscad_binary=None,
            message=(
                "STL export skipped: OpenSCAD CLI is not installed or not found on PATH "
                "(set OPENSCAD_BIN or install OpenSCAD from https://openscad.org/). "
                "No STL file was generated."
            ),
        )

    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd: List[str] = [binary, "-o", str(dst), str(src)]

    try:
        proc = runner(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            stdin=subprocess.DEVNULL,
        )
    except Exception as exc:
        return StlExportResult(
            success=False,
            stl_path=None,
            openscad_available=True,
            openscad_binary=binary,
            message=f"OpenSCAD CLI invocation failed: {type(exc).__name__}: {exc}",
        )

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()[:1000]
        return StlExportResult(
            success=False,
            stl_path=None,
            openscad_available=True,
            openscad_binary=binary,
            message=f"OpenSCAD CLI exited with code {proc.returncode}: {detail}",
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            returncode=proc.returncode,
        )

    if not dst.is_file() or dst.stat().st_size == 0:
        return StlExportResult(
            success=False,
            stl_path=None,
            openscad_available=True,
            openscad_binary=binary,
            message=(
                "OpenSCAD CLI returned exit code 0, but no non-empty STL output was produced "
                f"at '{dst}'."
            ),
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            returncode=proc.returncode,
        )

    return StlExportResult(
        success=True,
        stl_path=dst,
        openscad_available=True,
        openscad_binary=binary,
        message=f"STL exported successfully to '{dst}' ({dst.stat().st_size} bytes).",
        stdout=proc.stdout or "",
        stderr=proc.stderr or "",
        returncode=proc.returncode,
    )
