# KAI CAD Studio — Phase 1 Parametric CAD Engine (Custom Adapter)

**Phase:** Phase 1 & Phase 1.1 Hardening — Parametric CAD Engine  
**Initial Component:** `Custom Adapter` (`kai_cad/generators/custom_adapter.py`)  
**Status:** Implemented & OpenSCAD-Verified

---

## 1. Component Geometry Overview

The Custom Adapter is an axisymmetric stepped cylindrical coupling aligned along the positive Z-axis from `z = 0` to `z = overall_length_mm`:

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
  - When `bore_a_diameter_mm == bore_b_diameter_mm > 0`, the bore forms a continuous through-hole with no internal step at `z_mid`.
  - When `bore_a_diameter_mm != bore_b_diameter_mm`, the inner bore steps horizontally at `z_mid`.
  - Setting one bore to `0` produces a blind bore terminating at `z_mid`; setting both to `0` produces a solid stepped cylinder (`r = 0` along the axis).
- **Chamfers:** 45-degree external chamfers (`chamfer_mm`) applied to the bottom face (`z = 0`) of End A and the top face (`z = L`) of End B.

---

## 2. JSON Input Schema (All Dimensions in Millimetres)

| Field | Type | Required | Default | Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `overall_length_mm` | number | Yes | — | `>= 1e-4`, strictly `> end_a_length_mm + end_b_length_mm` (body `>= 1e-4`) |
| `body_diameter_mm` | number | Yes | — | `>= 1e-4` |
| `end_a_diameter_mm` | number | Yes | — | `>= 1e-4` |
| `end_b_diameter_mm` | number | Yes | — | `>= 1e-4` |
| `end_a_length_mm` | number | Yes | — | `>= 1e-4` |
| `end_b_length_mm` | number | Yes | — | `>= 1e-4` |
| `bore_a_diameter_mm` | number | Yes | — | `0` or `>= 1e-4`; if `> 0`, strictly `< end_a_diameter_mm` and `< body_diameter_mm` |
| `bore_b_diameter_mm` | number | Yes | — | `0` or `>= 1e-4`; if `> 0`, strictly `< end_b_diameter_mm` and `< body_diameter_mm` |
| `chamfer_mm` | number | No | `0.0` | `0` or `>= 1e-4`; `< end_a_length_mm`, `< end_b_length_mm`, and `< radial wall` on both ends |
| `clearance_mm` | number | No | `0.0` | `>= 0`; global default radial clearance per surface |
| `body_clearance_mm` | number \| null | No | `null` | Optional `>= 0` radial clearance override for `body_diameter_mm` only |
| `end_a_clearance_mm` | number \| null | No | `null` | Optional `>= 0` radial clearance override for `end_a_diameter_mm` only |
| `end_b_clearance_mm` | number \| null | No | `null` | Optional `>= 0` radial clearance override for `end_b_diameter_mm` only |
| `bore_a_clearance_mm` | number \| null | No | `null` | Optional `>= 0` radial clearance override for `bore_a_diameter_mm` only (rejected if `> 0` when `bore_a_diameter_mm == 0`) |
| `bore_b_clearance_mm` | number \| null | No | `null` | Optional `>= 0` radial clearance override for `bore_b_diameter_mm` only (rejected if `> 0` when `bore_b_diameter_mm == 0`) |
| `name` | string | No | `"custom_adapter"` | Non-empty string |
| `description` | string | No | `"Parametric stepped cylindrical adapter"` | Free text (sanitized for single-line SCAD comments) |
| `units` | string | No | `"mm"` | Must equal `"mm"` |
| `fn` | integer | No | `96` | Integer in `[16, 720]` |

Example configuration: [`kai_cad/examples/custom_adapter.example.json`](../../kai_cad/examples/custom_adapter.example.json).

---

## 3. Clearance Semantics & Precedence Rules

KAI CAD Studio **never silently modifies or clamps user-specified dimensions**:

1. **Nominal Preservation:** All user-supplied nominal dimensions are stored verbatim on `CustomAdapterSpec` and emitted verbatim at the top of the `.scad` file.
2. **Backward-Compatible Global Default (`clearance_mm`):** When per-interface clearance fields are omitted or `null`, `clearance_mm` applies as radial clearance across all 5 cylindrical surfaces (`body`, `end_a`, `end_b`, `bore_a`, `bore_b`). Non-zero bores are enlarged by `2 * clearance_mm`; zero bores remain `0`.
3. **Explicit Per-Interface Overrides:** For each surface `s` in `{body, end_a, end_b, bore_a, bore_b}`:
   - `resolved_s_clearance = <s_clearance_mm> if provided (not null) else clearance_mm`
   - Outer surfaces: `effective_od = nominal_od - (2 * resolved_s_clearance)`
   - Non-zero bore surfaces: `effective_bore = nominal_bore + (2 * resolved_s_clearance)`
   - Passing `0.0` explicitly on a surface override (e.g. `body_clearance_mm: 0.0` with `clearance_mm: 0.15`) locks that surface to its exact nominal diameter while the remaining surfaces inherit `clearance_mm`.
   - Passing a positive explicit bore clearance (`bore_a_clearance_mm > 0` or `bore_b_clearance_mm > 0`) when that bore is `0` is rejected with `CLEARANCE_ON_ZERO_BORE` so explicit input is never silently ignored.
