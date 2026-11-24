"""KAI CAD Studio — Phase 0/1/2 Design Lifecycle State Machine."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, FrozenSet, List, Mapping, Optional, Sequence, Tuple


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
    if not isinstance(current, DesignState) or not isinstance(target, DesignState):
        return False
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
    """Tracks a CAD design's identity, lifecycle state, artifacts, and immutable audit trail.

    Audit history is private and exposed strictly as a read-only tuple of immutable
    `LifecycleEvent` objects; external callers cannot append, clear, replace, or
    inject history entries outside `transition()`.
    """

    design_id: str
    component_type: str
    state: DesignState = DesignState.DRAFT
    scad_path: Optional[str] = None
    stl_path: Optional[str] = None
    spec_sha256: Optional[str] = None
    _history: List[LifecycleEvent] = field(default_factory=list, init=False, repr=False)

    @property
    def history(self) -> Tuple[LifecycleEvent, ...]:
        """Return an immutable snapshot of all recorded lifecycle transitions."""
        return tuple(self._history)

    def transition(self, target: DesignState, *, note: str = "") -> DesignState:
        """Advance the record to *target* if permitted; raise ValueError without mutating state or history."""
        if not isinstance(target, DesignState):
            raise ValueError(
                f"Invalid KAI CAD lifecycle target state: expected DesignState, got {target!r}."
            )
        if not can_transition(self.state, target):
            raise ValueError(
                f"Invalid KAI CAD lifecycle transition: '{self.state.value}' -> '{target.value}'."
            )
        event = LifecycleEvent(
            from_state=self.state.value,
            to_state=target.value,
            timestamp_utc=datetime.now(timezone.utc).isoformat(),
            note=note,
        )
        self._history.append(event)
        self.state = target
        return self.state

    def to_dict(self) -> Dict[str, Any]:
        """Serialize record fields and immutable audit trail to a JSON-compatible dict."""
        return {
            "design_id": self.design_id,
            "component_type": self.component_type,
            "state": self.state.value,
            "scad_path": self.scad_path,
            "stl_path": self.stl_path,
            "spec_sha256": self.spec_sha256,
            "history": [asdict(ev) for ev in self._history],
        }

    @classmethod
    def from_persisted(cls, data: Mapping[str, Any]) -> "DesignRecord":
        """Rehydrate a persisted DesignRecord while validating state and audit event integrity."""
        if not isinstance(data, Mapping):
            raise ValueError("Persisted design record must be a mapping.")
        design_id = data.get("design_id")
        component_type = data.get("component_type")
        raw_state = data.get("state")
        if not isinstance(design_id, str) or not design_id.strip():
            raise ValueError("Persisted design record missing valid 'design_id'.")
        if not isinstance(component_type, str) or not component_type.strip():
            raise ValueError("Persisted design record missing valid 'component_type'.")
        if not isinstance(raw_state, str):
            raise ValueError("Persisted design record missing valid 'state'.")

        state = DesignState(raw_state)
        raw_history = data.get("history", [])
        if not isinstance(raw_history, Sequence) or isinstance(raw_history, (str, bytes)):
            raise ValueError("Persisted design record 'history' must be a list of events.")

        events: List[LifecycleEvent] = []
        for idx, item in enumerate(raw_history):
            if not isinstance(item, Mapping):
                raise ValueError(f"Persisted audit event at index {idx} is not an object.")
            from_s = DesignState(str(item.get("from_state", ""))).value
            to_s = DesignState(str(item.get("to_state", ""))).value
            ts = item.get("timestamp_utc")
            if not isinstance(ts, str) or not ts.strip():
                raise ValueError(f"Persisted audit event at index {idx} missing 'timestamp_utc'.")
            datetime.fromisoformat(ts)
            note = str(item.get("note", ""))
            events.append(LifecycleEvent(from_state=from_s, to_state=to_s, timestamp_utc=ts, note=note))

        record = cls(
            design_id=design_id,
            component_type=component_type,
            state=state,
            scad_path=data.get("scad_path") if isinstance(data.get("scad_path"), str) else None,
            stl_path=data.get("stl_path") if isinstance(data.get("stl_path"), str) else None,
            spec_sha256=data.get("spec_sha256") if isinstance(data.get("spec_sha256"), str) else None,
        )
        record._history = events
        return record
