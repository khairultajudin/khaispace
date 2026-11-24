"""Structured validation and geometry error types for KAI CAD Studio."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional


@dataclass(frozen=True)
class ValidationIssue:
    """A single validation failure with field name, error code, and human message."""

    field: str
    code: str
    message: str

    def format(self) -> str:
        return f"[{self.code}] {self.field}: {self.message}"


class KaiCadError(Exception):
    """Base exception for all KAI CAD Studio errors."""


class GeometryValidationError(KaiCadError, ValueError):
    """Raised when CAD input parameters fail schema or geometric feasibility checks."""

    def __init__(self, issues: Iterable[ValidationIssue], message: Optional[str] = None) -> None:
        self.issues: List[ValidationIssue] = list(issues)
        if message is None:
            summary = "; ".join(issue.format() for issue in self.issues)
            message = f"Geometry validation failed ({len(self.issues)} issue(s)): {summary}"
        super().__init__(message)


class ExportDependencyError(KaiCadError, RuntimeError):
    """Raised when an external CAD backend (e.g. OpenSCAD CLI) is required but unavailable."""