4. **Full Effective Validation:** All effective dimensions and resulting wall thicknesses and chamfer margins are validated before `.scad` generation.

---

## 4. Validation Rules & Geometry Guarantees

Implemented in `kai_cad/validators/adapter_validator.py` and `kai_cad/geometry/primitives.py`:

- **Schema & Type Checks:** `MISSING_PARAMETER`, `UNKNOWN_PARAMETER`, `INVALID_UNITS`, `INVALID_TYPE`, `INVALID_NUMBER` (rejects `bool`, `NaN`, `+/-inf`), `NON_POSITIVE_DIMENSION`, `NEGATIVE_DIMENSION`, `INVALID_FACET_COUNT`.
- **Geometric Resolution Floor (`MIN_FEATURE_EPSILON_MM = 0.0001 mm`):** Rejects sub-0.1 µm features, body lengths, wall thicknesses, or chamfer margins (`DEGENERATE_DIMENSION`, `DEGENERATE_BODY_LENGTH`, `DEGENERATE_WALL_THICKNESS`, `DEGENERATE_CHAMFER_MARGIN`) so `format_mm()` (6-decimal precision) can never silently round a non-zero feature to `0`.
- **Shoulder & Bore Feasibility:** `INVALID_SHOULDER_CONFIGURATION`, `BORE_EXCEEDS_OUTER_DIAMETER`, `BORE_EXCEEDS_BODY_DIAMETER`, `CLEARANCE_ON_ZERO_BORE`, `CLEARANCE_COLLAPSES_DIAMETER`, `EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER`, `EFFECTIVE_BORE_EXCEEDS_BODY_DIAMETER`, `CHAMFER_EXCEEDS_SHOULDER_LENGTH`, `CHAMFER_EXCEEDS_WALL_THICKNESS`.
- **2D Profile Polygon Integrity (`validate_profile_polygon`):** Verifies `>= 3` finite vertices, `r >= 0`, `z >= 0`, no consecutive duplicate vertices, strictly positive CCW shoelace area, and zero non-adjacent edge self-intersections (`DEGENERATE_PROFILE`).

> **Note:** Geometry validation guarantees a geometrically valid, closed 2D revolution profile for OpenSCAD `rotate_extrude`. It does **not** certify structural load capacity, pressure rating, material suitability, or manufacturing tolerances.

---

## 5. OpenSCAD CLI Verification Results

Verified locally against **OpenSCAD version 2021.01** (`openscad.com` CLI):

| Verification Case | Expected Outcome | Actual Verified Result |
| :--- | :--- | :--- |
| Example JSON (`custom_adapter.example.json`) | `.scad` + non-empty `.stl` | **PASS** — `398,221` bytes STL |
| Solid cylinder (`bore_a = 0`, `bore_b = 0`) | `.scad` + non-empty `.stl` | **PASS** — `263,370` bytes STL |
| Equal through-bore (`bore_a = bore_b = 10`, `body_clearance_mm = 0`) | `.scad` + non-empty `.stl` | **PASS** — `336,991` bytes STL |
| Stepped bore (`bore_a = 16`, `bore_b = 11`, per-interface clearances) | `.scad` + non-empty `.stl` | **PASS** — `400,013` bytes STL |
| Invalid configuration (shoulders > length, bore > OD) | Rejected before export, no files | **PASS** — exit code `1`, no `.scad` or `.stl` created |

---

## 6. Known Geometric Limitations & Assumptions

- **Bore Transition Plane:** Unequal or blind bores always transition via a flat horizontal step at `z_mid = end_a_length_mm + (body_length_mm / 2)`. Tapered/conical internal transitions and custom axial transition offsets are not yet supported.
- **Outer Shoulder Transitions:** Outer steps at `z1` and `z2` are 90-degree square shoulders; only the End A (`z = 0`) and End B (`z = L`) outer faces support 45-degree chamfers (`chamfer_mm`), and both ends share one chamfer size.
- **Axisymmetric Solid Only:** Non-axisymmetric features (hex flats, knurling, hose barbs, threads, mounting flanges, or keyways) are out of scope for Phase 1.1.
- **Axial Clearance:** Clearances apply radially to cylindrical diameters; axial lengths (`overall_length_mm`, `end_a_length_mm`, `end_b_length_mm`) are not adjusted by clearance fields.
- **No Structural/DFM Certification:** Minimum wall thickness is enforced only down to geometric resolution (`0.0001 mm`), not printer nozzle width or mechanical stress limits.
