import { NextRequest, NextResponse } from 'next/server';
import { findParcelById, findParcelsByAddress } from '@/lib/data/geojson-loader';
import { ParcelLookupRequest } from '@/lib/types';

/**
 * GET /api/parcels?jurisdiction=kingston-ny&query=123+Broadway&type=address
 * Find parcels by address or parcel ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jurisdiction = searchParams.get('jurisdiction');
    const query = searchParams.get('query');
    const queryType = searchParams.get('type') as 'address' | 'parcel_id' | null;

    if (!jurisdiction || !query || !queryType) {
      return NextResponse.json(
        { error: 'Missing required parameters: jurisdiction, query, type' },
        { status: 400 }
      );
    }

    let results;

    if (queryType === 'parcel_id') {
      const parcel = await findParcelById(jurisdiction, query);
      results = parcel ? [parcel] : [];
    } else if (queryType === 'address') {
      results = await findParcelsByAddress(jurisdiction, query);
    } else {
      return NextResponse.json(
        { error: 'Invalid query type. Must be "address" or "parcel_id"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      jurisdiction,
      query,
      query_type: queryType,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in parcels API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
