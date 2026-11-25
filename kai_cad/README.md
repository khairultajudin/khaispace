# KAI CAD Studio (`kai_cad`)

Deterministic, OpenSCAD-based parametric CAD engine inside the Khaispace monorepo.

- **Units:** Millimetres (`mm`) everywhere.
- **Runtime Dependencies:** Python 3.10+ standard library only (zero third-party Python packages required for validation and `.scad` generation).
- **Optional Export Dependency:** [OpenSCAD](https://openscad.org/) CLI for `.stl` mesh export. If OpenSCAD is not installed, `.scad` generation still succeeds and STL export reports the missing dependency clearly without creating a fake STL file.
- **Independent from TinkerCAD:** All source geometry is pure, reproducible OpenSCAD code generated from versioned JSON specifications.

## Quick Start

### 1. Validate a JSON configuration
```bash
python -m kai_cad custom-adapter --config kai_cad/examples/custom_adapter.example.json --validate-only
```

### 2. Generate an OpenSCAD (`.scad`) file
```bash
# Custom Adapter (legacy shortcut or generic subcommand)
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/hose_reducer_25_to_19.scad

# Generic component dispatcher (custom_adapter | rectangular_block | mounting_bracket | spacer_bushing | enclosure_base | enclosure_lid)
python -m kai_cad generate --type enclosure_base \
  --config kai_cad/examples/enclosure_base_electronics.example.json \
  --output build/enclosure_base.scad
```

### 3. Generate `.scad` and export `.stl` (when OpenSCAD CLI is installed)
```bash
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/hose_reducer_25_to_19.scad \
  --stl build/hose_reducer_25_to_19.stl
```

## Key Guarantees (Phase 1.1 & Phase 2.1 Hardened)

- **Artifact Roles for TinkerCAD Workflow:** `.json` (`spec.json`) and `.scad` are preserved as the canonical parametric source of truth, while `.stl` serves as the triangulated mesh exchange artifact for manual import into [TinkerCAD](https://www.tinkercad.com/). Importing `.stl` into TinkerCAD does not restore parametric OpenSCAD primitives or construction history, so `.json` and `.scad` remain preserved for future editing and regeneration.
- **MCP Executable Lockdown:** `cad_export_stl` never exposes `openscad_bin` to MCP clients (`"additionalProperties": false` enforced across all tools). OpenSCAD is resolved strictly server-side via `OPENSCAD_BIN` or safe auto-detection.
- **Lifecycle Audit Integrity:** `DesignRecord.history` is a read-only `tuple` of frozen `LifecycleEvent` entries with UTC timestamps, and `DesignRecord.from_persisted()` validates the entire contiguous `Draft -> ... -> current_state` chain on reload without silent repair.
- **Clearance Semantics:** Global `clearance_mm` remains backward-compatible across all 5 surfaces. Optional per-interface radial overrides (`body_clearance_mm`, `end_a_clearance_mm`, `end_b_clearance_mm`, `bore_a_clearance_mm`, `bore_b_clearance_mm`) take precedence over `clearance_mm` for their specific surface without ever mutating nominal dimensions.
- **Geometry Validation:** Enforces finite millimetre inputs, `0.0001 mm` minimum feature resolution, nominal and effective bore-vs-OD wall checks, chamfer bounds, and a 2D closed-polygon integrity check (positive CCW area, no duplicate vertices, no self-intersections) before emitting OpenSCAD source.

## Module Layout

- `kai_cad/generators/` — Parametric component generators (`custom_adapter.py`)
- `kai_cad/geometry/` — Deterministic 2D/3D geometry math, polygon integrity checks & formatting primitives
- `kai_cad/validators/` — Strict schema & geometric feasibility validation (never silently mutates user dimensions)
- `kai_cad/exporters/` — `.scad` file writer and optional OpenSCAD CLI STL exporter
- `kai_cad/lifecycle.py` — 6-state design lifecycle (`Draft -> Generated -> Validated -> Exported -> Imported -> Completed`) with immutable audit history
- `kai_cad/mcp_interface.py` — Typed protocol and local reference adapter for future KAI CAD MCP integration
- `kai_cad/tests/` — Automated `unittest` suite (runs without OpenSCAD installed)

## Running Tests

```bash
python -m unittest discover -s kai_cad/tests -v
```

## Live STDIO MCP Server & Hermes Integration (Phase 2 & Phase 3)

Install the optional official Python MCP SDK (`mcp>=1.9.0,<3.0`, compatible with both v1.x `FastMCP` and v2.x `MCPServer`) and launch the STDIO server:

```bash
pip install "mcp>=1.9.0,<3.0"
python -m kai_cad.mcp_server --workspace ./kai_cad/.workspace
```

Exposed MCP tools: `cad_generate_design`, `cad_validate_design`, `cad_export_stl`, `cad_get_design`, `cad_list_designs`, `cad_get_design_artifact`.

## Architecture & Specifications

- [ARCHITECTURE.md](../docs/kai-cad-studio/ARCHITECTURE.md)
- [PHASE_0_SPECIFICATION.md](../docs/kai-cad-studio/PHASE_0_SPECIFICATION.md)
- [PHASE_1_CAD_ENGINE.md](../docs/kai-cad-studio/PHASE_1_CAD_ENGINE.md)
- [PHASE_2_MCP_SERVER.md](../docs/kai-cad-studio/PHASE_2_MCP_SERVER.md)
- [PHASE_2_1_HARDENING.md](../docs/kai-cad-studio/PHASE_2_1_HARDENING.md)
- [PHASE_3_HERMES_INTEGRATION.md](../docs/kai-cad-studio/PHASE_3_HERMES_INTEGRATION.md)
- [PHASE_4_COMPONENT_LIBRARY.md](../docs/kai-cad-studio/PHASE_4_COMPONENT_LIBRARY.md)
- [PHASE_4_BATCH_2_ENCLOSURE.md](../docs/kai-cad-studio/PHASE_4_BATCH_2_ENCLOSURE.md)
