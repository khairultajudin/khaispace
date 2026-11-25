# KAI CAD Studio — Phase 4 Batch 2: Parametric Electronics Enclosure & Lid Library

**Phase:** Phase 4 Batch 2 — Electronics Enclosure & Compatible Lid  
**Status:** Implemented, Mesh-Verified & Live-Tested with Hermes Agent  
**New Components:** `enclosure_base`, `enclosure_lid` (6 total registered components)  
**Units:** Millimetres (`mm`) exclusively

---

## 1. Architecture & Registry Integration

`enclosure_base` and `enclosure_lid` integrate directly into `COMPONENT_REGISTRY` (`kai_cad/generators/registry.py`) alongside `custom_adapter`, `rectangular_block`, `mounting_bracket`, and `spacer_bushing`:

- **Unchanged 6-Tool MCP Surface:** `cad_generate_design`, `cad_validate_design`, `cad_export_stl`, `cad_get_design`, `cad_list_designs`, `cad_get_design_artifact` (`"additionalProperties": false` and server-only `OPENSCAD_BIN` preserved).
- **Separate Printable Solids:** Base and lid are generated, validated, persisted, and exported as independent `.json`, `.scad`, and `.stl` artifacts so each part can be inspected, 3D-printed, or manually imported into [TinkerCAD](https://www.tinkercad.com/). Importing `.stl` into TinkerCAD transfers triangulated mesh geometry only and does not restore parametric OpenSCAD construction history.

---

## 2. Coordinate Conventions & Shared Compatibility Contract

### Coordinate Systems
- **Planar X/Y Alignment (Both Components):**
  - Centered symmetrically at `(0, 0)`: `X in [-length_mm / 2, +length_mm / 2]`, `Y in [-width_mm / 2, +width_mm / 2]`.
  - Wall naming on `enclosure_base`: `"front"` (`Y = -width_mm/2`), `"back"` (`Y = +width_mm/2`), `"left"` (`X = -length_mm/2`), `"right"` (`X = +length_mm/2`).
- **Vertical Z Orientation:**
  - `enclosure_base`: Bottom outer face at `Z = 0`; solid floor `Z in [0, floor_thickness_mm]`; open top rim at `Z = height_mm`.
  - `enclosure_lid`: Mating underside of top plate at `Z = 0`; top plate `Z in [0, lid_thickness_mm]`; optional downward locating skirt `Z in [-skirt_depth_mm, 0]`.
  - **Assembly Inspection Transform:** Translating `enclosure_lid` by `translate([0, 0, base.height_mm])` seats the lid directly onto the base's top rim with the skirt extending downward into the base's upper cavity `[base.height_mm - skirt_depth_mm, base.height_mm]`.

### Base / Lid Compatibility Contract
1. **Nominal Planar Match:** `lid.length_mm == base.length_mm`, `lid.width_mm == base.width_mm`, and `lid.corner_radius_mm == base.corner_radius_mm` (all preserved verbatim as nominal outer dimensions).
2. **Skirt Inset & Radial Clearance (`skirt_clearance_mm`):**
   - Base internal cavity measures `(length_mm - 2 * wall_thickness_mm) x (width_mm - 2 * wall_thickness_mm)` with inner corner radius `max(0, corner_radius_mm - wall_thickness_mm)`.
   - When `skirt_depth_mm > 0` on `enclosure_lid`, `wall_thickness_mm` and `skirt_thickness_mm` are **explicitly required** (never silently inferred or invented).
   - `skirt_clearance_mm` (`>= 0`, default `0.0`) is the radial per-wall fit gap between the base inner wall and the skirt outer face:
     - `skirt_outer_length_mm = length_mm - 2 * (wall_thickness_mm + skirt_clearance_mm)`
     - `skirt_outer_width_mm = width_mm - 2 * (wall_thickness_mm + skirt_clearance_mm)`
     - `skirt_outer_corner_radius_mm = max(0, corner_radius_mm - wall_thickness_mm - skirt_clearance_mm)`
3. **Boss & Screw-Hole Alignment (`boss_offset_x_mm`, `boss_offset_y_mm`):**
   - Measured identically on both components as the **perpendicular distance from the outer enclosure walls (`±length_mm/2`, `±width_mm/2`) inward to the boss / screw-hole axis**:
     - 4-corner layout: `(±(length_mm/2 - boss_offset_x_mm), ±(width_mm/2 - boss_offset_y_mm))`
     - 2-boss centerline layout: `(±(length_mm/2 - boss_offset_x_mm), 0)`
   - To avoid physical collision between a downward skirt and full-height base bosses of outer diameter `boss_outer_diameter_mm`, choose `boss_offset_{x,y}_mm > wall_thickness_mm + skirt_clearance_mm + skirt_thickness_mm + (boss_outer_diameter_mm / 2)`.

---

## 3. Component Schemas

### Component A — `enclosure_base`
| Parameter | Type | Required | Default | Rules |
| :--- | :--- | :---: | :---: | :--- |
| `length_mm` | number | Yes | — | `> 2 * wall_thickness_mm + 0.2` |
| `width_mm` | number | Yes | — | `> 2 * wall_thickness_mm + 0.2` |
| `height_mm` | number | Yes | — | `> floor_thickness_mm + 0.2` |
| `wall_thickness_mm` | number | Yes | — | `>= 0.2` |
| `floor_thickness_mm` | number | Yes | — | `>= 0.2` |
| `corner_radius_mm` | number | No | `0.0` | `0` or `< min(length_mm, width_mm) / 2 - 0.2` |
| `boss_count` | integer | No | `0` | `0`, `2`, or `4` |
| `boss_outer_diameter_mm` | number | No | `0.0` | Required `> boss_hole_diameter_mm` when `boss_count > 0` |
| `boss_hole_diameter_mm` | number | No | `0.0` | Vertical blind hole stopping at `Z = floor_thickness_mm` (never pierces floor) |
| `boss_offset_x_mm` | number \| null | No | `null` | Outer-wall inset along X; required when `boss_count > 0` |
| `boss_offset_y_mm` | number \| null | No | `null` | Outer-wall inset along Y; required when `boss_count == 4` |
| `cable_openings` | array | No | `[]` | Validated list of wall openings (see Section 4) |
| `name`, `description`, `units`, `fn` | metadata | No | `"enclosure_base"`, ..., `"mm"`, `64` | `units == "mm"`, `fn` in `[16, 720]` |

### Component B — `enclosure_lid`
| Parameter | Type | Required | Default | Rules |
| :--- | :--- | :---: | :---: | :--- |
| `length_mm` | number | Yes | — | `> 0` (match `enclosure_base.length_mm`) |
| `width_mm` | number | Yes | — | `> 0` (match `enclosure_base.width_mm`) |
| `lid_thickness_mm` | number | Yes | — | `>= 0.2` |
| `corner_radius_mm` | number | No | `0.0` | Match `enclosure_base.corner_radius_mm` |
| `skirt_depth_mm` | number | No | `0.0` | `>= 0`; downward locating skirt depth (`Z in [-skirt_depth_mm, 0]`) |
| `wall_thickness_mm` | number \| null | No | `null` | **Required** when `skirt_depth_mm > 0` (mating base wall thickness) |
| `skirt_thickness_mm` | number \| null | No | `null` | **Required** `>= 0.2` when `skirt_depth_mm > 0` |
| `skirt_clearance_mm` | number \| null | No | `null` | Radial clearance gap `>= 0` (`0.0` if omitted when `skirt_depth_mm > 0`) |
| `screw_hole_diameter_mm` | number | No | `0.0` | Through-hole diameter aligned with base bosses |
| `screw_hole_count` | integer \| null | No | `null` | `0`, `2`, or `4` (defaults to `4` when `screw_hole_diameter_mm > 0`) |
| `boss_offset_x_mm` | number \| null | No | `null` | Required when `screw_hole_diameter_mm > 0` |
| `boss_offset_y_mm` | number \| null | No | `null` | Required for 4-corner screw holes |
| `name`, `description`, `units`, `fn` | metadata | No | `"enclosure_lid"`, ..., `"mm"`, `64` | `units == "mm"`, `fn` in `[16, 720]` |

---

## 4. Cable Opening Schema (`cable_openings`)

Each item in `cable_openings` is a strictly validated JSON object:

- `wall`: `"front" | "back" | "left" | "right"` (required)
- `shape`: `"circular" | "rectangular"` (required)
- `center_z_mm`: number `> 0` (required, measured from enclosure bottom `Z = 0`)
- `offset_mm`: number (optional, default `0.0`; lateral offset from wall centerline)
- Shape dimensions:
  - `"circular"`: `diameter_mm` (`> 0` required; `width_mm` and `height_mm` forbidden)
  - `"rectangular"`: `width_mm` (`> 0` required) and `height_mm` (`> 0` required; `diameter_mm` forbidden)

**Validation guarantees:** Every opening must retain `>= 0.2 mm` solid wall above the floor, `>= 0.2 mm` below the top rim (preserving a continuous closed rim), `>= 0.2 mm` inside the flat wall span clear of corners/side walls, `>= 0.2 mm` separation from any other opening on the same wall, and must not intersect internal screw bosses.

---

## 5. Example JSON Specifications

- **Example 1 — Basic Enclosure (`100 x 70 x 35 mm`):** [`kai_cad/examples/enclosure_base_basic.example.json`](../../kai_cad/examples/enclosure_base_basic.example.json)
- **Example 2 — Electronics Enclosure (Bosses + Front Cable Opening):** [`kai_cad/examples/enclosure_base_electronics.example.json`](../../kai_cad/examples/enclosure_base_electronics.example.json)
- **Example 3 — Compatible Skirted Lid:** [`kai_cad/examples/enclosure_lid_compatible.example.json`](../../kai_cad/examples/enclosure_lid_compatible.example.json)

### Example Hermes Prompts
1. `"Create a basic electronics enclosure base 100 mm long, 70 mm wide, 35 mm high, with 2 mm walls and a 2.5 mm floor."`
2. `"Create an enclosure lid compatible with a 100x70 mm enclosure (2 mm walls), 2.5 mm lid thickness, 3 mm locating skirt, 1.6 mm skirt thickness, and 0.2 mm skirt clearance."`

---

## 6. Known Limitations & Engineering Disclaimers

- **No Structural, Thermal, or IP/Waterproof Certification:** Geometric validation (`MIN_WALL_THICKNESS_MM = 0.2 mm`) verifies manifold CAD solids only — not ingress protection (IP rating), waterproofing, EMI shielding, thermal dissipation, or mechanical load strength.
- **Out of Scope for Batch 2:** Multi-part assembly scenes, fastener/thread geometry, hinges, snap-fits, PCB mounting auto-import, TinkerCAD browser automation, and Khai Space Hub synchronization.
