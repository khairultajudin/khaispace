"""Structured Engineering Brief generator with secret-leakage prevention."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

SECRET_PATTERNS = (
    re.compile(r"KAI_HUB_TOKEN\s*=\s*\S+", re.IGNORECASE),
    re.compile(r"SERVICE_ROLE", re.IGNORECASE),
    re.compile(r"eyJhbGciOi[A-Za-z0-9_-]{10,}"),
    re.compile(r"sk-[A-Za-z0-9]{16,}"),
    re.compile(r"bot[0-9]{8,}:[A-Za-z0-9_-]{20,}"),
)


@dataclass(frozen=True)
class EngineeringBrief:
    brief_id: str
    project_name: str
    objective: str
    background: str
    existing_implementation: str
    requirements: List[str]
    technical_constraints: List[str]
    relevant_files: List[str]
    expected_changes: List[str]
    acceptance_criteria: List[str]
    testing_requirements: List[str]
    security_considerations: List[str]
    expected_deliverables: List[str]
    action_tags: List[str] = field(default_factory=lambda: ["agy_accept_edits", "modify_dev_file", "run_test_suite"])


def validate_brief(brief: EngineeringBrief) -> List[str]:
    """Validate completeness and secret hygiene of an EngineeringBrief."""
    errors: List[str] = []
    for field_name in ("brief_id", "project_name", "objective", "background", "existing_implementation"):
        if not getattr(brief, field_name, "").strip():
            errors.append(f"Missing required field: {field_name}")

    for list_field in (
        "requirements",
        "technical_constraints",
        "relevant_files",
        "expected_changes",
        "acceptance_criteria",
        "testing_requirements",
        "security_considerations",
        "expected_deliverables",
    ):
        items = getattr(brief, list_field, [])
        if not items or not any(str(i).strip() for i in items):
            errors.append(f"Missing required list entries: {list_field}")

    rendered = generate_brief_markdown(brief, skip_validation=True)
    for pat in SECRET_PATTERNS:
        if pat.search(rendered):
            errors.append(f"Potential secret detected matching pattern: {pat.pattern}")

    return errors


def generate_brief_markdown(brief: EngineeringBrief, *, skip_validation: bool = False) -> str:
    """Render an EngineeringBrief as clean Markdown for Antigravity handoff."""
    def _bullets(items: List[str]) -> str:
        return "\n".join(f"- {item}" for item in items)

    md = f"""# Engineering Brief: {brief.brief_id}

## 1. Project Name
{brief.project_name}

## 2. Objective
{brief.objective}

## 3. Background
{brief.background}

## 4. Existing Implementation
{brief.existing_implementation}

## 5. Requirements
{_bullets(brief.requirements)}

## 6. Technical Constraints
{_bullets(brief.technical_constraints)}

## 7. Relevant Files
{_bullets(brief.relevant_files)}

## 8. Expected Changes
{_bullets(brief.expected_changes)}

## 9. Acceptance Criteria
{_bullets(brief.acceptance_criteria)}

## 10. Testing Requirements
{_bullets(brief.testing_requirements)}

## 11. Security Considerations
{_bullets(brief.security_considerations)}

## 12. Expected Deliverables
{_bullets(brief.expected_deliverables)}
"""
    if not skip_validation:
        errs = validate_brief(brief)
        if errs:
            raise ValueError("; ".join(errs))
    return md
