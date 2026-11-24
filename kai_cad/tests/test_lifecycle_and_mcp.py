"""Unit tests for KAI CAD 6-state lifecycle audit protection and MCP provider interface."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import datetime
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

    def test_full_happy_path_and_utc_audit_events(self) -> None:
        rec = DesignRecord(design_id="CAD-001", component_type="custom_adapter")
        self.assertEqual(rec.state, DesignState.DRAFT)
        self.assertEqual(rec.history, ())

        for idx, target in enumerate(
            (
                DesignState.GENERATED,
                DesignState.VALIDATED,
                DesignState.EXPORTED,
                DesignState.IMPORTED,
                DesignState.COMPLETED,
            ),
            start=1,
        ):
            rec.transition(target, note=f"Moved to {target.value}")
            self.assertEqual(len(rec.history), idx)
            ev = rec.history[-1]
            self.assertEqual(ev.to_state, target.value)
            parsed_ts = datetime.fromisoformat(ev.timestamp_utc)
            self.assertIsNotNone(parsed_ts.tzinfo)
            self.assertEqual(parsed_ts.utcoffset().total_seconds(), 0.0)

        self.assertEqual(rec.state, DesignState.COMPLETED)

    def test_invalid_transitions_do_not_alter_state_or_history(self) -> None:
        rec = DesignRecord(design_id="CAD-002", component_type="custom_adapter")
        self.assertFalse(can_transition(DesignState.DRAFT, DesignState.EXPORTED))

        with self.assertRaises(ValueError):
            rec.transition(DesignState.EXPORTED)
        self.assertEqual(rec.state, DesignState.DRAFT)
        self.assertEqual(rec.history, ())

        # Non-DesignState target is rejected without mutation
        with self.assertRaises(ValueError):
            rec.transition("Generated")  # type: ignore[arg-type]
        self.assertEqual(rec.state, DesignState.DRAFT)
        self.assertEqual(rec.history, ())

        # Advance to Completed and verify terminal state rejects further transitions
        rec.transition(DesignState.GENERATED)
        rec.transition(DesignState.VALIDATED)
        rec.transition(DesignState.EXPORTED)
        rec.transition(DesignState.COMPLETED)
        before_history = rec.history

        with self.assertRaises(ValueError):
            rec.transition(DesignState.DRAFT)
        self.assertEqual(rec.state, DesignState.COMPLETED)
        self.assertEqual(rec.history, before_history)

    def test_history_is_protected_against_external_mutation(self) -> None:
        rec = DesignRecord(design_id="CAD-003", component_type="custom_adapter")
        rec.transition(DesignState.GENERATED, note="Initial SCAD")

        # Exposed history is an immutable tuple
        self.assertIsInstance(rec.history, tuple)
        with self.assertRaises(AttributeError):
            rec.history.append("forged")  # type: ignore[attr-defined]

        # Read-only property cannot be reassigned
        with self.assertRaises(AttributeError):
            rec.history = ()  # type: ignore[misc]

        # Individual LifecycleEvent objects are frozen
        with self.assertRaises(AttributeError):
            rec.history[0].to_state = "Completed"  # type: ignore[misc]

        # External callers cannot inject forged history via constructor
        with self.assertRaises(TypeError):
            DesignRecord(design_id="CAD-FORGE", component_type="custom_adapter", history=[])  # type: ignore[call-arg]


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
            self.assertEqual(len(state_res.data["history"]), 2)

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
