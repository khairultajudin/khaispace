"""KAI CAD Studio — Phase 0/1/2/2.1 Design Lifecycle State Machine."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
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

_REQUIRED_EVENT_KEYS = frozenset({"from_state", "to_state", "timestamp_utc", "note"})


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
        """Rehydrate a persisted DesignRecord with full audit-chain integrity validation.

        Validates:
        1. Every event contains valid string `from_state`, `to_state`, `timestamp_utc` (UTC), and `note`.
        2. Every transition is permitted by `VALID_TRANSITIONS`.
        3. Empty history is accepted strictly when `state == Draft`.
        4. Non-empty history starts from `Draft`, forms a contiguous chain (`ev[i].from_state == ev[i-1].to_state`),
           and ends at `ev[-1].to_state == record.state`.
        Never silently repairs or rewrites malformed history.
        """
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
        if "history" not in data:
            raise ValueError("Persisted design record missing required 'history' field.")
        raw_history = data["history"]
        if not isinstance(raw_history, Sequence) or isinstance(raw_history, (str, bytes)):
            raise ValueError("Persisted design record 'history' must be a list of events.")

        events: List[LifecycleEvent] = []
        for idx, item in enumerate(raw_history):
            if not isinstance(item, Mapping):
                raise ValueError(f"Persisted audit event at index {idx} is not an object.")
            if set(item.keys()) != _REQUIRED_EVENT_KEYS:
                missing = sorted(_REQUIRED_EVENT_KEYS - set(item.keys()))
                extra = sorted(set(item.keys()) - _REQUIRED_EVENT_KEYS)
                raise ValueError(
                    f"Persisted audit event at index {idx} has malformed fields "
                    f"(missing={missing}, unexpected={extra})."
                )
            raw_from = item["from_state"]
            raw_to = item["to_state"]
            raw_ts = item["timestamp_utc"]
            raw_note = item["note"]
            if not isinstance(raw_from, str) or not isinstance(raw_to, str):
                raise ValueError(f"Persisted audit event at index {idx} state fields must be strings.")
            if not isinstance(raw_ts, str) or not raw_ts.strip():
                raise ValueError(f"Persisted audit event at index {idx} missing valid 'timestamp_utc'.")
            if not isinstance(raw_note, str):
                raise ValueError(f"Persisted audit event at index {idx} 'note' must be a string.")

            from_enum = DesignState(raw_from)
            to_enum = DesignState(raw_to)
            if not can_transition(from_enum, to_enum):
                raise ValueError(
                    f"Persisted audit event at index {idx} contains illegal transition "
                    f"'{from_enum.value}' -> '{to_enum.value}'."
                )

            parsed_ts = datetime.fromisoformat(raw_ts)
            if parsed_ts.tzinfo is None or parsed_ts.utcoffset() != timedelta(0):
                raise ValueError(
                    f"Persisted audit event at index {idx} timestamp '{raw_ts}' must be timezone-aware UTC."
                )

            events.append(
                LifecycleEvent(
                    from_state=from_enum.value,
                    to_state=to_enum.value,
                    timestamp_utc=raw_ts,
                    note=raw_note,
                )
            )

        if not events:
            if state != DesignState.DRAFT:
                raise ValueError(
                    f"Persisted design record has empty audit history but non-initial state '{state.value}'."
                )
        else:
            if events[0].from_state != DesignState.DRAFT.value:
                raise ValueError(
                    f"Persisted audit history must start from '{DesignState.DRAFT.value}', "
                    f"got '{events[0].from_state}'."
                )
            for idx in range(1, len(events)):
                prev_to = events[idx - 1].to_state
                curr_from = events[idx].from_state
                if curr_from != prev_to:
                    raise ValueError(
                        f"Disconnected persisted audit chain at index {idx}: "
                        f"event[{idx - 1}].to_state='{prev_to}' != event[{idx}].from_state='{curr_from}'."
                    )
            if events[-1].to_state != state.value:
                raise ValueError(
                    f"Persisted audit history final state '{events[-1].to_state}' does not match "
                    f"record state '{state.value}'."
                )

        scad_path = data.get("scad_path")
        if scad_path is not None and not isinstance(scad_path, str):
            raise ValueError("Persisted design record 'scad_path' must be a string or null.")
        stl_path = data.get("stl_path")
        if stl_path is not None and not isinstance(stl_path, str):
            raise ValueError("Persisted design record 'stl_path' must be a string or null.")
        spec_sha = data.get("spec_sha256")
        if spec_sha is not None and not isinstance(spec_sha, str):
            raise ValueError("Persisted design record 'spec_sha256' must be a string or null.")

        record = cls(
            design_id=design_id,
            component_type=component_type,
            state=state,
            scad_path=scad_path,
            stl_path=stl_path,
            spec_sha256=spec_sha,
        )
        record._history = events
        return record
