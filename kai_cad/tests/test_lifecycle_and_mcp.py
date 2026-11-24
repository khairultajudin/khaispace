"""Unit tests for KAI CAD 6-state lifecycle and MCP provider interface."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_cad import (
    DesignRecord,
    DesignState,
    KaiCadMcpProvider,
    LocalKaiCadMcpAdapter,
    can_transition,
    map_to_hub_status,
)

EXAMPLE_CONFIG = ROOT / "kai_cad" / "examples" / "custom_adapter.example.json"


class TestDesignLifecycle(unittest.TestCase):
    def test_all_six_states_exist_and_map_to_hub_status(self) -> None:
        expected = ["Draft", "Generated", "Validated", "Exported", "Imported", "Completed"]
        self.assertEqual([s.value for s in DesignState], expected)
        for state in DesignState:
            self.assertIn(map_to_hub_status(state), {"Pending", "In Progress", "Completed"})

    def test_full_happy_path_and_invalid_transition_rejection(self) -> None:
        rec = DesignRecord(design_id="CAD-001", component_type="custom_adapter")
        self.assertEqual(rec.state, DesignState.DRAFT)

        # Cannot skip directly from Draft to Exported
        self.assertFalse(can_transition(DesignState.DRAFT, DesignState.EXPORTED))
        with self.assertRaises(ValueError):
            rec.transition(DesignState.EXPORTED)

        for target in (
            DesignState.GENERATED,
            DesignState.VALIDATED,
            DesignState.EXPORTED,
            DesignState.IMPORTED,
            DesignState.COMPLETED,
        ):
            rec.transition(target, note=f"Moved to {target.value}")

        self.assertEqual(rec.state, DesignState.COMPLETED)
        self.assertEqual(len(rec.history), 5)

        # Terminal state rejects further transitions
        with self.assertRaises(ValueError):
            rec.transition(DesignState.DRAFT)


class TestMcpInterface(unittest.TestCase):
    def test_local_adapter_implements_protocol_and_generates_scad(self) -> None:
        adapter = LocalKaiCadMcpAdapter()
        self.assertIsInstance(adapter, KaiCadMcpProvider)

        params = json.loads(EXAMPLE_CONFIG.read_text(encoding="utf-8"))
        val_res = adapter.cad_validate_spec("custom_adapter", params)
        self.assertTrue(val_res.ok)

        with tempfile.TemporaryDirectory() as tmp:
            scad_out = Path(tmp) / "mcp_adapter.scad"
            gen_res = adapter.cad_generate_scad("CAD-MCP-1", "custom_adapter", params, str(scad_out))
            self.assertTrue(gen_res.ok)
            self.assertTrue(scad_out.is_file())
            self.assertEqual(gen_res.data["state"], "Validated")

            state_res = adapter.cad_get_design_state("CAD-MCP-1")
            self.assertTrue(state_res.ok)
            self.assertEqual(state_res.data["state"], "Validated")

            # Missing OpenSCAD binary fails honestly
            stl_res = adapter.cad_export_stl(
                "CAD-MCP-1",
                str(scad_out),
                str(Path(tmp) / "mcp_adapter.stl"),
                openscad_bin=str(Path(tmp) / "missing_openscad"),
            )
            self.assertFalse(stl_res.ok)
            self.assertFalse(stl_res.data["openscad_available"])


if __name__ == "__main__":
    unittest.main()
