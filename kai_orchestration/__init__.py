"""KAI Phase 3 Autonomous Engineering & Antigravity Collaboration Package."""

from .lifecycle import (
    Phase3State,
    HUB_STATUS_MAP,
    KANBAN_STATUS_MAP,
    VALID_TRANSITIONS,
    can_transition,
    map_to_hub_status,
    map_to_kanban_status,
)
from .approval import AutonomyLevel, ApprovalDecision, evaluate_action_risk
from .brief_generator import EngineeringBrief, generate_brief_markdown, validate_brief
from .agy_bridge import HandoffRecord, AgyBridge, resolve_agy_binary
from .verifier import VerificationResult, verify_workspace_changes

__all__ = [
    "Phase3State",
    "HUB_STATUS_MAP",
    "KANBAN_STATUS_MAP",
    "VALID_TRANSITIONS",
    "can_transition",
    "map_to_hub_status",
    "map_to_kanban_status",
    "AutonomyLevel",
    "ApprovalDecision",
    "evaluate_action_risk",
    "EngineeringBrief",
    "generate_brief_markdown",
    "validate_brief",
    "HandoffRecord",
    "AgyBridge",
    "resolve_agy_binary",
    "VerificationResult",
    "verify_workspace_changes",
]
