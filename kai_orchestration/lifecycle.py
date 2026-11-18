"""Phase 3 14-state execution lifecycle and Hub/Kanban status mapping."""

from __future__ import annotations

from enum import Enum
from typing import Dict, FrozenSet


class Phase3State(str, Enum):
    REQUESTED = "Requested"
    ANALYSING = "Analysing"
    PLANNED = "Planned"
    AWAITING_APPROVAL = "Awaiting Approval"
    READY_FOR_HANDOFF = "Ready for Handoff"
    DISPATCHED = "Dispatched"
    IN_DEVELOPMENT = "In Development"
    REVIEW_REQUIRED = "Review Required"
    VERIFICATION = "Verification"
    REVISION_REQUIRED = "Revision Required"
    VERIFIED = "Verified"
    COMPLETED = "Completed"
    BLOCKED = "Blocked"
    CANCELLED = "Cancelled"


# Map 14 granular states to Khai Space Hub's existing 3-value task_status enum.
HUB_STATUS_MAP: Dict[Phase3State, str] = {
    Phase3State.REQUESTED: "Pending",
    Phase3State.ANALYSING: "In Progress",
    Phase3State.PLANNED: "Pending",
    Phase3State.AWAITING_APPROVAL: "Pending",
    Phase3State.READY_FOR_HANDOFF: "Pending",
    Phase3State.DISPATCHED: "In Progress",
    Phase3State.IN_DEVELOPMENT: "In Progress",
    Phase3State.REVIEW_REQUIRED: "In Progress",
    Phase3State.VERIFICATION: "In Progress",
    Phase3State.REVISION_REQUIRED: "In Progress",
    Phase3State.VERIFIED: "Completed",
    Phase3State.COMPLETED: "Completed",
    Phase3State.BLOCKED: "Pending",
    Phase3State.CANCELLED: "Completed",
}

# Map 14 granular states to Hermes Kanban statuses.
KANBAN_STATUS_MAP: Dict[Phase3State, str] = {
    Phase3State.REQUESTED: "triage",
    Phase3State.ANALYSING: "running",
    Phase3State.PLANNED: "todo",
    Phase3State.AWAITING_APPROVAL: "blocked",
    Phase3State.READY_FOR_HANDOFF: "ready",
    Phase3State.DISPATCHED: "running",
    Phase3State.IN_DEVELOPMENT: "running",
    Phase3State.REVIEW_REQUIRED: "review",
    Phase3State.VERIFICATION: "review",
    Phase3State.REVISION_REQUIRED: "ready",
    Phase3State.VERIFIED: "done",
    Phase3State.COMPLETED: "done",
    Phase3State.BLOCKED: "blocked",
    Phase3State.CANCELLED: "done",
}

VALID_TRANSITIONS: Dict[Phase3State, FrozenSet[Phase3State]] = {
    Phase3State.REQUESTED: frozenset({Phase3State.ANALYSING, Phase3State.CANCELLED}),
    Phase3State.ANALYSING: frozenset({Phase3State.PLANNED, Phase3State.BLOCKED, Phase3State.CANCELLED}),
    Phase3State.PLANNED: frozenset({Phase3State.AWAITING_APPROVAL, Phase3State.READY_FOR_HANDOFF, Phase3State.BLOCKED, Phase3State.CANCELLED}),
    Phase3State.AWAITING_APPROVAL: frozenset({Phase3State.READY_FOR_HANDOFF, Phase3State.BLOCKED, Phase3State.CANCELLED}),
    Phase3State.READY_FOR_HANDOFF: frozenset({Phase3State.DISPATCHED, Phase3State.AWAITING_APPROVAL, Phase3State.BLOCKED, Phase3State.CANCELLED}),
    Phase3State.DISPATCHED: frozenset({Phase3State.IN_DEVELOPMENT, Phase3State.REVIEW_REQUIRED, Phase3State.BLOCKED}),
    Phase3State.IN_DEVELOPMENT: frozenset({Phase3State.REVIEW_REQUIRED, Phase3State.BLOCKED}),
    Phase3State.REVIEW_REQUIRED: frozenset({Phase3State.VERIFICATION, Phase3State.REVISION_REQUIRED, Phase3State.BLOCKED}),
    Phase3State.VERIFICATION: frozenset({Phase3State.VERIFIED, Phase3State.REVISION_REQUIRED, Phase3State.BLOCKED}),
    Phase3State.REVISION_REQUIRED: frozenset({Phase3State.READY_FOR_HANDOFF, Phase3State.DISPATCHED, Phase3State.BLOCKED, Phase3State.CANCELLED}),
    Phase3State.VERIFIED: frozenset({Phase3State.COMPLETED}),
    Phase3State.COMPLETED: frozenset(),
    Phase3State.BLOCKED: frozenset({Phase3State.ANALYSING, Phase3State.PLANNED, Phase3State.READY_FOR_HANDOFF, Phase3State.CANCELLED}),
    Phase3State.CANCELLED: frozenset(),
}


def can_transition(current: Phase3State, target: Phase3State) -> bool:
    """Return True if transitioning from *current* to *target* is permitted."""
    return target in VALID_TRANSITIONS.get(current, frozenset())


def map_to_hub_status(state: Phase3State) -> str:
    """Return the corresponding Khai Space Hub task_status enum value."""
    return HUB_STATUS_MAP[state]


def map_to_kanban_status(state: Phase3State) -> str:
    """Return the corresponding Hermes Kanban board status."""
    return KANBAN_STATUS_MAP[state]
