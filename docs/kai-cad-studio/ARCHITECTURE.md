# KAI CAD Studio — System Architecture

**Module:** `kai_cad/` (inside `khairultajudin/khaispace` monorepo)  
**Scope:** Phase 0 (Architecture), Phase 1/1.1 (Parametric CAD Engine & Hardening), Phase 2 (Live STDIO MCP Server), and Phase 2.1 (Security & Audit-Chain Hardening)  
**Primary CAD Kernel Target:** OpenSCAD (`.scad` canonical source + `.stl` mesh exchange for [TinkerCAD](https://www.tinkercad.com/))  
**Unit System:** Millimetres (`mm`) exclusively

---

## 1. Architectural Goals & Principles

1. **Monorepo Native, Zero Disruption:** `kai_cad` lives beside `kai_orchestration/` and `apps/hub/` in `khaispace`, adopting the repository's existing Python 3.12 stdlib-first and `unittest` conventions without touching unrelated modules.
2. **Source-of-Truth Reproducibility & TinkerCAD Artifact Roles:**
   - **`.json` (`spec.json`):** Canonical design parameters and nominal dimensions.
   - **`.scad`:** Canonical, editable parametric OpenSCAD source of truth (deterministic SHA-256).
   - **`.stl`:** Watertight mesh exchange format intended for manual import into [TinkerCAD](https://www.tinkercad.com/). Importing `.stl` into TinkerCAD creates an imported mesh object and does **not** restore OpenSCAD parametric primitives or construction history — therefore `.json` and `.scad` are always preserved alongside `.stl` for future parametric edits.
3. **Zero Silent Dimension Mutation:** Validators check both nominal and clearance-adjusted effective geometry before any `.scad` code is generated. Impossible, sub-resolution, or unsafe geometry is rejected with structured error codes — never silently clamped or adjusted.
4. **Independence from TinkerCAD Automation:** Geometry generation depends strictly on deterministic Python math and OpenSCAD syntax. No proprietary cloud CAD or TinkerCAD browser automation is coupled into the engine.
5. **Server-Controlled Optional Binary Dependencies:** `.scad` generation requires zero third-party packages or external binaries. `.stl` export delegates to the server-configured OpenSCAD CLI (`OPENSCAD_BIN` or safe system auto-detection; MCP clients cannot select an executable path). If unavailable, it reports the missing dependency explicitly and never creates an empty or placeholder STL file.

---

## 2. Layered Module Architecture

```text
+-------------------------------------------------------------------+
|  Entrypoints & Future Integrations                                |
|  - CLI: kai_cad/cli.py (`python -m kai_cad`)                      |
|  - Future MCP Server: implements kai_cad/mcp_interface.py         |
|  - Orchestration Bridge: kai_orchestration/agy_bridge.py (read)   |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|  Lifecycle & Audit Integrity (`kai_cad/lifecycle.py`)             |
|  Draft -> Generated -> Validated -> Exported -> Imported ->       |
|  Completed  (read-only tuple audit history + Hub status mapping)  |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|  Parametric Generators (`kai_cad/generators/`)                    |
|  - custom_adapter.py: CustomAdapterSpec -> CustomAdapterResult    |
+------------------+---------------------------------+--------------+
                   |                                 |
                   v                                 v
+------------------------------------+  +---------------------------+
|  Validators (`kai_cad/validators/`) |  | Geometry (`kai_cad/       |
|  - errors.py (structured issues)   |  |   geometry/primitives.py) |
|  - adapter_validator.py            |  | - format_mm()             |
|    (schema + nominal + effective   |  | - clearance resolution    |
|     wall/shoulder/chamfer + 2D     |  | - 2D revolution profile   |
|     polygon integrity checks)      |  | - validate_profile_polygon|
+------------------------------------+  +-------------+-------------+
                                                      |
                                                      v
+-------------------------------------------------------------------+
|  Exporters (`kai_cad/exporters/openscad_exporter.py`)             |
|  - write_scad_file()      -> UTF-8 LF .scad                       |
|  - export_stl_with_openscad() -> optional OpenSCAD CLI -> .stl    |
+-------------------------------------------------------------------+
```

---

## 3. Repository Alignment (`kai_orchestration` Integration)

Inspection of `kai_orchestration/agy_bridge.py`, `kai_orchestration/lifecycle.py`, and `kai_orchestration/tests/test_phase3.py` established the following Khaispace Python conventions that `kai_cad` follows:

| Convention | Observed in `kai_orchestration` | Applied in `kai_cad` |
| :--- | :--- | :--- |
| Python runtime | Python 3.12 (`from __future__ import annotations`, full typing) | Python 3.10+ compatible, full type annotations |
| Runtime dependencies | Pure standard library (`json`, `dataclasses`, `enum`, `subprocess`, `pathlib`) | Pure standard library (zero pip dependencies) |
| Lifecycle modeling | `Enum(str, Enum)` + `VALID_TRANSITIONS` + `can_transition()` + `HUB_STATUS_MAP` | `DesignState(str, Enum)` + `VALID_TRANSITIONS` + `can_transition()` + `HUB_STATUS_MAP` |
| Subprocess safety | `stdin=subprocess.DEVNULL`, explicit timeouts, injectable `runner` for unit tests | Same pattern in `export_stl_with_openscad(..., runner=subprocess.run)` |
| Test runner | `python -m unittest discover -s <pkg>/tests -v` | `python -m unittest discover -s kai_cad/tests -v` |

`kai_cad` does **not** import or modify `kai_orchestration` in Phase 0/1/1.1 so both packages remain cleanly decoupled.

---

## 4. Design Lifecycle & Audit Guarantees

Defined in `kai_cad/lifecycle.py`:

| State | Meaning | Hub `task_status` Mapping | Allowed Next States |
| :--- | :--- | :--- | :--- |
| `Draft` | Specification created or edited, not yet generated | `Pending` | `Generated` |
| `Generated` | Deterministic `.scad` source rendered from JSON spec | `In Progress` | `Validated`, `Draft` |
| `Validated` | All dimensional, bore, shoulder, clearance, chamfer & polygon checks passed | `In Progress` | `Exported`, `Draft` |
| `Exported` | Mesh exported (e.g. `.stl` via OpenSCAD CLI) | `In Progress` | `Imported`, `Completed`, `Draft` |
| `Imported` | Exported artifact imported into downstream slicer / CAM / review tool | `In Progress` | `Completed`, `Draft` |
| `Completed` | Final verified design archived | `Completed` | *(terminal)* |

### Audit Protection Guarantees (Phase 1.1 & Phase 2.1)
- `DesignRecord._history` is private (`init=False`) and cannot be injected via the constructor.
- `DesignRecord.history` is a read-only `@property` returning an immutable `Tuple[LifecycleEvent, ...]`.
- Each `LifecycleEvent` is `@dataclass(frozen=True)` with a timezone-aware UTC ISO-8601 timestamp (`timezone.utc`).
- Invalid or non-`DesignState` transitions raise `ValueError` without mutating `state` or `_history`.
- Every valid transition appends exactly one `LifecycleEvent`.
- `DesignRecord.from_persisted()` validates the complete persisted event chain on reload: exact event fields, UTC offsets, `VALID_TRANSITIONS` legality, empty history allowed strictly for `Draft`, contiguous `Draft -> ... -> current_state` chain, and zero silent repair of tampered histories.

---

## 5. Technical Decisions & Dependencies

### Dependencies
- **Required Runtime:** Python >= 3.10 (standard library only).
- **Optional Export Binary:** OpenSCAD CLI (`openscad.com` / `openscad.exe` on Windows, `openscad` on POSIX, configurable via `OPENSCAD_BIN` or `--openscad-bin`).
- **Build Metadata:** `kai_cad/pyproject.toml` (`setuptools>=68.0`, exposing console script `kai-cad`).

### Key Technical Decisions
1. **`rotate_extrude` Single-Polygon Profile + Polygon Integrity Verification:**
   - Stepped cylindrical adapters are axisymmetric solids. Generating a single closed 2D `(r, z)` polygon revolved via `rotate_extrude(angle = 360, convexity = 10, $fn = fn)` avoids OpenSCAD boolean coplanar z-fighting and guarantees a watertight manifold solid.
   - `validate_profile_polygon()` verifies strictly positive CCW shoelace area, `r >= 0`, `z >= 0`, non-zero edge lengths, and zero non-adjacent segment self-intersections before any `.scad` file is emitted.
2. **Global + Per-Interface Radial Clearance Precedence:**
   - Global `clearance_mm` remains 100% backward-compatible (applies to all 5 surfaces when per-interface overrides are omitted).
   - Optional per-interface overrides (`body_clearance_mm`, `end_a_clearance_mm`, `end_b_clearance_mm`, `bore_a_clearance_mm`, `bore_b_clearance_mm`) allow tuning individual mating interfaces (for example, keeping `body_clearance_mm = 0.0` while giving `end_a` and `end_b` slip-fit clearance).
3. **Future MCP Readiness Without Premature Runtime Coupling:**
   - `kai_cad/mcp_interface.py` defines `KaiCadMcpProvider` (`typing.Protocol`), `McpToolResponse`, and `LocalKaiCadMcpAdapter` using only stdlib types so Phase 2+ can bind a live MCP server transport (`stdio` / `SSE`) with zero engine refactoring.
