import { JurisdictionConfig } from '@/lib/types';

/**
 * Kingston, NY Jurisdiction Configuration
 *
 * Data sources:
 * - Parcels: Ulster County GIS (https://gis.co.ulster.ny.us/)
 * - Zoning: City of Kingston zoning map
 * - Floodplain: FEMA National Flood Hazard Layer
 *
 * Zoning districts simplified for MVP based on Kingston's zoning code.
 * Full code: https://ecode360.com/KI0375
 */
export const kingstonNY: JurisdictionConfig = {
  id: 'kingston-ny',
  name: 'Kingston',
  state: 'NY',
  data_sources: {
    parcels: '/data/kingston-ny/parcels/parcels.geojson',
    zoning: '/data/kingston-ny/zoning/zoning.geojson',
    floodplain: '/data/kingston-ny/floodplain/floodplain.geojson',
  },
  zoning_districts: {
    'R1': {
      code: 'R1',
      name: 'Single-Family Residential',
      multifamily_allowed: false,
      min_lot_area_sqft: 6000,
      max_lot_coverage: 0.30,
      min_parking_per_unit: 2.0,
      max_height_ft: 35,
    },
    'R2': {
      code: 'R2',
      name: 'Two-Family Residential',
      multifamily_allowed: true,
      min_lot_area_sqft: 5000,
      max_far: 0.6,
      max_lot_coverage: 0.35,
      min_parking_per_unit: 1.5,
      max_height_ft: 35,
    },
    'R3': {
      code: 'R3',
      name: 'Multifamily Residential',
      multifamily_allowed: true,
      min_lot_area_sqft: 10000,
      max_far: 1.0,
      max_lot_coverage: 0.40,
      min_parking_per_unit: 1.5,
      max_height_ft: 45,
    },
    'MU': {
      code: 'MU',
      name: 'Mixed Use',
      multifamily_allowed: true,
      min_lot_area_sqft: 5000,
      max_far: 2.5,
      max_lot_coverage: 0.70,
      min_parking_per_unit: 1.0,
      max_height_ft: 60,
    },
    'C1': {
      code: 'C1',
      name: 'Neighborhood Commercial',
      multifamily_allowed: true,
      min_lot_area_sqft: 3000,
      max_far: 1.5,
      max_lot_coverage: 0.60,
      min_parking_per_unit: 1.0,
      max_height_ft: 45,
    },
  },
  default_assumptions: {
    avg_unit_size_sqft: 900,
    parking_reduction_factor: 0.8, // 20% reduction for transit-accessible areas
  },
};

// Registry of all jurisdictions
export const jurisdictions: Record<string, JurisdictionConfig> = {
  'kingston-ny': kingstonNY,
};

export function getJurisdiction(id: string): JurisdictionConfig | null {
  return jurisdictions[id] || null;
}

export function listJurisdictions(): JurisdictionConfig[] {
  return Object.values(jurisdictions);
}
