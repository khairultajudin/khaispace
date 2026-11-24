# KAI CAD Studio — Phase 2: Live MCP Server Integration

**Phase:** Phase 2 — Live STDIO MCP Server & Local Persistence  
**Status:** Implemented & Verified (Hermes connection configuration prepared, not yet connected)  
**MCP SDK:** Official Python MCP SDK (`mcp>=1.9.0,<2.0`, verified with `mcp 1.30.0`)  
**Transport:** STDIO (`stdout` reserved exclusively for MCP JSON-RPC; diagnostics/logs on `stderr` only)

---

## 1. Scope & Distinction of Current Status

| Layer | Status | Notes |
| :--- | :--- | :--- |
| **KAI CAD MCP Server (`kai_cad/mcp_server.py`)** | **Implemented & Tested** | Real STDIO MCP server verified end-to-end with `mcp.ClientSession` + `stdio_client`, including server restart persistence and live OpenSCAD STL export. |
| **Hermes Integration Configuration** | **Prepared (Not Yet Connected)** | Configuration and CLI commands verified against installed Hermes Agent `v0.21.5+5778.g0a374d1`. User's `~/.hermes/config.yaml` has **not** been modified. |
| **Khai Space Hub Integration** | **Future Phase (Out of Scope)** | No Hub frontend, database schema, or synchronization changes were made in Phase 2. |

---

## 2. Architecture

```text
Khai / User
    |
    v
KAI (Hermes Agent)
    |
    v
MCP Client (STDIO JSON-RPC)
    |  stdout = MCP frames only | stderr = diagnostics/logs
    v
kai_cad/mcp_server.py (FastMCP thin transport wrapper)
    |
    v
kai_cad/mcp_service.py (KaiCadMcpService — 6 CAD tools)
    |
    +---> kai_cad/storage/repository.py (FileDesignRepository — workspace-scoped persistence)
    |
    +---> Existing Phase 1/1.1 Engine (zero duplicated geometry/validation/lifecycle logic)
            - kai_cad/generators/custom_adapter.py
            - kai_cad/validators/adapter_validator.py
            - kai_cad/lifecycle.py
            - kai_cad/exporters/openscad_exporter.py -> OpenSCAD CLI -> .stl
```

---

## 3. Exposed MCP Tools (6 Tools)

All tools return structured JSON envelopes containing `"ok": true | false`, `"tool": "<name>"`, and machine-readable `"error": {"code", "message"}` on failure.

| Tool Name | Inputs | Behavior & Lifecycle Effect |
| :--- | :--- | :--- |
| `cad_generate_design` | `component_type` (`"custom_adapter"`), `spec` (object, mm), `design_id?`, `output_name?` | Validates component & spec via existing engine, writes `spec.json` + `.scad`, persists `record.json` in `Generated` state. Fails without creating a record on invalid input. |
| `cad_validate_design` | `design_id` | Loads persisted `spec.json` and verifies `.scad` presence; runs existing validator. Advances `Generated -> Validated` on success. Never exports STL automatically. |
| `cad_export_stl` | `design_id`, `openscad_bin?`, `timeout_seconds?` (`1..600`, default `120`) | Requires `Validated` state (`can_transition(..., Exported)`). Runs existing OpenSCAD exporter. Advances `Validated -> Exported` only if a non-empty STL file is produced. |
| `cad_get_design` | `design_id` | Returns `design_id`, `component_type`, `state`, `spec_sha256`, `scad_sha256`, paths, UTC timestamps, immutable audit `history`, and artifact availability (`spec_json`, `scad`, `stl`). |
| `cad_list_designs` | `component_type?`, `state?`, `limit?` (`1..500`, default `50`) | Lists persisted designs sorted by `updated_at_utc` descending with artifact presence summaries. Skips corrupted directories safely without crashing. |
| `cad_get_design_artifact` | `design_id`, `artifact_type` (`"spec_json" \| "scad" \| "stl"`), `include_content?` (`false`) | Returns metadata (`path`, `exists`, `size_bytes`, `sha256`, `mime_type`). Optional UTF-8 text content is allowed for `spec_json`/`scad` up to `256 KiB` (`262,144` bytes). Binary `stl` text content is refused (`BINARY_ARTIFACT_CONTENT_NOT_SUPPORTED`). |

---

## 4. Persistence & Workspace Layout

`FileDesignRepository` (`kai_cad/storage/repository.py`) persists all designs atomically under a configurable workspace root (`--workspace`, `KAI_CAD_WORKSPACE`, or `./.kai_cad_workspace`):

```text
<workspace_root>/
  designs/
    <design_id>/
      record.json        # schema_version, DesignRecord (state + UTC audit history), hashes, timestamps
      spec.json          # canonical JSON specification (mm)
      <output_name>.scad # deterministic OpenSCAD source
      <output_name>.stl  # exported STL mesh (after cad_export_stl)
```

