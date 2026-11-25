# KAI CAD Studio — Phase 2.1: Security, Audit Integrity & TinkerCAD Artifact Workflow

**Phase:** Phase 2.1 — Security & Integrity Hardening  
**Status:** Implemented & Verified  
**Scope:** MCP executable boundary lockdown, persisted lifecycle audit-chain validation, and TinkerCAD-ready artifact preservation

---

## 1. End-to-End Destination Context (TinkerCAD Workflow)

KAI CAD Studio enables KAI (Hermes Agent) to generate parametric 3D designs that Khai can manually import and further manipulate in **[TinkerCAD](https://www.tinkercad.com/)**, while preserving full parametric editability locally:

```text
Khai / User
    |
    v
KAI (Hermes Agent)
    |
    v
KAI CAD MCP Server (STDIO, server-controlled OpenSCAD resolution)
    |
    v
kai_cad Engine + FileDesignRepository (<workspace>/designs/<design_id>/)
    |-- spec.json          (Canonical parametric specification & nominal dimensions)
    |-- <output_name>.scad (Canonical editable OpenSCAD parametric source of truth)
    +-- <output_name>.stl  (Watertight mesh exchange artifact for TinkerCAD import)
```

### Critical Distinction: Parametric Source vs. Imported Mesh
- **`.json` & `.scad` (Canonical Parametric Source):** Preserved inside `<workspace>/designs/<design_id>/` alongside SHA-256 digests and immutable UTC lifecycle history. Any future dimensional change or regeneration must modify `spec.json` / `.scad` and re-export.
- **`.stl` (TinkerCAD Exchange Mesh):** Intended for manual import into TinkerCAD as a triangulated 3D mesh object. **Importing an `.stl` into TinkerCAD does NOT restore OpenSCAD parametric primitives, variables, or construction history.**
- **No TinkerCAD Automation Yet:** Phase 2.1 does **not** automate TinkerCAD browser interactions or upload files automatically.

---

## 2. Task A — OpenSCAD Executable Selection Lockdown

### Vulnerability Addressed
In Phase 2, `cad_export_stl` accepted an optional `openscad_bin` string argument over MCP, allowing an MCP client to request execution of an arbitrary binary path.

### Hardening Implemented
1. **Removed `openscad_bin` from Public MCP Schema & Service Call:**
   - `cad_export_stl(design_id: str, timeout_seconds: int = 120)` in `kai_cad/mcp_server.py` and `KaiCadMcpService.cad_export_stl()` no longer accept `openscad_bin`.
2. **Strict Schema Enforcement (`additionalProperties: false`):**
   - `_enforce_strict_tool_schemas()` in `kai_cad/mcp_server.py` configures Pydantic `ConfigDict(extra="forbid")` and JSON Schema `"additionalProperties": false` on all six registered MCP tools. Any MCP client attempting to pass `openscad_bin` (or any undeclared argument) is rejected at the protocol boundary (`isError=True`).
3. **Authoritative Server-Side Resolution:**
   - OpenSCAD is resolved strictly on the server via `resolve_openscad_binary()`:
     1. Server-side constructor config (`KaiCadMcpService(..., openscad_bin=...)`, internal Python callers only).
     2. `OPENSCAD_BIN` environment variable (authoritative when set: if missing/invalid, fails cleanly with `OPENSCAD_UNAVAILABLE` without falling back to unconfigured binaries).
     3. Safe system auto-detection (`PATH` + standard OS install locations).
   - Preserves `shell=False`, argument-list invocation, `stdin=subprocess.DEVNULL`, and bounded timeouts (`1..600` seconds).

---

## 3. Task B — Persisted Lifecycle Audit-Chain Validation

`DesignRecord.from_persisted()` in `kai_cad/lifecycle.py` now validates the entire persisted audit history as a complete cryptographic-grade state chain rather than checking events in isolation:

1. **Exact Event Structure:** Every event must be a mapping with exact keys `{"from_state", "to_state", "timestamp_utc", "note"}` and string values.
2. **Timezone-Aware UTC Timestamps:** Every `timestamp_utc` must parse via ISO-8601 and carry an explicit `00:00` UTC offset (`tzinfo is not None` and `utcoffset() == 0`).
3. **Transition Legality:** Every event's `from_state -> to_state` must satisfy `can_transition()` against `VALID_TRANSITIONS`.
4. **Initial State Consistency:**
   - Empty `history` (`[]`) is accepted **only** when `record.state == "Draft"`.
   - Non-empty `history` must begin at `events[0].from_state == "Draft"`.
5. **Contiguous Chain & Final State Match:**
   - Every event `i >= 1` must satisfy `events[i].from_state == events[i - 1].to_state`.
   - The final event must satisfy `events[-1].to_state == record.state`.
6. **Zero Silent Repair:** Tampered, disconnected, or truncated histories raise `ValueError`, surfaced by `FileDesignRepository` as `CorruptedRecordError` (`CORRUPTED_RECORD` over MCP) while `cad_list_designs` skips unreadable records safely without crashing healthy designs.

---

## 4. Known Limitations

- **Single Component Type:** Only `custom_adapter` is supported in Phase 2.1.
- **Manual TinkerCAD Import:** `.stl` files are exported locally inside the workspace for manual upload into TinkerCAD; automated browser/API import and Khai Space Hub synchronization remain future phases.
- **Hermes Gateway Connection Deferred:** Hermes MCP configuration is prepared and verified against Hermes `v0.21.5`, while live production gateway wiring remains intentionally untouched until owner approval.
