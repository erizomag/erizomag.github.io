import { Feature, FeatureCollection, Geometry } from 'geojson';
import * as turf from '@turf/turf';
import { ParcelFeature } from '@/lib/types';
import path from 'path';
import fs from 'fs';

/**
 * Load GeoJSON from the data directory
 */
export async function loadGeoJSON<T = any>(
  filePath: string
): Promise<FeatureCollection<Geometry, T>> {
  const fullPath = path.join(process.cwd(), 'data', filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`GeoJSON file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(fileContent) as FeatureCollection<Geometry, T>;
}

/**
 * Find parcel by parcel ID
 */
export async function findParcelById(
  jurisdiction: string,
  parcelId: string
): Promise<ParcelFeature | null> {
  const parcelsPath = `${jurisdiction}/parcels/parcels.geojson`;
  const parcels = await loadGeoJSON<ParcelFeature['properties']>(parcelsPath);

  const found = parcels.features.find(
    (f) => f.properties.parcel_id === parcelId
  );

  return found ? (found as ParcelFeature) : null;
}

/**
 * Find parcels by address (fuzzy search)
 */
export async function findParcelsByAddress(
  jurisdiction: string,
  address: string
): Promise<ParcelFeature[]> {
  const parcelsPath = `${jurisdiction}/parcels/parcels.geojson`;
  const parcels = await loadGeoJSON<ParcelFeature['properties']>(parcelsPath);

  const searchTerm = address.toLowerCase().trim();

  const matches = parcels.features.filter((f) => {
    const parcelAddress = f.properties.address?.toLowerCase() || '';
    return parcelAddress.includes(searchTerm);
  });

  return matches as ParcelFeature[];
}

/**
 * Find which zoning district contains a point or parcel
 */
export async function findZoningForParcel(
  jurisdiction: string,
  parcel: ParcelFeature
): Promise<string | null> {
  const zoningPath = `${jurisdiction}/zoning/zoning.geojson`;
  const zoningData = await loadGeoJSON(zoningPath);

  // Get the centroid of the parcel
  const centroid = turf.centroid(parcel);

  // Find which zoning polygon contains this point
  for (const zone of zoningData.features) {
    if (turf.booleanPointInPolygon(centroid, zone as any)) {
      return zone.properties?.zone_code || null;
    }
  }

  return null;
}

/**
 * Check if parcel is in floodplain
 */
export async function checkFloodplain(
  jurisdiction: string,
  parcel: ParcelFeature
): Promise<{ in_floodplain: boolean; zone?: string }> {
  const floodplainPath = `${jurisdiction}/floodplain/floodplain.geojson`;

  let floodplainData: FeatureCollection;
  try {
    floodplainData = await loadGeoJSON(floodplainPath);
  } catch (error) {
    // If no floodplain data available, assume not in floodplain
    return { in_floodplain: false };
  }

  // Check if parcel intersects with any floodplain zone
  for (const floodZone of floodplainData.features) {
    const intersection = turf.intersect(
      turf.featureCollection([parcel as any, floodZone as any])
    );

    if (intersection) {
      return {
        in_floodplain: true,
        zone: floodZone.properties?.fld_zone,
      };
    }
  }

  return { in_floodplain: false };
}

/**
 * Get all parcels for a jurisdiction (for map display)
 */
export async function getAllParcels(
  jurisdiction: string
): Promise<ParcelFeature[]> {
  const parcelsPath = `${jurisdiction}/parcels/parcels.geojson`;
  const parcels = await loadGeoJSON<ParcelFeature['properties']>(parcelsPath);
  return parcels.features as ParcelFeature[];
}

/**
 * Get zoning layer for map display
 */
export async function getZoningLayer(
  jurisdiction: string
): Promise<FeatureCollection> {
  const zoningPath = `${jurisdiction}/zoning/zoning.geojson`;
  return loadGeoJSON(zoningPath);
}

/**
 * Get floodplain layer for map display
 */
export async function getFloodplainLayer(
  jurisdiction: string
): Promise<FeatureCollection> {
  const floodplainPath = `${jurisdiction}/floodplain/floodplain.geojson`;
  return loadGeoJSON(floodplainPath);
}
