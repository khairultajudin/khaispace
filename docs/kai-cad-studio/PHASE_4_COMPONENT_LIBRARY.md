# KAI CAD Studio — Phase 4: Parametric Component Library (Batch 1)

**Phase:** Phase 4 Batch 1 — Modular Parametric Component Library  
**Status:** Implemented, Mesh-Verified & Live-Tested with Hermes Agent  
**Supported Components:** `custom_adapter`, `rectangular_block`, `mounting_bracket`, `spacer_bushing`  
**Units:** Millimetres (`mm`) exclusively

---

## 1. Architecture & Registry Dispatch

Phase 4 expands `kai_cad` from a single component into a modular library dispatched through `kai_cad/generators/registry.py` (`COMPONENT_REGISTRY`), without adding new MCP tools or duplicating lifecycle/persistence logic:

```text
User -> Hermes -> MCP (cad_generate_design)
    |
    v
COMPONENT_REGISTRY[component_type]
    |-- custom_adapter     -> validate_adapter_dict           -> generate_custom_adapter
    |-- rectangular_block  -> validate_rectangular_block_dict -> generate_rectangular_block
    |-- mounting_bracket   -> validate_mounting_bracket_dict  -> generate_mounting_bracket
    +-- spacer_bushing     -> validate_spacer_bushing_dict    -> generate_spacer_bushing
            |
            v
    Deterministic OpenSCAD (.scad) -> OpenSCAD CLI -> Watertight STL (.stl) -> Manual TinkerCAD Import
```

The public MCP tool surface remains the exact six tools (`cad_generate_design`, `cad_validate_design`, `cad_export_stl`, `cad_get_design`, `cad_list_designs`, `cad_get_design_artifact`).

---

## 2. Component A — `rectangular_block`

### Coordinate System & Geometry
- **X-axis:** Centered in `[-length_mm / 2, +length_mm / 2]`.
- **Y-axis:** Centered in `[-width_mm / 2, +width_mm / 2]`.
- **Z-axis:** Bottom face at `Z = 0`, top face at `Z = height_mm`.
- **Corners:** Square corners when `corner_radius_mm == 0`; rounded vertical corners via 2D `hull()` of four corner circles when `corner_radius_mm > 0`.
- **Through-holes:** Symmetric `hole_count_x * hole_count_y` pattern along Z subtracted in 2D prior to `linear_extrude`, avoiding 3D boolean z-fighting.

### JSON Schema (`rectangular_block`)
| Parameter | Type | Required | Default | Rules |
| :--- | :--- | :---: | :---: | :--- |
| `length_mm` | number | Yes | — | `>= 1e-4` |
| `width_mm` | number | Yes | — | `>= 1e-4` |
| `height_mm` | number | Yes | — | `>= 1e-4` |
| `corner_radius_mm` | number | No | `0.0` | `0` or `< min(length_mm, width_mm) / 2` |
| `hole_diameter_mm` | number | No | `0.0` | `0` or `> 0` (requires `hole_count_x >= 1` and `hole_count_y >= 1`) |
| `hole_count_x` | integer | No | `0` | `0..200` |
| `hole_count_y` | integer | No | `0` | `0..200` |
| `hole_spacing_x_mm` | number \| null | No | `null` | When omitted alongside `edge_margin_x_mm` for `count >= 2`, defaults deterministically to `length_mm / (hole_count_x + 1)` |
| `hole_spacing_y_mm` | number \| null | No | `null` | When omitted alongside `edge_margin_y_mm` for `count >= 2`, defaults deterministically to `width_mm / (hole_count_y + 1)` |
| `edge_margin_x_mm` | number \| null | No | `null` | Center-to-edge margin along X |
| `edge_margin_y_mm` | number \| null | No | `null` | Center-to-edge margin along Y |
| `clearance_mm` | number | No | `0.0` | Radial hole clearance (`eff_hole_d = hole_diameter_mm + 2 * clearance_mm`); rejected if `> 0` when holes are disabled |
| `name`, `description`, `units`, `fn` | metadata | No | `"rectangular_block"`, ..., `"mm"`, `64` | `units` must be `"mm"`, `fn` integer in `[16, 720]` |

Example: [`kai_cad/examples/rectangular_block.example.json`](../../kai_cad/examples/rectangular_block.example.json).

---

## 3. Component B — `mounting_bracket`

### Coordinate System & Bounding Box
- **X-axis (`[0, base_length_mm]`):** Vertical plate occupies `X in [0, thickness_mm]`; clear horizontal shelf occupies `X in [thickness_mm + inside_corner_radius_mm, base_length_mm]`.
- **Y-axis (`[-base_width_mm / 2, +base_width_mm / 2]`):** Centered symmetrically on `Y = 0`.
- **Z-axis (`[0, vertical_height_mm]`):** Horizontal base plate occupies `Z in [0, thickness_mm]`; clear vertical leg occupies `Z in [thickness_mm + inside_corner_radius_mm, vertical_height_mm]`.
- **Single Connected Solid:** Extruded from a single unified 2D L-profile (including optional tangent `inside_corner_radius_mm` fillet) along Y, then differenced with symmetric mounting holes.

