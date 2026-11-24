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
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/hose_reducer_25_to_19.scad
```

### 3. Generate `.scad` and export `.stl` (when OpenSCAD CLI is installed)
```bash
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/hose_reducer_25_to_19.scad \
  --stl build/hose_reducer_25_to_19.stl
```

## Module Layout

- `kai_cad/generators/` — Parametric component generators (`custom_adapter.py`)
- `kai_cad/geometry/` — Deterministic 2D/3D geometry math & formatting primitives
- `kai_cad/validators/` — Strict schema & geometric feasibility validation (never silently mutates user dimensions)
- `kai_cad/exporters/` — `.scad` file writer and optional OpenSCAD CLI STL exporter
- `kai_cad/lifecycle.py` — 6-state design lifecycle (`Draft -> Generated -> Validated -> Exported -> Imported -> Completed`)
- `kai_cad/mcp_interface.py` — Typed protocol and local reference adapter for future KAI CAD MCP integration
- `kai_cad/tests/` — Automated `unittest` suite (runs without OpenSCAD installed)

## Running Tests

```bash
python -m unittest discover -s kai_cad/tests -v
```

## Architecture & Specifications

- [ARCHITECTURE.md](../docs/kai-cad-studio/ARCHITECTURE.md)
- [PHASE_0_SPECIFICATION.md](../docs/kai-cad-studio/PHASE_0_SPECIFICATION.md)
- [PHASE_1_CAD_ENGINE.md](../docs/kai-cad-studio/PHASE_1_CAD_ENGINE.md)
