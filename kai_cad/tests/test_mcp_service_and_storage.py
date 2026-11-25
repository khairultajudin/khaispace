"""Unit and integration tests for KAI CAD Phase 2 & 2.1 persistence, security, and MCP service layer."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_cad.mcp_service import KaiCadMcpService, MAX_TEXT_ARTIFACT_BYTES
from kai_cad.storage import FileDesignRepository, PathSecurityError, validate_design_id

EXAMPLE_SPEC = json.loads(
    (ROOT / "kai_cad" / "examples" / "custom_adapter.example.json").read_text(encoding="utf-8")
)


class TestMcpServiceWorkflowAndPersistence(unittest.TestCase):
    def test_full_cad_workflow_tinkercad_artifacts_and_restart_persistence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp) / "cad_ws"
            fake_openscad = Path(tmp) / "fake_openscad"
            fake_openscad.write_text("stub", encoding="utf-8")

            def fake_stl_runner(cmd, **kwargs):
                self.assertEqual(cmd[0], str(fake_openscad))
                self.assertFalse(kwargs.get("shell", False))
                stl_out = Path(cmd[cmd.index("-o") + 1])
                stl_out.write_bytes(b"solid adapter\nfacet normal 0 0 1\nendsolid adapter\n")
                return SimpleNamespace(returncode=0, stdout="", stderr="")

            svc = KaiCadMcpService(
                workspace_root=workspace,
                openscad_bin=str(fake_openscad),
                stl_runner=fake_stl_runner,
            )

            # 1. Generate design
            gen = svc.cad_generate_design(
                component_type="custom_adapter",
                spec=EXAMPLE_SPEC,
                design_id="adapter-001",
                output_name="hose_reducer",
            )
            self.assertTrue(gen["ok"])
            self.assertEqual(gen["design_id"], "adapter-001")
            self.assertEqual(gen["state"], "Generated")
            self.assertTrue(Path(gen["scad_path"]).is_file())
            self.assertTrue(Path(gen["spec_path"]).is_file())

            # 2. Exporting before validation must fail (invalid lifecycle transition)
            early_export = svc.cad_export_stl("adapter-001")
            self.assertFalse(early_export["ok"])
            self.assertEqual(early_export["error"]["code"], "INVALID_LIFECYCLE_TRANSITION")

            # 3. Validate design (advances Generated -> Validated, no STL created)
            val = svc.cad_validate_design("adapter-001")
            self.assertTrue(val["ok"])
            self.assertTrue(val["valid"])
            self.assertEqual(val["state"], "Validated")
            self.assertTrue(val["transitioned"])

            # Re-validating an already Validated design succeeds idempotently without duplicate transition
            val2 = svc.cad_validate_design("adapter-001")
            self.assertTrue(val2["ok"])
            self.assertFalse(val2["transitioned"])
            self.assertEqual(val2["state"], "Validated")

            # 4. Export STL (advances Validated -> Exported)
            exp = svc.cad_export_stl("adapter-001")
            self.assertTrue(exp["ok"])
            self.assertEqual(exp["state"], "Exported")
            self.assertGreater(exp["stl_size_bytes"], 0)
            self.assertTrue(Path(exp["stl_path"]).is_file())

            # 5. Simulate MCP server restart with a brand-new service instance on same workspace
            restarted_svc = KaiCadMcpService(workspace_root=workspace)
            got = restarted_svc.cad_get_design("adapter-001")
            self.assertTrue(got["ok"])
            self.assertEqual(got["state"], "Exported")
            self.assertEqual(got["spec_sha256"], gen["spec_sha256"])
            self.assertEqual(got["scad_sha256"], gen["scad_sha256"])
            self.assertEqual(len(got["history"]), 3)
            self.assertEqual(
                [h["to_state"] for h in got["history"]],
                ["Generated", "Validated", "Exported"],
            )
            # TinkerCAD-ready artifacts: original JSON spec, canonical .scad, and non-empty .stl all preserved
            self.assertTrue(got["artifacts"]["spec_json"]["exists"])
            self.assertGreater(got["artifacts"]["spec_json"]["size_bytes"], 0)
            self.assertTrue(got["artifacts"]["scad"]["exists"])
            self.assertGreater(got["artifacts"]["scad"]["size_bytes"], 0)
            self.assertTrue(got["artifacts"]["stl"]["exists"])
            self.assertGreater(got["artifacts"]["stl"]["size_bytes"], 0)

            # 6. List designs with filters
            listed_all = restarted_svc.cad_list_designs()
            self.assertTrue(listed_all["ok"])
            self.assertEqual(listed_all["count"], 1)

            listed_exported = restarted_svc.cad_list_designs(
                component_type="custom_adapter", state="Exported", limit=10
            )
            self.assertEqual(listed_exported["count"], 1)

            listed_draft = restarted_svc.cad_list_designs(state="Draft")
            self.assertEqual(listed_draft["count"], 0)

            # 7. Artifact metadata & bounded text retrieval
            scad_meta = restarted_svc.cad_get_design_artifact("adapter-001", "scad", include_content=False)
            self.assertTrue(scad_meta["ok"])
            self.assertFalse(scad_meta["content_included"])
            self.assertGreater(scad_meta["size_bytes"], 0)

            scad_text = restarted_svc.cad_get_design_artifact("adapter-001", "scad", include_content=True)
            self.assertTrue(scad_text["ok"])
            self.assertTrue(scad_text["content_included"])
            self.assertIn("module custom_adapter(", scad_text["content"])

            stl_meta = restarted_svc.cad_get_design_artifact("adapter-001", "stl", include_content=False)
            self.assertTrue(stl_meta["ok"])
            self.assertEqual(stl_meta["mime_type"], "model/stl")

            # Binary STL inline text content must be refused
            stl_text = restarted_svc.cad_get_design_artifact("adapter-001", "stl", include_content=True)
            self.assertFalse(stl_text["ok"])
            self.assertEqual(stl_text["error"]["code"], "BINARY_ARTIFACT_CONTENT_NOT_SUPPORTED")

    def test_openscad_executable_selection_restricted_to_server_config_and_env(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            # Public service method must NOT accept client-supplied openscad_bin
            svc = KaiCadMcpService(workspace_root=tmp)
            with self.assertRaises(TypeError):
                svc.cad_export_stl("any-id", openscad_bin="/bin/sh")  # type: ignore[call-arg]

            gen = svc.cad_generate_design("custom_adapter", EXAMPLE_SPEC, design_id="env-bin-test")
            self.assertTrue(gen["ok"])
            self.assertTrue(svc.cad_validate_design("env-bin-test")["ok"])

            # Authoritative OPENSCAD_BIN pointing to missing path -> OPENSCAD_UNAVAILABLE without fallback
            missing_bin = str(Path(tmp) / "missing_openscad_exe")
            with patch.dict(os.environ, {"OPENSCAD_BIN": missing_bin}):
                unavail = svc.cad_export_stl("env-bin-test")
                self.assertFalse(unavail["ok"])
                self.assertEqual(unavail["error"]["code"], "OPENSCAD_UNAVAILABLE")
                self.assertEqual(svc.cad_get_design("env-bin-test")["state"], "Validated")

            # Authoritative OPENSCAD_BIN pointing to configured binary -> used by server resolver
            configured_bin = Path(tmp) / "configured_openscad"
            configured_bin.write_text("stub", encoding="utf-8")

            def env_runner(cmd, **kwargs):
                self.assertEqual(cmd[0], str(configured_bin))
                stl_out = Path(cmd[cmd.index("-o") + 1])
                stl_out.write_bytes(b"solid ok\nendsolid ok\n")
                return SimpleNamespace(returncode=0, stdout="", stderr="")

            svc_env = KaiCadMcpService(workspace_root=tmp, stl_runner=env_runner)
            with patch.dict(os.environ, {"OPENSCAD_BIN": str(configured_bin)}):
                ok_exp = svc_env.cad_export_stl("env-bin-test")
                self.assertTrue(ok_exp["ok"])
                self.assertEqual(ok_exp["openscad_binary"], str(configured_bin))
                self.assertEqual(ok_exp["state"], "Exported")


class TestMcpServiceFailureScenarios(unittest.TestCase):
    def test_unknown_design_and_unsupported_component(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)

            bad_comp = svc.cad_generate_design("gear_box", EXAMPLE_SPEC)
            self.assertFalse(bad_comp["ok"])
            self.assertEqual(bad_comp["error"]["code"], "UNSUPPORTED_COMPONENT")

            for fn in (
                lambda: svc.cad_validate_design("missing-id"),
                lambda: svc.cad_export_stl("missing-id"),
                lambda: svc.cad_get_design("missing-id"),
                lambda: svc.cad_get_design_artifact("missing-id", "scad"),
            ):
                res = fn()
                self.assertFalse(res["ok"])
                self.assertEqual(res["error"]["code"], "DESIGN_NOT_FOUND")

    def test_invalid_spec_and_geometry_do_not_create_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)

            bad_spec = dict(EXAMPLE_SPEC, bore_a_diameter_mm=99.0)
            res = svc.cad_generate_design("custom_adapter", bad_spec, design_id="bad-001")
            self.assertFalse(res["ok"])
            self.assertEqual(res["error"]["code"], "VALIDATION_FAILED")
            # No misleading record should exist
            self.assertFalse(svc.cad_get_design("bad-001")["ok"])
            self.assertEqual(svc.cad_list_designs()["count"], 0)

    def test_missing_scad_and_openscad_failures_do_not_advance_lifecycle(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc_unavail = KaiCadMcpService(
                workspace_root=tmp,
                openscad_bin=str(Path(tmp) / "nonexistent_openscad"),
            )
            gen = svc_unavail.cad_generate_design("custom_adapter", EXAMPLE_SPEC, design_id="exp-fail-1")
            self.assertTrue(gen["ok"])
            self.assertTrue(svc_unavail.cad_validate_design("exp-fail-1")["ok"])

            # OpenSCAD unavailable
            unavail = svc_unavail.cad_export_stl("exp-fail-1")
            self.assertFalse(unavail["ok"])
            self.assertEqual(unavail["error"]["code"], "OPENSCAD_UNAVAILABLE")
            self.assertEqual(svc_unavail.cad_get_design("exp-fail-1")["state"], "Validated")

            # OpenSCAD fails with non-zero exit code
            fake_bin = Path(tmp) / "failing_openscad"
            fake_bin.write_text("stub", encoding="utf-8")

            def failing_runner(cmd, **kwargs):
                return SimpleNamespace(returncode=1, stdout="", stderr="CGAL error: non-manifold")

            svc_fail = KaiCadMcpService(
                workspace_root=tmp,
                openscad_bin=str(fake_bin),
                stl_runner=failing_runner,
            )
            fail_res = svc_fail.cad_export_stl("exp-fail-1")
            self.assertFalse(fail_res["ok"])
            self.assertEqual(fail_res["error"]["code"], "STL_EXPORT_FAILED")
            self.assertIn("CGAL error", fail_res["stderr"])
            self.assertEqual(svc_fail.cad_get_design("exp-fail-1")["state"], "Validated")

            # Delete SCAD file -> export & validate detect missing SCAD
            Path(gen["scad_path"]).unlink()
            missing_res = svc_fail.cad_export_stl("exp-fail-1")
            self.assertFalse(missing_res["ok"])
            self.assertEqual(missing_res["error"]["code"], "MISSING_SCAD_ARTIFACT")

    def test_path_traversal_and_corrupted_record_handling(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)

            for bad_id in ("../escape", "..\\escape", "a/b", "a\\b", ".hidden", "has space"):
                with self.subTest(bad_id=bad_id):
                    with self.assertRaises(PathSecurityError):
                        validate_design_id(bad_id)
                    res = svc.cad_get_design(bad_id)
                    self.assertFalse(res["ok"])
                    self.assertEqual(res["error"]["code"], "INVALID_DESIGN_ID")

            bad_out = svc.cad_generate_design(
                "custom_adapter", EXAMPLE_SPEC, design_id="safe-1", output_name="../evil"
            )
            self.assertFalse(bad_out["ok"])
            self.assertEqual(bad_out["error"]["code"], "INVALID_OUTPUT_NAME")

            # Create a healthy design, then test both broken JSON and tampered audit chains
            ok_gen = svc.cad_generate_design("custom_adapter", EXAMPLE_SPEC, design_id="healthy-1")
            self.assertTrue(ok_gen["ok"])

            repo = FileDesignRepository(tmp)
            corrupt_dir = repo.design_dir("corrupt-1")
            corrupt_dir.mkdir(parents=True, exist_ok=True)
            (corrupt_dir / "record.json").write_text("{broken json", encoding="utf-8")

            # Also create a record with valid JSON syntax but tampered/disconnected audit history
            tampered_gen = svc.cad_generate_design("custom_adapter", EXAMPLE_SPEC, design_id="tampered-1")
            self.assertTrue(tampered_gen["ok"])
            tampered_rec_path = repo.design_dir("tampered-1") / "record.json"
            tampered_data = json.loads(tampered_rec_path.read_text(encoding="utf-8"))
            tampered_data["record"]["state"] = "Exported"  # Mismatches history ending at Generated!
            tampered_rec_path.write_text(json.dumps(tampered_data), encoding="utf-8")

            for bad_rec_id in ("corrupt-1", "tampered-1"):
                corrupt_get = svc.cad_get_design(bad_rec_id)
                self.assertFalse(corrupt_get["ok"])
                self.assertEqual(corrupt_get["error"]["code"], "CORRUPTED_RECORD")

            # Listing still returns healthy designs without crashing
            listed = svc.cad_list_designs()
            self.assertTrue(listed["ok"])
            self.assertEqual([d["design_id"] for d in listed["designs"]], ["healthy-1"])

    def test_oversized_text_artifact_content_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            svc = KaiCadMcpService(workspace_root=tmp)
            gen = svc.cad_generate_design("custom_adapter", EXAMPLE_SPEC, design_id="big-scad")
            self.assertTrue(gen["ok"])
            Path(gen["scad_path"]).write_text("x" * (MAX_TEXT_ARTIFACT_BYTES + 10), encoding="utf-8")

            res = svc.cad_get_design_artifact("big-scad", "scad", include_content=True)
            self.assertFalse(res["ok"])
            self.assertEqual(res["error"]["code"], "ARTIFACT_TOO_LARGE")


if __name__ == "__main__":
    unittest.main()
