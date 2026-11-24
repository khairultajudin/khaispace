"""Command-line interface for KAI CAD Studio (Phase 1)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Sequence

from kai_cad.exporters.openscad_exporter import (
    export_stl_with_openscad,
    write_scad_file,
)
from kai_cad.generators.custom_adapter import CustomAdapterSpec, generate_custom_adapter
from kai_cad.validators.errors import GeometryValidationError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kai-cad",
        description="KAI CAD Studio — Parametric OpenSCAD Generator CLI (all dimensions in mm).",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    adapter = subparsers.add_parser(
        "custom-adapter",
        help="Validate and generate a parametric stepped cylindrical Custom Adapter (.scad / optional .stl).",
    )
    adapter.add_argument(
        "--config",
        "-c",
        required=True,
        help="Path to the Custom Adapter JSON configuration file (dimensions in mm).",
    )
    adapter.add_argument(
        "--output",
        "-o",
        help="Output path for the generated .scad file. Required unless --validate-only is set.",
    )
    adapter.add_argument(
        "--stl",
        help="Optional output path for STL export via OpenSCAD CLI. Fails clearly if OpenSCAD is unavailable.",
    )
    adapter.add_argument(
        "--openscad-bin",
        help="Optional explicit path to the OpenSCAD CLI binary.",
    )
    adapter.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate the JSON configuration without writing .scad or .stl files.",
    )
    adapter.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Emit machine-readable JSON status output to stdout.",
    )
    return parser


def _emit(payload: Dict[str, Any], *, as_json: bool, stream: Any) -> None:
    if as_json:
        print(json.dumps(payload, indent=2), file=stream)
    else:
        print(payload.get("message", ""), file=stream)


def run_cli(argv: Optional[Sequence[str]] = None) -> int:
    """Execute the KAI CAD CLI and return a POSIX exit code."""
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "custom-adapter":
        return _handle_custom_adapter(args)

    parser.print_help(sys.stderr)
    return 2


def _handle_custom_adapter(args: argparse.Namespace) -> int:
    if not args.validate_only and not args.output:
        msg = "Error: --output <path.scad> is required unless --validate-only is specified."
        _emit({"ok": False, "error": msg, "message": msg}, as_json=args.json_output, stream=sys.stderr)
        return 2

    if args.validate_only and args.stl:
        msg = "Error: --stl cannot be combined with --validate-only."
        _emit({"ok": False, "error": msg, "message": msg}, as_json=args.json_output, stream=sys.stderr)
        return 2

    try:
        spec = CustomAdapterSpec.from_json_file(args.config)
    except FileNotFoundError as exc:
        _emit({"ok": False, "error": str(exc), "message": str(exc)}, as_json=args.json_output, stream=sys.stderr)
        return 1
    except GeometryValidationError as exc:
        payload = {
            "ok": False,
            "message": str(exc),
            "issues": [{"field": i.field, "code": i.code, "message": i.message} for i in exc.issues],
        }
        _emit(payload, as_json=args.json_output, stream=sys.stderr)
        return 1

    if args.validate_only:
        payload = {
            "ok": True,
            "mode": "validate-only",
            "name": spec.name,
            "spec_sha256": spec.spec_sha256(),
            "message": f"Valid Custom Adapter specification: '{spec.name}' (spec_sha256={spec.spec_sha256()[:12]}).",
        }
        _emit(payload, as_json=args.json_output, stream=sys.stdout)
        return 0

    result = generate_custom_adapter(spec)
    scad_path = write_scad_file(result.scad_source, Path(args.output))

    output_payload: Dict[str, Any] = {
        "ok": True,
        "name": spec.name,
        "scad_path": str(scad_path),
        "spec_sha256": result.spec_sha256,
        "scad_sha256": result.scad_sha256,
        "stl_exported": False,
        "stl_path": None,
        "message": f"Generated OpenSCAD source: {scad_path} (spec_sha256={result.spec_sha256[:12]}).",
    }

    if args.stl:
        stl_res = export_stl_with_openscad(
            scad_path,
            Path(args.stl),
            openscad_bin=args.openscad_bin,
        )
        output_payload["openscad_available"] = stl_res.openscad_available
        output_payload["openscad_binary"] = stl_res.openscad_binary
        output_payload["stl_message"] = stl_res.message
        if not stl_res.success:
            output_payload["ok"] = False
            output_payload["message"] = f"{output_payload['message']}\n{stl_res.message}"
            _emit(output_payload, as_json=args.json_output, stream=sys.stderr)
            return 3
        output_payload["stl_exported"] = True
        output_payload["stl_path"] = str(stl_res.stl_path)
        output_payload["message"] = f"{output_payload['message']}\n{stl_res.message}"

    _emit(output_payload, as_json=args.json_output, stream=sys.stdout)
    return 0


def main() -> None:
    sys.exit(run_cli())


if __name__ == "__main__":
    main()
