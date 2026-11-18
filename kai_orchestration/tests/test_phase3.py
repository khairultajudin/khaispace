"""Unit and integration tests for KAI Phase 3 orchestration modules."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_orchestration import (  # type: ignore[import-not-found]
    AgyBridge,
    AutonomyLevel,
    EngineeringBrief,
    Phase3State,
    can_transition,
    evaluate_action_risk,
    generate_brief_markdown,
    map_to_hub_status,
    map_to_kanban_status,
    verify_workspace_changes,
)


def _sample_brief(**overrides) -> EngineeringBrief:
    base = dict(
        brief_id="KAI-P3-001",
        project_name="Khai Space",
        objective="Add a pure utility helper and unit test.",
        background="Phase 3 E2E verification.",
        existing_implementation="Static Next.js app + Python orchestration package.",
        requirements=["Create helper module", "Pass unit test"],
        technical_constraints=["Pure stdlib only", "No secrets"],
        relevant_files=["kai_orchestration/lifecycle.py"],
        expected_changes=["Add helper"],
        acceptance_criteria=["Unit test passes"],
        testing_requirements=["python -m unittest"],
        security_considerations=["No credentials in code"],
        expected_deliverables=["kai_orchestration/lifecycle.py"],
    )
    base.update(overrides)
    return EngineeringBrief(**base)


class TestPhase3Lifecycle(unittest.TestCase):
    def test_all_14_states_map_to_hub_and_kanban(self) -> None:
        for state in Phase3State:
            hub_status = map_to_hub_status(state)
            kanban_status = map_to_kanban_status(state)
            self.assertIn(hub_status, {"Pending", "In Progress", "Completed"})
            self.assertIn(kanban_status, {"triage", "todo", "ready", "running", "review", "blocked", "done"})

    def test_valid_and_invalid_transitions(self) -> None:
        self.assertTrue(can_transition(Phase3State.REQUESTED, Phase3State.ANALYSING))
        self.assertTrue(can_transition(Phase3State.VERIFICATION, Phase3State.REVISION_REQUIRED))
        self.assertFalse(can_transition(Phase3State.EXECUTED if hasattr(Phase3State, "EXECUTED") else Phase3State.DISPATCHED, Phase3State.COMPLETED))
        self.assertFalse(can_transition(Phase3State.DISPATCHED, Phase3State.COMPLETED))


class TestPhase3Approval(unittest.TestCase):
    def test_level_3_blocked_without_approval(self) -> None:
        dec = evaluate_action_risk(["modify_dev_file", "rls_change"])
        self.assertEqual(dec.level, AutonomyLevel.LEVEL_3_OWNER_APPROVAL)
        self.assertFalse(dec.allowed)
        self.assertTrue(dec.requires_owner_approval)

    def test_level_3_allowed_with_explicit_approval(self) -> None:
        dec = evaluate_action_risk(["production_deploy"], owner_approved=True)
        self.assertTrue(dec.allowed)

    def test_level_2_allowed_autonomously(self) -> None:
        dec = evaluate_action_risk(["create_branch", "run_test_suite"])
        self.assertEqual(dec.level, AutonomyLevel.LEVEL_2_CONTROLLED)
        self.assertTrue(dec.allowed)


class TestBriefGenerator(unittest.TestCase):
    def test_generates_12_sections(self) -> None:
        md = generate_brief_markdown(_sample_brief())
        self.assertIn("## 12. Expected Deliverables", md)

    def test_rejects_secret_patterns(self) -> None:
        bad = _sample_brief(background="Do not leak KAI_HUB_TOKEN=supersecretvalue123")
        with self.assertRaises(ValueError):
            generate_brief_markdown(bad)


class TestAgyBridge(unittest.TestCase):
    def test_idempotent_handoff_and_level3_gate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bridge = AgyBridge(handoff_dir=Path(tmp), agy_bin="/fake/agy")
            l3_brief = _sample_brief(brief_id="KAI-L3", action_tags=["rls_change"])
            rec = bridge.prepare_handoff(l3_brief, idempotency_key="k1", workspace_dir=tmp)
            self.assertEqual(rec.state, Phase3State.AWAITING_APPROVAL.value)
            # Dispatch must not proceed while awaiting approval
            after = bridge.dispatch("KAI-L3")
            self.assertEqual(after.state, Phase3State.AWAITING_APPROVAL.value)
            # Duplicate idempotency key returns existing record
            dup = bridge.prepare_handoff(l3_brief, idempotency_key="k1", workspace_dir=tmp)
            self.assertEqual(dup.updated_at, rec.updated_at)

    def test_dispatch_success_and_revision_loop(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bridge = AgyBridge(handoff_dir=Path(tmp), agy_bin="/fake/agy")
            brief = _sample_brief(brief_id="KAI-DEV-1")
            bridge.prepare_handoff(brief, idempotency_key="k2", workspace_dir=tmp, mode="plan")

            def fake_runner(cmd, **kwargs):
                self.assertIn("--sandbox", cmd)
                self.assertNotIn("--dangerously-skip-permissions", cmd)
                return SimpleNamespace(
                    returncode=0,
                    stdout=json.dumps({"conversation_id": "conv-123", "status": "SUCCESS", "response": "Done"}),
                    stderr="",
                )

            rec = bridge.dispatch("KAI-DEV-1", runner=fake_runner)
            self.assertEqual(rec.state, Phase3State.REVIEW_REQUIRED.value)
            self.assertEqual(rec.conversation_id, "conv-123")
            self.assertEqual(rec.attempts, 1)

    def test_retry_limit_blocks_after_max_attempts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bridge = AgyBridge(handoff_dir=Path(tmp), agy_bin="/fake/agy")
            brief = _sample_brief(brief_id="KAI-RETRY")
            rec = bridge.prepare_handoff(brief, idempotency_key="k3", workspace_dir=tmp)
            rec.attempts = 2
            bridge.save_record(rec)
            blocked = bridge.dispatch("KAI-RETRY")
            self.assertEqual(blocked.state, Phase3State.BLOCKED.value)


class TestVerifier(unittest.TestCase):
    def test_failed_test_triggers_revision_required(self) -> None:
        res = verify_workspace_changes(
            ROOT,
            expected_files=["kai_orchestration/lifecycle.py"],
            test_cmd=[sys.executable, "-c", "import sys; sys.exit(1)"],
        )
        self.assertFalse(res.passed)
        self.assertEqual(res.next_state, Phase3State.REVISION_REQUIRED)

    def test_passing_test_triggers_verified(self) -> None:
        res = verify_workspace_changes(
            ROOT,
            expected_files=["kai_orchestration/lifecycle.py"],
            test_cmd=[sys.executable, "-c", "print('ok')"],
        )
        self.assertTrue(res.passed)
        self.assertEqual(res.next_state, Phase3State.VERIFIED)


if __name__ == "__main__":
    unittest.main()