- **Restart survival:** Persisted records rehydrate via `DesignRecord.from_persisted()`, preserving the immutable read-only `history` tuple and validating all states and UTC timestamps.
- **Corruption resilience:** Malformed `record.json` or `spec.json` returns `CORRUPTED_RECORD` cleanly without crashing the MCP server or corrupting other designs.

---

## 5. Security Boundaries

- **Strict identifier regex:** `design_id` and `output_name` must match `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` (blocks `..`, `/`, `\`, spaces, hidden names).
- **Workspace containment:** Every read/write path is resolved and verified with `ensure_within_workspace()`.
- **No arbitrary execution:** Only the six CAD tools are exposed; no shell, Python, or arbitrary filesystem tools exist. Subprocess calls to OpenSCAD use argument lists (`shell=False`), `stdin=subprocess.DEVNULL`, and bounded timeouts (`1..600s`).
- **Clean STDIO & secret hygiene:** Zero startup banners or logs on `stdout`; `stderr` logging emits no environment tokens or secrets.

---

## 6. Startup & Shutdown

### Install optional MCP dependency
```bash
pip install "mcp>=1.9.0,<2.0"
# or editable from kai_cad/
pip install -e "./kai_cad[mcp]"
```

### Run STDIO MCP Server
```bash
# Using Python module (recommended from repo root)
python -m kai_cad.mcp_server --workspace /path/to/kai_cad_workspace

# Or via console script after package install
kai-cad-mcp --workspace /path/to/kai_cad_workspace
```

Shutdown occurs cleanly when the MCP client closes `stdin` or sends `SIGINT` / `SIGTERM`.

---

## 7. Hermes Integration Guide (Prepared — Ready for Controlled Test)

Verified against locally installed **Hermes Agent `v0.21.5+5778.g0a374d1`** (WSL2, Python 3.14.7).  
Hermes reads MCP server definitions from `~/.hermes/config.yaml` under the `mcp_servers:` mapping.

> **Important:** Do **not** overwrite `~/.hermes/config.yaml` without backing it up first (`cp ~/.hermes/config.yaml ~/.hermes/config.yaml.bak`).

### Option A — Add via Hermes CLI (`hermes mcp add`)

If running Hermes in WSL2 against this repository at `/mnt/e/KhaiSpace` (ensure `mcp>=1.9.0,<2.0` is installed in the target Python interpreter):

```bash
hermes mcp add kai-cad-studio \
  --command python3 \
  --env KAI_CAD_WORKSPACE=/mnt/e/KhaiSpace/.kai_cad_workspace \
  --env PYTHONPATH=/mnt/e/KhaiSpace \
  --args -m kai_cad.mcp_server
```

### Option B — Manual `~/.hermes/config.yaml` Snippet

```yaml
mcp_servers:
  kai-cad-studio:
    command: python3
    args:
      - "-m"
      - "kai_cad.mcp_server"
    env:
      KAI_CAD_WORKSPACE: "/mnt/e/KhaiSpace/.kai_cad_workspace"
      PYTHONPATH: "/mnt/e/KhaiSpace"
    connect_timeout: 30
```

*(On native Windows, use `command: python` and Windows paths such as `E:\KhaiSpace` and `E:\KhaiSpace\.kai_cad_workspace`. If OpenSCAD is installed on Windows while Hermes runs in WSL2, pass `OPENSCAD_BIN=/mnt/c/Program Files/OpenSCAD/openscad.com` in `env` or pass `openscad_bin` per call.)*

### Verify Tool Discovery in Hermes

```bash
hermes mcp list
hermes mcp test kai-cad-studio
```

Confirm all six tools are discovered:
1. `cad_generate_design`
2. `cad_validate_design`
3. `cad_export_stl`
4. `cad_get_design`
5. `cad_list_designs`
6. `cad_get_design_artifact`

### Simple End-to-End Test Prompt in Hermes (Once Connected)

1. Ask KAI/Hermes to call `cad_generate_design` with `component_type="custom_adapter"` and the parameters from `kai_cad/examples/custom_adapter.example.json`.
2. Ask KAI/Hermes to call `cad_validate_design` on the returned `design_id` and verify `state == "Validated"`.
3. Ask KAI/Hermes to call `cad_export_stl` (if OpenSCAD is available) and verify `state == "Exported"` and non-zero `stl_size_bytes`.
4. Ask KAI/Hermes to call `cad_get_design` and confirm the 3-step UTC audit history (`Generated -> Validated -> Exported`).

---

## 8. Known Limitations

- **Single Component Type:** Only `custom_adapter` is supported in Phase 2.
- **Local Single-Host Persistence:** `FileDesignRepository` uses atomic local JSON files; concurrent multi-process writes to the same `design_id` are not lock-coordinated.
- **No Remote/HTTP Transport:** Only STDIO transport is implemented in Phase 2 (no SSE/Streamable HTTP server).
- **Hermes Live Test Pending:** Server-side STDIO protocol tests passed using the official `mcp.ClientSession` client, while live Hermes gateway connection remains intentionally deferred for a controlled owner test.
