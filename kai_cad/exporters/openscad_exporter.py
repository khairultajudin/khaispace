"""OpenSCAD source writer and optional OpenSCAD CLI STL exporter."""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, Optional

_WSL_MNT_RE = re.compile(r"^/mnt/([a-zA-Z])(?:/(.*))?$")

_WINDOWS_OPENSCAD_CANDIDATES = (
    Path(r"C:\Program Files\OpenSCAD\openscad.com"),
    Path(r"C:\Program Files\OpenSCAD\openscad.exe"),
    Path(r"C:\Program Files (x86)\OpenSCAD\openscad.com"),
    Path(r"C:\Program Files (x86)\OpenSCAD\openscad.exe"),
)

_MACOS_OPENSCAD_CANDIDATES = (
    Path("/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"),
)


def _resolve_candidate(candidate: str) -> Optional[str]:
    """Resolve an explicit binary name or file path without falling back to other paths."""
    cleaned = candidate.strip()
    if not cleaned:
        return None
    resolved = shutil.which(cleaned)
    if resolved:
        return resolved
    p = Path(cleaned)
    if p.is_file():
        return str(p)
    return None


def resolve_openscad_binary(explicit_bin: Optional[str] = None) -> Optional[str]:
    """Locate the OpenSCAD CLI executable, returning None if unavailable.

    Resolution order:
      1. Explicit `explicit_bin` argument (internal Python callers only; authoritative if provided)
      2. `OPENSCAD_BIN` environment variable (authoritative server-side configuration if set and non-empty)
      3. `PATH` lookup (`openscad`, `openscad.exe`, `openscad.com`)
      4. Standard OS install locations (Windows Program Files, macOS Applications)
    """
    if explicit_bin is not None:
        return _resolve_candidate(explicit_bin)

    env_bin = os.environ.get("OPENSCAD_BIN", "").strip()
    if env_bin:
        return _resolve_candidate(env_bin)

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


def _to_openscad_cli_path(path: Path | os.PathLike[str] | str, binary: str, *, os_name: Optional[str] = None) -> str:
    """Format file path for OpenSCAD CLI, translating WSL2 paths when invoking Win32 binaries."""
    raw = str(path)
    effective_os = os.name if os_name is None else os_name
    if effective_os == "posix" and binary.lower().endswith((".exe", ".com")):
        posix_raw = raw.replace("\\", "/")
        resolved_str = (
            str(Path(path).resolve()).replace("\\", "/")
            if os.name == "posix" and (Path(path).exists() or Path(path).parent.exists())
            else posix_raw
        )
        match = _WSL_MNT_RE.match(resolved_str) or _WSL_MNT_RE.match(posix_raw)
        if match:
            drive = match.group(1).upper()
            rest = (match.group(2) or "").replace("/", "\\")
            return f"{drive}:\\{rest}" if rest else f"{drive}:\\"
        wslpath_bin = shutil.which("wslpath")
        if wslpath_bin:
            proc = subprocess.run(
                [wslpath_bin, "-w", resolved_str],
                capture_output=True,
                text=True,
                timeout=5,
                stdin=subprocess.DEVNULL,
                shell=False,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                return proc.stdout.strip()
    return raw


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
    cli_dst = _to_openscad_cli_path(dst, binary)
    cli_src = _to_openscad_cli_path(src, binary)
    cmd: List[str] = [binary, "-o", cli_dst, cli_src]

    try:
        proc = runner(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            stdin=subprocess.DEVNULL,
            shell=False,
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
