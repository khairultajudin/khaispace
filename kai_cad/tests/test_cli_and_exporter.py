"""Unit tests for KAI CAD CLI argument handling and OpenSCAD exporter behavior."""

from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_cad.cli import run_cli
from kai_cad.exporters.openscad_exporter import (
    _to_openscad_cli_path,
    export_stl_with_openscad,
    write_scad_file,
)

EXAMPLE_CONFIG = ROOT / "kai_cad" / "examples" / "custom_adapter.example.json"


class TestCliAndExporter(unittest.TestCase):
    def test_cli_validate_only_json_output(self) -> None:
        out = io.StringIO()
        err = io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = run_cli(["custom-adapter", "--config", str(EXAMPLE_CONFIG), "--validate-only", "--json"])
        self.assertEqual(code, 0)
        payload = json.loads(out.getvalue())
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["mode"], "validate-only")
        self.assertEqual(payload["name"], "hose_reducer_25_to_19")

    def test_cli_generates_scad_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            scad_path = Path(tmp) / "out" / "adapter.scad"
            out = io.StringIO()
            err = io.StringIO()
            with redirect_stdout(out), redirect_stderr(err):
                code = run_cli(["custom-adapter", "--config", str(EXAMPLE_CONFIG), "--output", str(scad_path), "--json"])
            self.assertEqual(code, 0)
            self.assertTrue(scad_path.is_file())
            payload = json.loads(out.getvalue())
            self.assertTrue(payload["ok"])
            self.assertFalse(payload["stl_exported"])
            self.assertIn("module custom_adapter(", scad_path.read_text(encoding="utf-8"))

    def test_cli_requires_output_unless_validate_only(self) -> None:
        out = io.StringIO()
        err = io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = run_cli(["custom-adapter", "--config", str(EXAMPLE_CONFIG)])
        self.assertEqual(code, 2)
        self.assertIn("--output", err.getvalue())

    def test_cli_rejects_validate_only_with_stl(self) -> None:
        out = io.StringIO()
        err = io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = run_cli(["custom-adapter", "--config", str(EXAMPLE_CONFIG), "--validate-only", "--stl", "a.stl"])
        self.assertEqual(code, 2)
        self.assertIn("--stl", err.getvalue())

    def test_cli_reports_missing_config_and_invalid_config(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            # Missing config
            err = io.StringIO()
            with redirect_stderr(err):
                code = run_cli(["custom-adapter", "--config", str(Path(tmp) / "nope.json"), "--validate-only"])
            self.assertEqual(code, 1)

            # Invalid geometry config
            bad_cfg = Path(tmp) / "bad.json"
            bad_cfg.write_text(
                json.dumps(
                    {
                        "overall_length_mm": 20.0,
                        "body_diameter_mm": 10.0,
                        "end_a_diameter_mm": 10.0,
                        "end_b_diameter_mm": 10.0,
                        "end_a_length_mm": 15.0,
                        "end_b_length_mm": 10.0,
                        "bore_a_diameter_mm": 12.0,
                        "bore_b_diameter_mm": 5.0,
                    }
                ),
                encoding="utf-8",
            )
            err2 = io.StringIO()
            with redirect_stderr(err2):
                code2 = run_cli(["custom-adapter", "--config", str(bad_cfg), "--validate-only", "--json"])
            self.assertEqual(code2, 1)
            payload = json.loads(err2.getvalue())
            self.assertFalse(payload["ok"])
            self.assertGreaterEqual(len(payload["issues"]), 2)

    def test_cli_stl_missing_openscad_reports_dependency_honestly(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            scad_path = Path(tmp) / "adapter.scad"
            stl_path = Path(tmp) / "adapter.stl"
            out = io.StringIO()
            err = io.StringIO()
            with redirect_stdout(out), redirect_stderr(err):
                code = run_cli(
                    [
                        "custom-adapter",
                        "--config",
                        str(EXAMPLE_CONFIG),
                        "--output",
                        str(scad_path),
                        "--stl",
                        str(stl_path),
                        "--openscad-bin",
                        str(Path(tmp) / "nonexistent_openscad_binary"),
                        "--json",
                    ]
                )
            # SCAD was generated, STL was NOT faked, and exit code 3 clearly signals missing dependency.
            self.assertEqual(code, 3)
            self.assertTrue(scad_path.is_file())
            self.assertFalse(stl_path.exists())
            payload = json.loads(err.getvalue())
            self.assertFalse(payload["ok"])
            self.assertFalse(payload["stl_exported"])
            self.assertFalse(payload["openscad_available"])
            self.assertIn("OpenSCAD CLI is not installed", payload["stl_message"])

    def test_exporter_succeeds_with_mocked_openscad_runner(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            scad_path = write_scad_file("cube(10);\n", Path(tmp) / "part.scad")
            stl_path = Path(tmp) / "part.stl"
            fake_bin = Path(tmp) / "fake_openscad"
            fake_bin.write_text("stub", encoding="utf-8")

            def fake_runner(cmd, **kwargs):
                self.assertEqual(cmd[0], str(fake_bin))
                self.assertEqual(cmd[1], "-o")
                self.assertEqual(cmd[2], str(stl_path))
                self.assertEqual(cmd[3], str(scad_path))
                stl_path.write_text("solid part\nendsolid part\n", encoding="utf-8")
                return SimpleNamespace(returncode=0, stdout="", stderr="")

            res = export_stl_with_openscad(scad_path, stl_path, openscad_bin=str(fake_bin), runner=fake_runner)
            self.assertTrue(res.success)
            self.assertTrue(res.openscad_available)
            self.assertEqual(res.stl_path, stl_path)
            self.assertTrue(stl_path.is_file())

    def test_wsl2_to_win32_openscad_path_translation(self) -> None:
        win_bin = "/mnt/c/Program Files/OpenSCAD/openscad.com"
        self.assertEqual(
            _to_openscad_cli_path("/mnt/e/KhaiSpace/ws/part.scad", win_bin, os_name="posix"),
            r"E:\KhaiSpace\ws\part.scad",
        )
        # Native POSIX OpenSCAD binary leaves POSIX paths untouched
        self.assertEqual(
            _to_openscad_cli_path("/mnt/e/KhaiSpace/ws/part.scad", "/usr/bin/openscad", os_name="posix"),
            "/mnt/e/KhaiSpace/ws/part.scad",
        )


if __name__ == "__main__":
    unittest.main()
