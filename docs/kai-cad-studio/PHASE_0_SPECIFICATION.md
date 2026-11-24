# KAI CAD Studio — Phase 0 Technical Specification

**Phase:** Phase 0 — Architecture, Lifecycle & MCP Interface Contracts  
**Status:** Implemented  
**Module Root:** `kai_cad/`

---

## 1. Objectives

Phase 0 establishes the architectural foundation for KAI CAD Studio inside `khairultajudin/khaispace`:

1. Define the `kai_cad/` Python package structure and packaging metadata (`kai_cad/pyproject.toml`).
2. Establish strict engineering invariants (millimetre units, reproducibility, no silent dimension mutation, TinkerCAD independence).
3. Implement the 6-state design lifecycle (`kai_cad/lifecycle.py`).
4. Define typed contracts for future KAI CAD MCP integration (`kai_cad/mcp_interface.py`).

---

## 2. Package Structure

```text
kai_cad/
├── __init__.py
├── __main__.py
├── cli.py
├── lifecycle.py
├── mcp_interface.py
├── pyproject.toml
├── README.md
├── examples/
│   └── custom_adapter.example.json
├── exporters/
│   ├── __init__.py
│   └── openscad_exporter.py
├── generators/
│   ├── __init__.py
│   └── custom_adapter.py
├── geometry/
│   ├── __init__.py
│   └── primitives.py
├── tests/
│   ├── __init__.py
│   ├── test_cli_and_exporter.py
│   ├── test_custom_adapter.py
│   └── test_lifecycle_and_mcp.py
└── validators/
    ├── __init__.py
    ├── adapter_validator.py
    └── errors.py
```

---

## 3. Design Lifecycle Specification

The lifecycle state machine (`kai_cad/lifecycle.py`) enforces ordered progression across 6 canonical states:

```text
Draft --> Generated --> Validated --> Exported --> Imported --> Completed
              |             |             |            |
              +-------------+-------------+------------+---> Draft (revision)
                                          |
                                          +----------------> Completed (direct finish)
```

### Invariants
- `DesignRecord.transition(target, note=...)` validates transitions against `VALID_TRANSITIONS` and raises `ValueError` on illegal jumps (e.g. `Draft -> Exported` or `Completed -> Draft`).
- Every transition appends an immutable `LifecycleEvent(from_state, to_state, timestamp_utc, note)` to `record.history`.
- `map_to_hub_status(state)` maps all 6 states onto Khai Space Hub's 3-state task enum (`Pending`, `In Progress`, `Completed`).

---

## 4. Future KAI CAD MCP Integration Interface

Defined in `kai_cad/mcp_interface.py`, `KaiCadMcpProvider` specifies the tool surface that Phase 2+ MCP servers will expose to Antigravity / Hermes / AI agents:

| MCP Tool Name | Inputs | Responsibility |
| :--- | :--- | :--- |
| `cad_validate_spec` | `component_type`, `params` | Validate JSON parameters without writing files; return `spec_sha256` or structured validation issues. |
| `cad_generate_scad` | `design_id`, `component_type`, `params`, `output_scad_path` | Validate, generate deterministic `.scad`, write file, and advance design to `Validated`. |
| `cad_export_stl` | `design_id`, `scad_path`, `output_stl_path`, `openscad_bin?` | Invoke OpenSCAD CLI if installed; advance design to `Exported` on success, or return explicit dependency error. |
| `cad_get_design_state` | `design_id` | Return current lifecycle state, artifact paths, `spec_sha256`, and audit history. |
| `cad_transition_state` | `design_id`, `target_state`, `note?` | Advance a design through allowed lifecycle transitions (e.g., `Exported -> Imported -> Completed`). |

### Envelope Contract (`McpToolResponse`)
```json
{
  "ok": true,
  "tool": "cad_generate_scad",
  "data": {
    "design_id": "ADAPTER-001",
    "state": "Validated",
    "scad_path": "out/adapter.scad",
    "spec_sha256": "...",
    "scad_sha256": "..."
  },
  "errors": []
}
```

### Security & Governance
- No credentials, API keys, or cloud endpoints are required or stored.
- Future MCP servers wrapping `LocalKaiCadMcpAdapter` must enforce workspace path boundaries (mirroring `kai_orchestration/agy_bridge.py` workspace scoping) before writing files.
