import { NextRequest, NextResponse } from 'next/server';
import {
  getAllParcels,
  getZoningLayer,
  getFloodplainLayer,
} from '@/lib/data/geojson-loader';

/**
 * GET /api/layers?jurisdiction=kingston-ny&type=parcels
 * Get GeoJSON layers for map display
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jurisdiction = searchParams.get('jurisdiction');
    const layerType = searchParams.get('type');

    if (!jurisdiction || !layerType) {
      return NextResponse.json(
        { error: 'Missing required parameters: jurisdiction, type' },
        { status: 400 }
      );
    }

    let layerData;

    switch (layerType) {
      case 'parcels':
        const parcels = await getAllParcels(jurisdiction);
        layerData = {
          type: 'FeatureCollection',
          features: parcels,
        };
        break;

      case 'zoning':
        layerData = await getZoningLayer(jurisdiction);
        break;

      case 'floodplain':
        layerData = await getFloodplainLayer(jurisdiction);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid layer type. Must be: parcels, zoning, or floodplain' },
          { status: 400 }
        );
    }

    return NextResponse.json(layerData);
  } catch (error) {
    console.error('Error in layers API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
