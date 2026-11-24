"""KAI CAD Studio — Phase 0/1 Design Lifecycle State Machine."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, FrozenSet, List, Optional


class DesignState(str, Enum):
    """Canonical 6-state lifecycle for KAI CAD Studio artifacts."""

    DRAFT = "Draft"
    GENERATED = "Generated"
    VALIDATED = "Validated"
    EXPORTED = "Exported"
    IMPORTED = "Imported"
    COMPLETED = "Completed"


VALID_TRANSITIONS: Dict[DesignState, FrozenSet[DesignState]] = {
    DesignState.DRAFT: frozenset({DesignState.GENERATED}),
    DesignState.GENERATED: frozenset({DesignState.VALIDATED, DesignState.DRAFT}),
    DesignState.VALIDATED: frozenset({DesignState.EXPORTED, DesignState.DRAFT}),
    DesignState.EXPORTED: frozenset({DesignState.IMPORTED, DesignState.COMPLETED, DesignState.DRAFT}),
    DesignState.IMPORTED: frozenset({DesignState.COMPLETED, DesignState.DRAFT}),
    DesignState.COMPLETED: frozenset(),
}

# Advisory mapping to Khai Space Hub's 3-value task_status enum.
HUB_STATUS_MAP: Dict[DesignState, str] = {
    DesignState.DRAFT: "Pending",
    DesignState.GENERATED: "In Progress",
    DesignState.VALIDATED: "In Progress",
    DesignState.EXPORTED: "In Progress",
    DesignState.IMPORTED: "In Progress",
    DesignState.COMPLETED: "Completed",
}


def can_transition(current: DesignState, target: DesignState) -> bool:
    """Return True when transitioning from *current* to *target* is permitted."""
    return target in VALID_TRANSITIONS.get(current, frozenset())


def map_to_hub_status(state: DesignState) -> str:
    """Return the corresponding Khai Space Hub task_status value."""
    return HUB_STATUS_MAP[state]


@dataclass(frozen=True)
class LifecycleEvent:
    """Immutable audit entry for a design lifecycle state transition."""

    from_state: str
    to_state: str
    timestamp_utc: str
    note: str = ""


@dataclass
class DesignRecord:
    """Tracks a CAD design's identity, lifecycle state, artifacts, and audit history."""

    design_id: str
    component_type: str
    state: DesignState = DesignState.DRAFT
    scad_path: Optional[str] = None
    stl_path: Optional[str] = None
    spec_sha256: Optional[str] = None
    history: List[LifecycleEvent] = field(default_factory=list)

    def transition(self, target: DesignState, *, note: str = "") -> DesignState:
        """Advance the record to *target* if permitted; raise ValueError otherwise."""
        if not can_transition(self.state, target):
            raise ValueError(
                f"Invalid KAI CAD lifecycle transition: '{self.state.value}' -> '{target.value}'."
            )
        self.history.append(
            LifecycleEvent(
                from_state=self.state.value,
                to_state=target.value,
                timestamp_utc=datetime.now(timezone.utc).isoformat(),
                note=note,
            )
        )
        self.state = target
        return self.state
