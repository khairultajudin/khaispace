# KAI CAD Studio — Phase 3: Hermes MCP Integration

**Phase:** Phase 3 — Live Hermes Agent MCP Integration  
**Status:** Implemented & Live-Verified with Hermes Agent  
**Verified Hermes Version:** `Hermes Agent v0.21.5+5778.g0a374d1 (2026.9.24)`  
**Transport:** STDIO (`stdout` reserved exclusively for MCP JSON-RPC; diagnostics on `stderr`)

---

## 1. End-to-End Architecture

```text
User -> Telegram / Hermes CLI -> KAI (Hermes Agent v0.21.5)
    |
    v  MCP over STDIO (configured in ~/.hermes/config.yaml)
KAI CAD MCP Server (kai_cad.mcp_server, Python 3.14 + mcp 2.0.0)
    |
    v  Server-controlled OPENSCAD_BIN (WSL2 -> Win32 path translation)
OpenSCAD CLI (openscad.com 2021.01)
    |
    v  Persistent Workspace (/mnt/e/KhaiSpace/kai_cad/.workspace)
spec.json + <name>.scad (canonical parametric source) + <name>.stl (TinkerCAD mesh)
```

- **Canonical Parametric Source (`.json` + `.scad`):** Preserved inside `<workspace>/designs/<design_id>/` as the editable source of truth.
- **TinkerCAD Exchange Mesh (`.stl`):** Watertight triangulated mesh ready for manual import into [TinkerCAD](https://www.tinkercad.com/). Importing `.stl` into TinkerCAD transfers mesh geometry only and does **not** restore OpenSCAD parametric construction history.

---

## 2. Verified Environment & Dependencies

| Component | Verified Value |
| :--- | :--- |
| **Hermes Agent** | `v0.21.5+5778.g0a374d1 (2026.9.24)` (WSL2 Linux) |
| **MCP Server Python** | `/home/user/.hermes/hermes-agent/.venv/bin/python` (`Python 3.14.7`, `mcp 2.0.0`) |
| **Windows Dev/Test Python** | `Python 3.12.10` (`mcp 1.30.0`) — `kai_cad.mcp_server` supports `mcp>=1.9.0,<3.0` (`FastMCP` v1.x and `MCPServer` v2.x) |
| **Authoritative OpenSCAD** | `OPENSCAD_BIN=/mnt/c/Program Files/OpenSCAD/openscad.com` (`OpenSCAD version 2021.01`) |
| **Persistent Workspace** | `/mnt/e/KhaiSpace/kai_cad/.workspace` (`E:\KhaiSpace\kai_cad\.workspace` on Windows, gitignored via `kai_cad/.gitignore`) |

---

## 3. Hermes MCP Configuration

### Backup Created Before Editing
Before adding `kai-cad-studio`, the existing Hermes configuration was backed up with `0600` permissions (preserving all Telegram, gateway, provider, model, toolset, skill, and allowlist settings):
```bash
~/.hermes/config.yaml.bak.pre-kai-cad-phase3
```

### Verified Registration Command (`hermes mcp add`)
```bash
hermes mcp add kai-cad-studio \
  --command /home/user/.hermes/hermes-agent/.venv/bin/python \
  --env PYTHONPATH=/mnt/e/KhaiSpace \
  --env "OPENSCAD_BIN=/mnt/c/Program Files/OpenSCAD/openscad.com" \
  --connect-timeout 30 \
  --args -m kai_cad.mcp_server --workspace /mnt/e/KhaiSpace/kai_cad/.workspace
```

### Resulting `mcp_servers` Configuration Block in `~/.hermes/config.yaml`
```yaml
mcp_servers:
  kai-cad-studio:
    command: /home/user/.hermes/hermes-agent/.venv/bin/python
    args:
      - -m
      - kai_cad.mcp_server
      - --workspace
      - /mnt/e/KhaiSpace/kai_cad/.workspace
    env:
      PYTHONPATH: /mnt/e/KhaiSpace
      OPENSCAD_BIN: /mnt/c/Program Files/OpenSCAD/openscad.com
    connect_timeout: 30
```

> **Security Note:** `OPENSCAD_BIN` is configured strictly server-side in `env`. `cad_export_stl` exposes no executable-path parameter to MCP clients, and all six tools enforce `"additionalProperties": false`. When WSL2 invokes Win32 `openscad.com`, `kai_cad/exporters/openscad_exporter.py` deterministically translates `/mnt/<drive>/...` paths to `<DRIVE>:\...` without shell execution (`shell=False`).

---

## 4. Six-Tool Discovery & Live End-to-End Verification

### Tool Discovery (`hermes mcp add` / `hermes mcp list` / `hermes mcp test kai-cad-studio`)
Hermes connected over STDIO and discovered all **6/6 tools** cleanly:
1. `cad_generate_design`
2. `cad_validate_design`
3. `cad_export_stl`
4. `cad_get_design`
5. `cad_list_designs`
6. `cad_get_design_artifact`

### Live Hermes Agent End-to-End Workflow (`phase3-hermes-e2e-01`)
Executed through standalone `hermes chat --oneshot` sessions (without restarting or disrupting the running production gateway):

1. **Session 1 (Full 6-Tool Execution):**
   - Test geometry: `custom_adapter` (`30.0 mm` overall length, `20.0 mm` body OD, `16.0 mm` / `14.0 mm` ends, `10.0 mm` shoulders, `10.0 mm` / `8.0 mm` bores, `0.5 mm` chamfer, `0.1 mm` clearance).
   - Hermes invoked in sequence: `cad_generate_design` -> `cad_validate_design` -> `cad_export_stl` -> `cad_get_design` -> `cad_get_design_artifact` (`stl`) -> `cad_list_designs`.
   - Final state: `Exported` (`Draft -> Generated -> Validated -> Exported`).
   - Artifacts persisted at `/mnt/e/KhaiSpace/kai_cad/.workspace/designs/phase3-hermes-e2e-01/`:
     - `spec.json` (`552` bytes, SHA-256 `291d94e00f15d93ce5f6a5efd8573780c26a8a4beee053c745bb4ac883e70953`)
     - `phase3_test_adapter.scad` (`3,907` bytes, SHA-256 `1bfd7a016f2abcef033105ad9faf08206e8739c0d4dc39bbdbadaba14ff7ca5d`)
     - `phase3_test_adapter.stl` (`400,385` bytes, SHA-256 `01e8e2ed96cd427c80417bc418d7a60ede93e73d04871d811ebe1ef79e877bdf`)
2. **Session 2 (Subprocess Restart Persistence):**
   - A fresh standalone `hermes chat --oneshot` process spawned a new `kai_cad.mcp_server` subprocess, invoked `cad_get_design` and `cad_list_designs`, and confirmed `phase3-hermes-e2e-01` remained in `Exported` state with all 3 UTC audit transitions and all 3 artifacts on disk.
3. **STL Viewer & TinkerCAD Mesh Compatibility (`trimesh` Verification):**
   - Loaded `phase3_test_adapter.stl` in `trimesh`: `2,304` faces, `1,152` vertices, `is_watertight=True`, `is_winding_consistent=True`, `is_volume=True`, volume `4,503.029 mm^3`, bounding box `[19.8, 19.8, 30.0] mm` (matching clearance-adjusted `19.8 mm` body OD and `30.0 mm` axial length).

---

## 5. Safe Disconnect / Disable & Backup Rollback Procedures

### Disable or Remove Only `kai-cad-studio` (Preserving All Other Settings)
```bash
hermes mcp remove kai-cad-studio
hermes mcp list
```
*(Hermes's live MCP reconciler detaches removed servers automatically without requiring a production gateway restart.)*

### Full Configuration Backup Restore (If Ever Needed)
```bash
cp -p ~/.hermes/config.yaml.bak.pre-kai-cad-phase3 ~/.hermes/config.yaml
chmod 600 ~/.hermes/config.yaml
```

---

## 6. Known Limitations
- **Component Coverage:** Phase 3 exposes the existing `custom_adapter` parametric generator; rectangular blocks, brackets, enclosures, and multi-part assemblies belong to future component-library expansion phases.
- **Manual TinkerCAD Import:** Generated `.stl` meshes at `E:\KhaiSpace\kai_cad\.workspace\designs\<design_id>\` are imported manually into TinkerCAD (no browser automation).
- **Hub Integration Deferred:** Khai Space Hub frontend/database synchronization is intentionally out of scope for Phase 3.

