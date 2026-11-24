"""Unit tests for Custom Adapter validation and OpenSCAD source generation."""

from __future__ import annotations

import copy
import json
import math
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_cad import (
    CustomAdapterSpec,
    GeometryValidationError,
    generate_custom_adapter,
    validate_adapter_dict,
)

EXAMPLE_CONFIG_PATH = ROOT / "kai_cad" / "examples" / "custom_adapter.example.json"


def _valid_payload(**overrides):
    base = {
        "name": "test_adapter",
        "description": "Unit test stepped adapter",
        "units": "mm",
        "overall_length_mm": 60.0,
        "body_diameter_mm": 32.0,
        "end_a_diameter_mm": 25.0,
        "end_b_diameter_mm": 19.0,
        "end_a_length_mm": 20.0,
        "end_b_length_mm": 18.0,
        "bore_a_diameter_mm": 18.0,
        "bore_b_diameter_mm": 13.0,
        "chamfer_mm": 1.0,
        "clearance_mm": 0.15,
        "fn": 96,
    }
    base.update(overrides)
    return base


class TestCustomAdapterGeneration(unittest.TestCase):
    def test_valid_adapter_generation_from_example_json(self) -> None:
        spec = CustomAdapterSpec.from_json_file(EXAMPLE_CONFIG_PATH)
        result = generate_custom_adapter(spec)

        self.assertEqual(result.spec.overall_length_mm, 60.0)
        self.assertEqual(result.spec.body_diameter_mm, 32.0)
        self.assertEqual(result.spec.clearance_mm, 0.15)
        self.assertAlmostEqual(result.effective_dimensions.body_length_mm, 22.0)
        self.assertAlmostEqual(result.effective_dimensions.end_a_diameter_mm, 24.7)
        self.assertAlmostEqual(result.effective_dimensions.bore_a_diameter_mm, 18.3)
        self.assertGreaterEqual(len(result.profile_points_mm), 6)

    def test_generation_is_deterministic_and_preserves_nominal_dimensions(self) -> None:
        payload = _valid_payload()
        snapshot = copy.deepcopy(payload)

        res1 = generate_custom_adapter(payload)
        res2 = generate_custom_adapter(payload)

        # Input payload and nominal dimensions are never silently mutated.
        self.assertEqual(payload, snapshot)
        self.assertEqual(res1.spec.end_a_diameter_mm, 25.0)
        self.assertEqual(res1.spec.bore_a_diameter_mm, 18.0)
        self.assertEqual(res1.spec_sha256, res2.spec_sha256)
        self.assertEqual(res1.scad_sha256, res2.scad_sha256)
        self.assertEqual(res1.scad_source, res2.scad_source)

    def test_solid_and_blind_bore_configurations_generate_cleanly(self) -> None:
        solid = generate_custom_adapter(_valid_payload(bore_a_diameter_mm=0.0, bore_b_diameter_mm=0.0, chamfer_mm=0.0))
        self.assertEqual(solid.effective_dimensions.bore_a_diameter_mm, 0.0)
        self.assertEqual(solid.effective_dimensions.bore_b_diameter_mm, 0.0)
        self.assertIn("rotate_extrude(angle = 360", solid.scad_source)

        blind_a = generate_custom_adapter(_valid_payload(bore_a_diameter_mm=10.0, bore_b_diameter_mm=0.0))
        self.assertGreater(blind_a.effective_dimensions.bore_a_diameter_mm, 10.0)
        self.assertEqual(blind_a.effective_dimensions.bore_b_diameter_mm, 0.0)

    def test_openscad_source_contains_expected_parametric_constructs(self) -> None:
        result = generate_custom_adapter(_valid_payload(description="Line1\nLine2"))
        scad = result.scad_source

        self.assertIn("overall_length_mm  = 60;", scad)
        self.assertIn("body_diameter_mm   = 32;", scad)
        self.assertIn("end_a_diameter_mm  = 25;", scad)
        self.assertIn("end_b_diameter_mm  = 19;", scad)
        self.assertIn("end_a_length_mm    = 20;", scad)
        self.assertIn("end_b_length_mm    = 18;", scad)
        self.assertIn("bore_a_diameter_mm = 18;", scad)
        self.assertIn("bore_b_diameter_mm = 13;", scad)
        self.assertIn("chamfer_mm         = 1;", scad)
        self.assertIn("clearance_mm       = 0.15;", scad)
        self.assertIn("module custom_adapter(", scad)
        self.assertIn("rotate_extrude(angle = 360, convexity = 10, $fn = fn)", scad)
        self.assertIn("polygon(points = profile);", scad)
        self.assertIn("custom_adapter();", scad)
        # Description newline was sanitized so comment stays single-line
        self.assertIn("// Description : Line1 Line2", scad)