### JSON Schema (`mounting_bracket`)
| Parameter | Type | Required | Default | Rules |
| :--- | :--- | :---: | :---: | :--- |
| `base_length_mm` | number | Yes | — | `> thickness_mm + inside_corner_radius_mm + 0.2` |
| `base_width_mm` | number | Yes | — | `>= 0.2` |
| `vertical_height_mm` | number | Yes | — | `> thickness_mm + inside_corner_radius_mm + 0.2` |
| `thickness_mm` | number | Yes | — | `>= 0.2`, strictly `< base_length_mm` and `< vertical_height_mm` |
| `base_hole_diameter_mm` | number | No | `0.0` | `0` or `> 0` (centered on clear flat shelf `X = (thickness + inside_r + base_length)/2`) |
| `base_hole_count` | integer | No | `0` | `0..200`, distributed symmetrically along Y |
| `base_hole_spacing_mm` | number \| null | No | `null` | Defaults deterministically to `base_width_mm / (base_hole_count + 1)` when `count >= 2` and margin is omitted |
| `base_edge_margin_mm` | number \| null | No | `null` | Center-to-edge margin along Y |
| `vertical_hole_diameter_mm` | number | No | `0.0` | `0` or `> 0` (centered on clear vertical leg `Z = (thickness + inside_r + vertical_height)/2`) |
| `vertical_hole_count` | integer | No | `0` | `0..200`, distributed symmetrically along Y |
| `vertical_hole_spacing_mm` | number \| null | No | `null` | Defaults deterministically to `base_width_mm / (vertical_hole_count + 1)` when `count >= 2` and margin is omitted |
| `vertical_edge_margin_mm` | number \| null | No | `null` | Center-to-edge margin along Y |
| `inside_corner_radius_mm` | number | No | `0.0` | Concave root fillet radius `>= 0` |
| `clearance_mm` | number | No | `0.0` | Radial clearance enlarging enabled base/vertical holes by `2 * clearance_mm` |
| `name`, `description`, `units`, `fn` | metadata | No | `"mounting_bracket"`, ..., `"mm"`, `64` | `units` must be `"mm"`, `fn` integer in `[16, 720]` |

Example: [`kai_cad/examples/mounting_bracket.example.json`](../../kai_cad/examples/mounting_bracket.example.json).

---

## 4. Component C — `spacer_bushing`

### Coordinate System & Geometry
- **Axisymmetric on Z:** Centered on X/Y origin, bottom face at `Z = 0`, top face at `Z = height_mm`.
- **Through-bore:** Continuous cylindrical inner bore (`inner_diameter_mm > 0` strictly `< outer_diameter_mm`).
- **Chamfers:** Optional independent 45-degree outer chamfers (`top_chamfer_mm`, `bottom_chamfer_mm`) revolved via `rotate_extrude` of a validated CCW 2D polygon.

### JSON Schema (`spacer_bushing`)
| Parameter | Type | Required | Default | Rules |
| :--- | :--- | :---: | :---: | :--- |
| `outer_diameter_mm` | number | Yes | — | `> inner_diameter_mm` |
| `inner_diameter_mm` | number | Yes | — | `> 0`, strictly `< outer_diameter_mm` |
| `height_mm` | number | Yes | — | `> top_chamfer_mm + bottom_chamfer_mm` |
| `top_chamfer_mm` | number | No | `0.0` | `>= 0`, strictly `< effective_radial_wall_mm` |
| `bottom_chamfer_mm` | number | No | `0.0` | `>= 0`, strictly `< effective_radial_wall_mm` |
| `clearance_mm` | number | No | `0.0` | Radial clearance (`eff_od = od - 2*c`, `eff_id = id + 2*c`; must leave radial wall `>= 0.2 mm`) |
| `name`, `description`, `units`, `fn` | metadata | No | `"spacer_bushing"`, ..., `"mm"`, `96` | `units` must be `"mm"`, `fn` integer in `[16, 720]` |

Example: [`kai_cad/examples/spacer_bushing.example.json`](../../kai_cad/examples/spacer_bushing.example.json).

---

## 5. Validation Guarantees, Mesh Verification & Limitations

- **Minimum Geometric Wall (`MIN_WALL_THICKNESS_MM = 0.2 mm`):** Every hole-to-edge margin, hole-to-rounded-corner distance, inter-hole ligament, bracket plate thickness, and spacer radial wall must retain at least `0.2 mm` of solid material after applying `clearance_mm`.
- **Mesh Verification Tolerance:** Discretized cylindrical/circular features at `fn >= 64` are verified in `trimesh` within `0.05 mm` bounding-box chord tolerance, along with `is_watertight=True`, `is_winding_consistent=True`, `is_volume=True`, single connected body (`len(mesh.split()) == 1`), and exact Euler characteristic $\chi = 2 - 2g$ confirming open through-holes.
- **Engineering Disclaimer:** Geometric validity is **not** structural engineering certification, load rating, printability certification, or a guarantee of manufacturing tolerances.
- **TinkerCAD Import Workflow:** `.json` and `.scad` are preserved as the canonical parametric source of truth, while `.stl` is the triangulated mesh exchange artifact for manual import into [TinkerCAD](https://www.tinkercad.com/) (which does not restore OpenSCAD parametric primitives).

---

## 6. Example Hermes Prompts

1. `"Create a rectangular block, 60 mm long, 40 mm wide and 5 mm high."`
2. `"Create an L-shaped mounting bracket with a 60 mm base length, 40 mm base width, 40 mm vertical height and 5 mm thickness, with two M4 mounting holes on the base."` *(Note: if `base_width_mm` is omitted by the user, KAI asks for the missing base width rather than inventing it.)*
3. `"Create a spacer with 20 mm outer diameter, 10 mm inner diameter and 8 mm height."`

