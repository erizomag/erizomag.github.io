import { NextRequest, NextResponse } from 'next/server';
import {
  findParcelById,
  findZoningForParcel,
  checkFloodplain,
} from '@/lib/data/geojson-loader';
import { getJurisdiction } from '@/lib/config/jurisdictions';
import { analyzeFeasibility } from '@/lib/calculations/feasibility';
import * as turf from '@turf/turf';

/**
 * POST /api/analyze
 * Analyze parcel feasibility for multifamily development
 *
 * Body: {
 *   jurisdiction: string;
 *   parcel_id: string;
 *   use_type: 'multifamily';
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jurisdiction, parcel_id, use_type } = body;

    // Validate inputs
    if (!jurisdiction || !parcel_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: jurisdiction, parcel_id' },
        { status: 400 }
      );
    }

    if (use_type !== 'multifamily') {
      return NextResponse.json(
        { error: 'Only multifamily use type is supported in MVP' },
        { status: 400 }
      );
    }

    // Load jurisdiction config
    const jurisdictionConfig = getJurisdiction(jurisdiction);
    if (!jurisdictionConfig) {
      return NextResponse.json(
        { error: `Unknown jurisdiction: ${jurisdiction}` },
        { status: 404 }
      );
    }

    // Find the parcel
    const parcel = await findParcelById(jurisdiction, parcel_id);
    if (!parcel) {
      return NextResponse.json(
        { error: `Parcel not found: ${parcel_id}` },
        { status: 404 }
      );
    }

    // Get lot area (from properties or calculate from geometry)
    let lotAreaSqft = parcel.properties.lot_area_sqft;
    if (!lotAreaSqft) {
      const area = turf.area(parcel);
      lotAreaSqft = area * 10.7639; // Convert m² to sqft
    }

    // Find zoning district
    const zoningCode =
      parcel.properties.zoning || (await findZoningForParcel(jurisdiction, parcel));

    if (!zoningCode) {
      return NextResponse.json(
        { error: 'Could not determine zoning for parcel' },
        { status: 500 }
      );
    }

    const zoningDistrict = jurisdictionConfig.zoning_districts[zoningCode];
    if (!zoningDistrict) {
      return NextResponse.json(
        { error: `Unknown zoning district: ${zoningCode}` },
        { status: 500 }
      );
    }

    // Check floodplain status
    const floodplainStatus = await checkFloodplain(jurisdiction, parcel);

    // Run feasibility analysis
    const result = analyzeFeasibility({
      parcel_id,
      address: parcel.properties.address,
      lot_area_sqft: lotAreaSqft,
      zoning_district: zoningDistrict,
      floodplain: floodplainStatus,
      jurisdiction_config: jurisdictionConfig,
    });

    // Add parcel geometry to response
    return NextResponse.json({
      ...result,
      parcel_geometry: parcel.geometry,
    });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
