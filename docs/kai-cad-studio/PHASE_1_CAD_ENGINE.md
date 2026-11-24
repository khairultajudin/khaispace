# KAI CAD Studio — Phase 1 Parametric CAD Engine (Custom Adapter)

**Phase:** Phase 1 — Parametric CAD Engine  
**Initial Component:** `Custom Adapter` (`kai_cad/generators/custom_adapter.py`)  
**Status:** Implemented

---

## 1. Component Geometry Overview

The Custom Adapter is a stepped cylindrical coupling aligned along the positive Z-axis from `z = 0` to `z = overall_length_mm`:

```text
         z = L  +----- [End B outer + chamfer] -----+
                |  End B (L_b, OD = end_b_diameter) |  <-- bore_b_diameter
         z = z2 +--------+                 +--------+
                         |                 |
                |  Body (L_body, OD = body_diameter)|  <-- bore transition at z_mid
                         |                 |
         z = z1 +--------+                 +--------+
                |  End A (L_a, OD = end_a_diameter) |  <-- bore_a_diameter
         z = 0  +----- [End A outer + chamfer] -----+
```

- **Central body length:** `body_length_mm = overall_length_mm - (end_a_length_mm + end_b_length_mm)`
- **Bore transition plane:** `z_mid = end_a_length_mm + (body_length_mm / 2)`
  - When `bore_a_diameter_mm == bore_b_diameter_mm > 0`, the bore forms a continuous through-hole.
  - When `bore_a_diameter_mm != bore_b_diameter_mm`, the bore steps cleanly at `z_mid`.
  - Setting either bore to `0` produces a blind bore (or a solid cylinder if both are `0`).
- **Chamfers:** 45-degree external chamfers (`chamfer_mm`) applied to the bottom face (`z = 0`) of End A and the top face (`z = L`) of End B.

---

## 2. JSON Input Schema (All Dimensions in Millimetres)

| Field | Type | Required | Default | Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `overall_length_mm` | number | Yes | — | `> 0`, strictly `> end_a_length_mm + end_b_length_mm` |
| `body_diameter_mm` | number | Yes | — | `> 0` |
| `end_a_diameter_mm` | number | Yes | — | `> 0` |
| `end_b_diameter_mm` | number | Yes | — | `> 0` |
| `end_a_length_mm` | number | Yes | — | `> 0` |
| `end_b_length_mm` | number | Yes | — | `> 0` |
| `bore_a_diameter_mm` | number | Yes | — | `>= 0`; if `> 0`, strictly `< end_a_diameter_mm` and `< body_diameter_mm` |
| `bore_b_diameter_mm` | number | Yes | — | `>= 0`; if `> 0`, strictly `< end_b_diameter_mm` and `< body_diameter_mm` |
| `chamfer_mm` | number | No | `0.0` | `>= 0`; `< end_a_length_mm`, `< end_b_length_mm`, and `< radial wall` on both ends |
| `clearance_mm` | number | No | `0.0` | `>= 0`; radial clearance per surface (must not collapse effective OD or breach bore) |
| `name` | string | No | `"custom_adapter"` | Non-empty string |
| `description` | string | No | `"Parametric stepped cylindrical adapter"` | Free text (sanitized for single-line SCAD comments) |
| `units` | string | No | `"mm"` | Must equal `"mm"` |
| `fn` | integer | No | `96` | Integer in `[16, 720]` |

Example configuration: [`kai_cad/examples/custom_adapter.example.json`](../../kai_cad/examples/custom_adapter.example.json).

---

## 3. Manufacturing Clearance Semantics

KAI CAD Studio **never silently modifies user-specified dimensions**:

- All nominal values from JSON are stored verbatim on `CustomAdapterSpec` and emitted verbatim at the top of the `.scad` file.
- `clearance_mm` is applied transparently as a **radial clearance per mating surface**:
  - `effective_od = nominal_od - (2 * clearance_mm)`
  - `effective_bore = nominal_bore + (2 * clearance_mm)` (when `nominal_bore > 0`, else `0`)
- Both nominal and effective dimensions are validated before generation. If `clearance_mm` causes any effective diameter to become `<= 0` or any effective bore to meet/exceed an effective outer diameter, generation fails with a structured `GeometryValidationError`.

---

## 4. Validation Rules & Error Codes

Implemented in `kai_cad/validators/adapter_validator.py`:

- `MISSING_PARAMETER` — Required field omitted or `null`.
- `UNKNOWN_PARAMETER` — Unrecognized key in JSON payload.
- `INVALID_UNITS` — Units other than `"mm"`.
- `INVALID_TYPE` / `INVALID_NUMBER` — Non-numeric, boolean, `NaN`, or infinite values.
- `NON_POSITIVE_DIMENSION` / `NEGATIVE_DIMENSION` — Out-of-domain numeric value.
- `INVALID_FACET_COUNT` — `fn` outside `[16, 720]` or non-integer.
- `INVALID_SHOULDER_CONFIGURATION` — `end_a_length_mm + end_b_length_mm >= overall_length_mm`.
- `BORE_EXCEEDS_OUTER_DIAMETER` / `BORE_EXCEEDS_BODY_DIAMETER` — Nominal bore breaches outer wall.
- `CLEARANCE_COLLAPSES_DIAMETER` — Radial clearance collapses outer diameter to `<= 0`.
- `EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER` / `EFFECTIVE_BORE_EXCEEDS_BODY_DIAMETER` — Effective bore breaches outer wall after clearance.
- `CHAMFER_EXCEEDS_SHOULDER_LENGTH` / `CHAMFER_EXCEEDS_WALL_THICKNESS` — Chamfer exceeds shoulder length or end radial wall thickness.

---

## 5. CLI Usage & STL Export Behavior

```bash
# Validate only
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --validate-only

# Generate .scad source
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/adapter.scad

# Generate .scad and export .stl (requires OpenSCAD CLI)
python -m kai_cad custom-adapter \
  --config kai_cad/examples/custom_adapter.example.json \
  --output build/adapter.scad \
  --stl build/adapter.stl
```

### Exit Codes
- `0` — Success (validation passed, `.scad` written, and `.stl` exported if requested).
- `1` — Configuration file not found or geometry validation failed.
- `2` — Invalid CLI arguments (e.g., missing `--output` without `--validate-only`, or `--validate-only` combined with `--stl`).
- `3` — `.scad` was generated, but requested `--stl` export failed (e.g., OpenSCAD CLI not installed or returned a non-zero exit code). No fake or empty STL is created.
