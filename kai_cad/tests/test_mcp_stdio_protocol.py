"""Real end-to-end MCP client/server STDIO protocol tests for KAI CAD Studio (Phase 2 & 2.1)."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    MCP_SDK_AVAILABLE = True
except ImportError:
    MCP_SDK_AVAILABLE = False

EXAMPLE_SPEC = json.loads(
    (ROOT / "kai_cad" / "examples" / "custom_adapter.example.json").read_text(encoding="utf-8")
)

EXPECTED_TOOLS = {
    "cad_generate_design",
    "cad_validate_design",
    "cad_export_stl",
    "cad_get_design",
    "cad_list_designs",
    "cad_get_design_artifact",
}


def _extract_tool_payload(call_result) -> dict:
    """Decode structured JSON payload from an MCP CallToolResult across SDK v1.x and v2.x."""
    sc = getattr(call_result, "structured_content", None)
    if sc is None:
        sc = getattr(call_result, "structuredContent", None)
    if sc is not None:
        if isinstance(sc, dict) and "result" in sc and isinstance(sc["result"], dict):
            return sc["result"]
        if isinstance(sc, dict):
            return sc
    for item in call_result.content:
        text = getattr(item, "text", None)
        if text:
            return json.loads(text)
    raise AssertionError(f"Could not extract JSON payload from CallToolResult: {call_result!r}")


def _input_schema(tool) -> dict:
    schema = getattr(tool, "input_schema", None)
    return schema if schema is not None else getattr(tool, "inputSchema")


def _is_error(call_result) -> bool:
    return bool(getattr(call_result, "is_error", False) or getattr(call_result, "isError", False))


@unittest.skipUnless(MCP_SDK_AVAILABLE, "Official Python MCP SDK ('mcp') is not installed.")
class TestMcpStdioProtocol(unittest.TestCase):
    def test_live_stdio_server_discovery_schema_security_and_restart_persistence(self) -> None:
        asyncio.run(self._run_stdio_e2e())

    async def _run_stdio_e2e(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = str(Path(tmp) / "mcp_ws")
            missing_openscad = str(Path(tmp) / "missing_openscad_cli")
            env_no_openscad = dict(os.environ, OPENSCAD_BIN=missing_openscad)

            server_params = StdioServerParameters(
                command=sys.executable,
                args=["-m", "kai_cad.mcp_server", "--workspace", workspace],
                cwd=str(ROOT),
                env=env_no_openscad,
            )

            # Session 1: Initialize, verify schemas & executable restriction, generate, validate, inspect
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    init_res = await session.initialize()
                    server_info = getattr(init_res, "server_info", None) or getattr(init_res, "serverInfo")
                    self.assertEqual(server_info.name, "kai-cad-studio")

                    tools_res = await session.list_tools()
                    discovered = {t.name: t for t in tools_res.tools}
                    self.assertEqual(set(discovered.keys()), EXPECTED_TOOLS)
                    for name, tool in discovered.items():
                        self.assertTrue(tool.description, f"Tool '{name}' missing description.")
                        schema = _input_schema(tool)
                        self.assertIsInstance(schema, dict)
                        self.assertEqual(schema.get("additionalProperties"), False)

                    # Verify cad_export_stl schema strictly forbids client executable selection
                    export_schema = _input_schema(discovered["cad_export_stl"])
                    self.assertNotIn("openscad_bin", export_schema.get("properties", {}))
                    self.assertEqual(
                        set(export_schema.get("properties", {}).keys()),
                        {"design_id", "timeout_seconds"},
                    )

                    # Generate design over STDIO
                    gen_call = await session.call_tool(
                        "cad_generate_design",
                        arguments={
                            "component_type": "custom_adapter",
                            "spec": EXAMPLE_SPEC,
                            "design_id": "stdio-adapter-01",
                            "output_name": "stdio_reducer",
                        },
                    )
                    gen = _extract_tool_payload(gen_call)
                    self.assertTrue(gen["ok"])
                    self.assertEqual(gen["state"], "Generated")
                    self.assertTrue(Path(gen["scad_path"]).is_file())

                    # Validate design over STDIO
                    val_call = await session.call_tool(
                        "cad_validate_design",
                        arguments={"design_id": "stdio-adapter-01"},
                    )
                    val = _extract_tool_payload(val_call)
                    self.assertTrue(val["ok"])
                    self.assertTrue(val["valid"])
                    self.assertEqual(val["state"], "Validated")

                    # Attempted client injection of openscad_bin must be rejected at MCP boundary
                    injected_call = await session.call_tool(
                        "cad_export_stl",
                        arguments={
                            "design_id": "stdio-adapter-01",
                            "openscad_bin": "/bin/sh",
                        },
                    )
                    self.assertTrue(_is_error(injected_call))

                    # Valid export call with missing server OPENSCAD_BIN returns structured error & preserves state
                    unavail_call = await session.call_tool(
                        "cad_export_stl",
                        arguments={"design_id": "stdio-adapter-01"},
                    )
                    unavail = _extract_tool_payload(unavail_call)
                    self.assertFalse(unavail["ok"])
                    self.assertEqual(unavail["error"]["code"], "OPENSCAD_UNAVAILABLE")
                    self.assertEqual(unavail["state"], "Validated")

                    # Retrieve artifact metadata + text content over STDIO
                    art_call = await session.call_tool(
                        "cad_get_design_artifact",
                        arguments={
                            "design_id": "stdio-adapter-01",
                            "artifact_type": "scad",
                            "include_content": True,
                        },
                    )
                    art = _extract_tool_payload(art_call)
                    self.assertTrue(art["ok"])
                    self.assertTrue(art["content_included"])
                    self.assertIn("module custom_adapter(", art["content"])

                    # Structured error response for unknown design
                    err_call = await session.call_tool(
                        "cad_get_design",
                        arguments={"design_id": "does-not-exist"},
                    )
                    err = _extract_tool_payload(err_call)
                    self.assertFalse(err["ok"])
                    self.assertEqual(err["error"]["code"], "DESIGN_NOT_FOUND")

            # Session 2 (fresh subprocess restart): verify persisted design & audit history survive
            async with stdio_client(server_params) as (read2, write2):
                async with ClientSession(read2, write2) as session2:
                    await session2.initialize()

                    got_call = await session2.call_tool(
                        "cad_get_design",
                        arguments={"design_id": "stdio-adapter-01"},
                    )
                    got = _extract_tool_payload(got_call)
                    self.assertTrue(got["ok"])
                    self.assertEqual(got["state"], "Validated")
                    self.assertEqual(
                        [ev["to_state"] for ev in got["history"]],
                        ["Generated", "Validated"],
                    )

                    list_call = await session2.call_tool(
                        "cad_list_designs",
                        arguments={"state": "Validated"},
                    )
                    listed = _extract_tool_payload(list_call)
                    self.assertTrue(listed["ok"])
                    self.assertEqual(listed["count"], 1)
                    self.assertEqual(listed["designs"][0]["design_id"], "stdio-adapter-01")


if __name__ == "__main__":
    unittest.main()
