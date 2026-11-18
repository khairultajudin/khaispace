"""Risk-based 3-level autonomy and owner-approval enforcement."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable


class AutonomyLevel(str, Enum):
    LEVEL_1_AUTONOMOUS = "Level 1 — Autonomous"
    LEVEL_2_CONTROLLED = "Level 2 — Controlled Autonomous"
    LEVEL_3_OWNER_APPROVAL = "Level 3 — Owner Approval Required"


LEVEL_3_KEYWORDS = frozenset({
    "production_db",
    "production_deploy",
    "rls_change",
    "auth_change",
    "ownership_change",
    "credential_change",
    "security_policy",
    "destructive_delete",
    "irreversible",
    "paid_service",
    "recurring_cost",
    "scope_expansion",
    "merge_main",
    "push_remote",
})

LEVEL_2_KEYWORDS = frozenset({
    "create_branch",
    "modify_dev_file",
    "create_test_file",
    "run_build",
    "run_test_suite",
    "prepare_pr",
    "agy_accept_edits",
})


@dataclass(frozen=True)
class ApprovalDecision:
    level: AutonomyLevel
    allowed: bool
    requires_owner_approval: bool
    reason: str


def evaluate_action_risk(
    action_tags: Iterable[str],
    *,
    owner_approved: bool = False,
) -> ApprovalDecision:
    """Evaluate action tags against the 3-level autonomy policy.

    Level 3 actions are always blocked unless *owner_approved* is explicitly True.
    """
    normalized = {t.strip().lower() for t in action_tags if t and t.strip()}
    l3_hits = sorted(normalized & LEVEL_3_KEYWORDS)
    if l3_hits:
        if owner_approved:
            return ApprovalDecision(
                level=AutonomyLevel.LEVEL_3_OWNER_APPROVAL,
                allowed=True,
                requires_owner_approval=True,
                reason=f"Explicit owner approval recorded for: {', '.join(l3_hits)}",
            )
        return ApprovalDecision(
            level=AutonomyLevel.LEVEL_3_OWNER_APPROVAL,
            allowed=False,
            requires_owner_approval=True,
            reason=f"Owner approval required before executing: {', '.join(l3_hits)}",
        )

    l2_hits = sorted(normalized & LEVEL_2_KEYWORDS)
    if l2_hits:
        return ApprovalDecision(
            level=AutonomyLevel.LEVEL_2_CONTROLLED,
            allowed=True,
            requires_owner_approval=False,
            reason=f"Controlled autonomous execution permitted for: {', '.join(l2_hits)}",
        )

    return ApprovalDecision(
        level=AutonomyLevel.LEVEL_1_AUTONOMOUS,
        allowed=True,
        requires_owner_approval=False,
        reason="Routine Level 1 autonomous operation.",
    )
