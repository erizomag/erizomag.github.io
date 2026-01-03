#!/usr/bin/env python3
"""
GeoJSON Validation and Simplification Script

Validates GeoJSON files for Parcel Triage and optionally simplifies geometries
for improved web performance.

Usage:
    python validate-geojson.py <jurisdiction-directory>
    python validate-geojson.py data/kingston-ny --simplify --tolerance=0.0001

Requirements:
    pip install geojson shapely
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import geojson
    from geojson import FeatureCollection
    from shapely.geometry import shape, mapping
    from shapely.validation import explain_validity
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install geojson shapely")
    sys.exit(1)


def validate_geojson_file(file_path: Path) -> Tuple[bool, List[str]]:
    """
    Validate a GeoJSON file.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return False, [f"Invalid JSON: {e}"]
    except Exception as e:
        return False, [f"Failed to read file: {e}"]

    # Validate GeoJSON structure
    if not geojson.is_valid(data):
        errors.append("Invalid GeoJSON structure")
        return False, errors

    # Additional validation for FeatureCollection
    if data.get('type') == 'FeatureCollection':
        features = data.get('features', [])

        for i, feature in enumerate(features):
            # Validate geometry
            if 'geometry' in feature and feature['geometry']:
                try:
                    geom = shape(feature['geometry'])
                    if not geom.is_valid:
                        validity_msg = explain_validity(geom)
                        errors.append(f"Feature {i}: Invalid geometry - {validity_msg}")
                except Exception as e:
                    errors.append(f"Feature {i}: Failed to parse geometry - {e}")

            # Check for required properties
            if 'properties' not in feature:
                errors.append(f"Feature {i}: Missing properties")

    return len(errors) == 0, errors


def simplify_geometry(geometry: dict, tolerance: float) -> dict:
    """
    Simplify a GeoJSON geometry using Douglas-Peucker algorithm.

    Args:
        geometry: GeoJSON geometry dict
        tolerance: Simplification tolerance (in degrees for WGS84)

    Returns:
        Simplified geometry dict
    """
    try:
        geom = shape(geometry)
        simplified = geom.simplify(tolerance, preserve_topology=True)
        return mapping(simplified)
    except Exception as e:
        print(f"Warning: Failed to simplify geometry: {e}")
        return geometry


def process_jurisdiction(jurisdiction_dir: Path, simplify: bool = False,
                        tolerance: float = 0.0001) -> Dict[str, bool]:
    """
    Process all GeoJSON files in a jurisdiction directory.

    Returns:
        Dict mapping file names to validation status
    """
    results = {}

    # Expected file structure
    expected_files = [
        jurisdiction_dir / 'parcels' / 'parcels.geojson',
        jurisdiction_dir / 'zoning' / 'zoning.geojson',
        jurisdiction_dir / 'floodplain' / 'floodplain.geojson',
    ]

    for file_path in expected_files:
        if not file_path.exists():
            print(f"⚠ Warning: Expected file not found: {file_path}")
            results[str(file_path.relative_to(jurisdiction_dir))] = False
            continue

        print(f"\nValidating: {file_path.name}")
        is_valid, errors = validate_geojson_file(file_path)

        if is_valid:
            print(f"  ✓ Valid GeoJSON")
            results[str(file_path.relative_to(jurisdiction_dir))] = True

            # Simplify if requested
            if simplify:
                print(f"  Simplifying geometries (tolerance={tolerance})...")
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)

                    if data.get('type') == 'FeatureCollection':
                        for feature in data.get('features', []):
                            if 'geometry' in feature and feature['geometry']:
                                feature['geometry'] = simplify_geometry(
                                    feature['geometry'], tolerance
                                )

                        # Write simplified version
                        output_path = file_path.parent / f"{file_path.stem}_simplified.geojson"
                        with open(output_path, 'w') as f:
                            json.dump(data, f, separators=(',', ':'))
                        print(f"  ✓ Simplified version saved to: {output_path.name}")
                except Exception as e:
                    print(f"  ✗ Simplification failed: {e}")
        else:
            print(f"  ✗ Validation failed:")
            for error in errors:
                print(f"    - {error}")
            results[str(file_path.relative_to(jurisdiction_dir))] = False

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Validate and optionally simplify GeoJSON files for Parcel Triage'
    )
    parser.add_argument(
        'jurisdiction_dir',
        type=Path,
        help='Path to jurisdiction data directory (e.g., data/kingston-ny)'
    )
    parser.add_argument(
        '--simplify',
        action='store_true',
        help='Generate simplified versions of geometries'
    )
    parser.add_argument(
        '--tolerance',
        type=float,
        default=0.0001,
        help='Simplification tolerance in degrees (default: 0.0001)'
    )

    args = parser.parse_args()

    if not args.jurisdiction_dir.exists():
        print(f"Error: Directory not found: {args.jurisdiction_dir}")
        sys.exit(1)

    print(f"Processing jurisdiction: {args.jurisdiction_dir}")
    print("=" * 60)

    results = process_jurisdiction(
        args.jurisdiction_dir,
        simplify=args.simplify,
        tolerance=args.tolerance
    )

    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Total files: {len(results)}")
    print(f"  Valid: {sum(results.values())}")
    print(f"  Invalid: {len(results) - sum(results.values())}")

    if all(results.values()):
        print("\n✓ All GeoJSON files are valid!")
        sys.exit(0)
    else:
        print("\n✗ Some files failed validation")
        sys.exit(1)


if __name__ == '__main__':
    main()
