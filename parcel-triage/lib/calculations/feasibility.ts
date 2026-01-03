import {
  FeasibilityResult,
  FeasibilityScore,
  Constraint,
  ZoningDistrict,
  FloodplainStatus,
  JurisdictionConfig,
} from '@/lib/types';

export interface FeasibilityInputs {
  parcel_id: string;
  address?: string;
  lot_area_sqft: number;
  zoning_district: ZoningDistrict;
  floodplain: FloodplainStatus;
  jurisdiction_config: JurisdictionConfig;
}

/**
 * Calculate buildable area based on lot area and coverage constraints
 */
export function calculateBuildableArea(
  lotAreaSqft: number,
  maxCoverage?: number
): number {
  if (!maxCoverage) {
    return lotAreaSqft * 0.5; // Default 50% coverage if not specified
  }
  return lotAreaSqft * maxCoverage;
}

/**
 * Calculate maximum units based on FAR (Floor Area Ratio)
 */
export function calculateMaxUnitsByFAR(
  lotAreaSqft: number,
  maxFAR: number,
  avgUnitSizeSqft: number
): number {
  const maxFloorAreaSqft = lotAreaSqft * maxFAR;
  return Math.floor(maxFloorAreaSqft / avgUnitSizeSqft);
}

/**
 * Calculate maximum units constrained by parking
 */
export function calculateMaxUnitsByParking(
  lotAreaSqft: number,
  buildableAreaSqft: number,
  parkingPerUnit: number,
  parkingReductionFactor: number = 1.0
): number {
  // Assume 180 sqft per parking space (9' x 20')
  const sqftPerSpace = 180;
  const remainingAreaForParking = lotAreaSqft - buildableAreaSqft;

  if (remainingAreaForParking <= 0) {
    return 0;
  }

  const availableSpaces = Math.floor(remainingAreaForParking / sqftPerSpace);
  const adjustedParkingPerUnit = parkingPerUnit * parkingReductionFactor;

  return Math.floor(availableSpaces / adjustedParkingPerUnit);
}

/**
 * Generate constraints based on analysis
 */
export function generateConstraints(
  inputs: FeasibilityInputs,
  calculations: FeasibilityResult['calculations']
): Constraint[] {
  const constraints: Constraint[] = [];

  // Check if multifamily is allowed
  if (!inputs.zoning_district.multifamily_allowed) {
    constraints.push({
      type: 'CRITICAL',
      message: `Multifamily not permitted in ${inputs.zoning_district.code} zone`,
      impact: 'Project not feasible without zoning variance or rezoning',
    });
  }

  // Check minimum lot area
  if (
    inputs.zoning_district.min_lot_area_sqft &&
    inputs.lot_area_sqft < inputs.zoning_district.min_lot_area_sqft
  ) {
    constraints.push({
      type: 'CRITICAL',
      message: `Lot area ${inputs.lot_area_sqft.toLocaleString()} sqft is below minimum ${inputs.zoning_district.min_lot_area_sqft.toLocaleString()} sqft for ${inputs.zoning_district.code} zone`,
      impact: 'Does not meet minimum lot size requirement',
    });
  }

  // Floodplain warning
  if (inputs.floodplain.in_floodplain) {
    constraints.push({
      type: 'WARNING',
      message: `Parcel is in floodplain zone ${inputs.floodplain.zone || 'unknown'}`,
      impact: 'May require elevated construction, flood insurance, and additional permitting',
    });
  }

  // Parking constraint
  if (calculations.parking_capacity !== undefined && calculations.parking_capacity < 5) {
    constraints.push({
      type: 'WARNING',
      message: 'Limited parking capacity may constrain development',
      impact: 'Consider parking reduction strategies or shared parking agreements',
    });
  }

  // Small lot info
  if (inputs.lot_area_sqft < 5000) {
    constraints.push({
      type: 'INFO',
      message: 'Small lot size may limit development potential',
      impact: 'Consider vertical development or compact unit layouts',
    });
  }

  return constraints;
}

/**
 * Calculate feasibility score based on constraints
 */
export function calculateFeasibilityScore(constraints: Constraint[]): FeasibilityScore {
  const hasCritical = constraints.some((c) => c.type === 'CRITICAL');
  const warningCount = constraints.filter((c) => c.type === 'WARNING').length;

  if (hasCritical) {
    return 'RED';
  }

  if (warningCount >= 2) {
    return 'YELLOW';
  }

  if (warningCount === 1) {
    return 'YELLOW';
  }

  return 'GREEN';
}

/**
 * Main feasibility analysis function
 */
export function analyzeFeasibility(inputs: FeasibilityInputs): FeasibilityResult {
  const { lot_area_sqft, zoning_district, jurisdiction_config } = inputs;

  // Calculate buildable area
  const buildable_area_sqft = calculateBuildableArea(
    lot_area_sqft,
    zoning_district.max_lot_coverage
  );

  // Calculate max units by FAR
  let maxUnitsByFAR = 0;
  if (zoning_district.max_far) {
    maxUnitsByFAR = calculateMaxUnitsByFAR(
      lot_area_sqft,
      zoning_district.max_far,
      jurisdiction_config.default_assumptions.avg_unit_size_sqft
    );
  }

  // Calculate max units by parking (if parking is required)
  let maxUnitsByParking: number | undefined;
  if (zoning_district.min_parking_per_unit) {
    maxUnitsByParking = calculateMaxUnitsByParking(
      lot_area_sqft,
      buildable_area_sqft,
      zoning_district.min_parking_per_unit,
      jurisdiction_config.default_assumptions.parking_reduction_factor
    );
  }

  // Determine realistic max units (most conservative constraint wins)
  let maxUnits = maxUnitsByFAR || Math.floor(buildable_area_sqft / jurisdiction_config.default_assumptions.avg_unit_size_sqft);

  if (maxUnitsByParking !== undefined && maxUnitsByParking < maxUnits) {
    maxUnits = maxUnitsByParking;
  }

  // If multifamily not allowed, set units to 0
  if (!zoning_district.multifamily_allowed) {
    maxUnits = 0;
  }

  // Ensure at least 2 units for multifamily projects
  const minUnits = zoning_district.multifamily_allowed && maxUnits >= 2 ? 2 : 0;

  // Build calculations object
  const calculations = {
    lot_area_sqft,
    buildable_area_sqft,
    parking_capacity: maxUnitsByParking,
    max_far: zoning_district.max_far,
    applied_far: zoning_district.max_far
      ? (maxUnits * jurisdiction_config.default_assumptions.avg_unit_size_sqft) / lot_area_sqft
      : undefined,
  };

  // Generate constraints
  const constraints = generateConstraints(inputs, calculations);

  // Calculate score
  const score = calculateFeasibilityScore(constraints);

  return {
    parcel_id: inputs.parcel_id,
    address: inputs.address,
    score,
    max_units_range: {
      min: minUnits,
      max: maxUnits,
    },
    constraints,
    calculations,
    zoning: {
      district: zoning_district.code,
      multifamily_allowed: zoning_district.multifamily_allowed,
    },
    floodplain: inputs.floodplain,
  };
}