class TestCustomAdapterValidation(unittest.TestCase):
    def test_invalid_dimensions_rejected(self) -> None:
        bad_cases = [
            {"body_diameter_mm": 0.0},
            {"end_a_diameter_mm": -5.0},
            {"end_b_diameter_mm": math.nan},
            {"overall_length_mm": math.inf},
            {"chamfer_mm": -0.5},
            {"clearance_mm": -0.1},
            {"bore_a_diameter_mm": -1.0},
            {"body_diameter_mm": True},
            {"units": "inches"},
            {"fn": 8},
            {"fn": True},
            {"unexpected_param": 123},
        ]
        for overrides in bad_cases:
            with self.subTest(overrides=overrides):
                with self.assertRaises(GeometryValidationError):
                    generate_custom_adapter(_valid_payload(**overrides))

    def test_bore_exceeding_or_equal_to_outer_diameter_rejected(self) -> None:
        # Nominal bore A >= end A OD
        with self.assertRaises(GeometryValidationError) as ctx_a:
            generate_custom_adapter(_valid_payload(bore_a_diameter_mm=25.0))
        self.assertTrue(any(i.code == "BORE_EXCEEDS_OUTER_DIAMETER" for i in ctx_a.exception.issues))

        # Nominal bore B > end B OD
        with self.assertRaises(GeometryValidationError) as ctx_b:
            generate_custom_adapter(_valid_payload(bore_b_diameter_mm=20.0))
        self.assertTrue(any(i.code == "BORE_EXCEEDS_OUTER_DIAMETER" for i in ctx_b.exception.issues))

        # Bore exceeds body diameter even when smaller than flared end
        with self.assertRaises(GeometryValidationError) as ctx_body:
            generate_custom_adapter(
                _valid_payload(end_a_diameter_mm=40.0, body_diameter_mm=20.0, bore_a_diameter_mm=22.0)
            )
        self.assertTrue(any(i.code == "BORE_EXCEEDS_BODY_DIAMETER" for i in ctx_body.exception.issues))

        # Clearance pushes effective bore into effective OD
        with self.assertRaises(GeometryValidationError) as ctx_clr:
            generate_custom_adapter(
                _valid_payload(end_b_diameter_mm=19.0, bore_b_diameter_mm=18.5, clearance_mm=0.2, chamfer_mm=0.0)
            )
        self.assertTrue(any(i.code == "EFFECTIVE_BORE_EXCEEDS_OUTER_DIAMETER" for i in ctx_clr.exception.issues))

    def test_invalid_overall_length_rejected(self) -> None:
        with self.assertRaises(GeometryValidationError):
            generate_custom_adapter(_valid_payload(overall_length_mm=0.0))
        with self.assertRaises(GeometryValidationError):
            generate_custom_adapter(_valid_payload(overall_length_mm=-10.0))
        # Overall length shorter than combined shoulders (20 + 18 = 38)
        with self.assertRaises(GeometryValidationError) as ctx:
            generate_custom_adapter(_valid_payload(overall_length_mm=30.0))
        self.assertTrue(any(i.code == "INVALID_SHOULDER_CONFIGURATION" for i in ctx.exception.issues))

    def test_invalid_shoulder_and_chamfer_configuration_rejected(self) -> None:
        # Shoulders sum exactly to overall_length (leaves zero body length)
        with self.assertRaises(GeometryValidationError) as ctx_eq:
            generate_custom_adapter(_valid_payload(overall_length_mm=38.0, end_a_length_mm=20.0, end_b_length_mm=18.0))
        self.assertTrue(any(i.code == "INVALID_SHOULDER_CONFIGURATION" for i in ctx_eq.exception.issues))

        # Chamfer >= shoulder length
        with self.assertRaises(GeometryValidationError) as ctx_ch_len:
            generate_custom_adapter(_valid_payload(end_b_length_mm=2.0, chamfer_mm=2.0))
        self.assertTrue(any(i.code == "CHAMFER_EXCEEDS_SHOULDER_LENGTH" for i in ctx_ch_len.exception.issues))

        # Chamfer >= radial wall thickness
        with self.assertRaises(GeometryValidationError) as ctx_ch_wall:
            generate_custom_adapter(_valid_payload(end_b_diameter_mm=19.0, bore_b_diameter_mm=17.0, chamfer_mm=1.0))
        self.assertTrue(any(i.code == "CHAMFER_EXCEEDS_WALL_THICKNESS" for i in ctx_ch_wall.exception.issues))

    def test_missing_parameters_and_malformed_json_rejected(self) -> None:
        required = [
            "overall_length_mm",
            "body_diameter_mm",
            "end_a_diameter_mm",
            "end_b_diameter_mm",
            "end_a_length_mm",
            "end_b_length_mm",
            "bore_a_diameter_mm",
            "bore_b_diameter_mm",
        ]
        for field_name in required:
            with self.subTest(missing=field_name):
                payload = _valid_payload()
                del payload[field_name]
                with self.assertRaises(GeometryValidationError) as ctx:
                    validate_adapter_dict(payload)
                self.assertTrue(any(i.code == "MISSING_PARAMETER" and i.field == field_name for i in ctx.exception.issues))

        with tempfile.TemporaryDirectory() as tmp:
            bad_json = Path(tmp) / "broken.json"
            bad_json.write_text("{not valid json", encoding="utf-8")
            with self.assertRaises(GeometryValidationError) as ctx:
                CustomAdapterSpec.from_json_file(bad_json)
            self.assertTrue(any(i.code == "INVALID_JSON" for i in ctx.exception.issues))


if __name__ == "__main__":
    unittest.main()
