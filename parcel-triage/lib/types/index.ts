import { Feature, Polygon, MultiPolygon } from 'geojson';

export interface ParcelFeature extends Feature<Polygon | MultiPolygon> {
  properties: {
    parcel_id: string;
    address?: string;
    lot_area_sqft?: number;
    zoning?: string;
    [key: string]: any;
  };
}

export interface ZoningDistrict {
  code: string;
  name: string;
  multifamily_allowed: boolean;
  min_lot_area_sqft?: number;
  max_far?: number;
  max_lot_coverage?: number;
  min_parking_per_unit?: number;
  max_height_ft?: number;
  setback_requirements?: {
    front?: number;
    side?: number;
    rear?: number;
  };
}

export interface FloodplainStatus {
  in_floodplain: boolean;
  zone?: string;
}

export type FeasibilityScore = 'GREEN' | 'YELLOW' | 'RED';

export interface Constraint {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  impact?: string;
}

export interface FeasibilityResult {
  parcel_id: string;
  address?: string;
  score: FeasibilityScore;
  max_units_range: {
    min: number;
    max: number;
  };
  constraints: Constraint[];
  calculations: {
    lot_area_sqft: number;
    buildable_area_sqft: number;
    parking_capacity?: number;
    max_far?: number;
    applied_far?: number;
  };
  zoning: {
    district: string;
    multifamily_allowed: boolean;
  };
  floodplain: FloodplainStatus;
}

export interface JurisdictionConfig {
  id: string;
  name: string;
  state: string;
  data_sources: {
    parcels: string;
    zoning: string;
    floodplain: string;
  };
  zoning_districts: Record<string, ZoningDistrict>;
  default_assumptions: {
    avg_unit_size_sqft: number;
    parking_reduction_factor: number;
  };
}

export interface ParcelLookupRequest {
  jurisdiction: string;
  query: string;
  query_type: 'address' | 'parcel_id';
}

export interface AnalysisRequest {
  jurisdiction: string;
  parcel_id: string;
  use_type: 'multifamily';
}
