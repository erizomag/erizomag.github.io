import {
  calculateBuildableArea,
  calculateMaxUnitsByFAR,
  calculateMaxUnitsByParking,
  generateConstraints,
  calculateFeasibilityScore,
  analyzeFeasibility,
  FeasibilityInputs,
} from '@/lib/calculations/feasibility';
import { kingstonNY } from '@/lib/config/jurisdictions';

describe('Feasibility Calculations', () => {
  describe('calculateBuildableArea', () => {
    test('applies max coverage correctly', () => {
      expect(calculateBuildableArea(10000, 0.4)).toBe(4000);
      expect(calculateBuildableArea(5000, 0.3)).toBe(1500);
    });

    test('uses 50% default when coverage not specified', () => {
      expect(calculateBuildableArea(10000)).toBe(5000);
    });
  });

  describe('calculateMaxUnitsByFAR', () => {
    test('calculates units correctly based on FAR', () => {
      // 10,000 sqft lot, FAR 1.0, 900 sqft/unit = 11 units
      expect(calculateMaxUnitsByFAR(10000, 1.0, 900)).toBe(11);

      // 10,000 sqft lot, FAR 2.5, 900 sqft/unit = 27 units
      expect(calculateMaxUnitsByFAR(10000, 2.5, 900)).toBe(27);

      // 5,000 sqft lot, FAR 0.6, 900 sqft/unit = 3 units
      expect(calculateMaxUnitsByFAR(5000, 0.6, 900)).toBe(3);
    });

    test('floors the result to whole units', () => {
      // 10,000 sqft lot, FAR 0.5, 1100 sqft/unit = 4.54... = 4 units
      expect(calculateMaxUnitsByFAR(10000, 0.5, 1100)).toBe(4);
    });
  });

  describe('calculateMaxUnitsByParking', () => {
    test('calculates parking-constrained units correctly', () => {
      const lotArea = 10000;
      const buildableArea = 4000;
      const parkingPerUnit = 1.5;

      // Remaining area: 6000 sqft
      // Spaces available: 6000 / 180 = 33 spaces
      // Units: 33 / 1.5 = 22 units
      expect(calculateMaxUnitsByParking(lotArea, buildableArea, parkingPerUnit)).toBe(22);
    });

    test('applies parking reduction factor', () => {
      const lotArea = 10000;
      const buildableArea = 4000;
      const parkingPerUnit = 1.5;
      const reductionFactor = 0.8;

      // Adjusted parking: 1.5 * 0.8 = 1.2 per unit
      // Units: 33 / 1.2 = 27 units
      expect(
        calculateMaxUnitsByParking(lotArea, buildableArea, parkingPerUnit, reductionFactor)
      ).toBe(27);
    });

    test('returns 0 when no parking area available', () => {
      expect(calculateMaxUnitsByParking(5000, 6000, 1.5)).toBe(0);
    });
  });

  describe('generateConstraints', () => {
    const baseInputs: FeasibilityInputs = {
      parcel_id: 'TEST-001',
      lot_area_sqft: 10000,
      zoning_district: kingstonNY.zoning_districts['R3'],
      floodplain: { in_floodplain: false },
      jurisdiction_config: kingstonNY,
    };

    test('generates CRITICAL constraint when multifamily not allowed', () => {
      const inputs = {
        ...baseInputs,
        zoning_district: kingstonNY.zoning_districts['R1'],
      };

      const constraints = generateConstraints(inputs, {
        lot_area_sqft: 10000,
        buildable_area_sqft: 4000,
        max_far: 1.0,
      });

      const critical = constraints.find((c) => c.type === 'CRITICAL');
      expect(critical).toBeDefined();
      expect(critical?.message).toContain('not permitted');
    });

    test('generates CRITICAL constraint when lot too small', () => {
      const inputs = {
        ...baseInputs,
        lot_area_sqft: 3000, // R3 requires 10,000 sqft
      };

      const constraints = generateConstraints(inputs, {
        lot_area_sqft: 3000,
        buildable_area_sqft: 1200,
        max_far: 1.0,
      });

      const critical = constraints.find(
        (c) => c.type === 'CRITICAL' && c.message.includes('below minimum')
      );
      expect(critical).toBeDefined();
    });

    test('generates WARNING constraint for floodplain', () => {
      const inputs = {
        ...baseInputs,
        floodplain: { in_floodplain: true, zone: 'AE' },
      };

      const constraints = generateConstraints(inputs, {
        lot_area_sqft: 10000,
        buildable_area_sqft: 4000,
        max_far: 1.0,
      });

      const warning = constraints.find((c) => c.message.includes('floodplain'));
      expect(warning).toBeDefined();
      expect(warning?.type).toBe('WARNING');
    });

    test('generates WARNING for limited parking', () => {
      const constraints = generateConstraints(baseInputs, {
        lot_area_sqft: 10000,
        buildable_area_sqft: 4000,
        parking_capacity: 3,
        max_far: 1.0,
      });

      const warning = constraints.find((c) => c.message.includes('parking'));
      expect(warning).toBeDefined();
      expect(warning?.type).toBe('WARNING');
    });
  });

  describe('calculateFeasibilityScore', () => {
    test('returns RED when critical constraints exist', () => {
      const constraints = [
        { type: 'CRITICAL' as const, message: 'Not allowed' },
        { type: 'WARNING' as const, message: 'Floodplain' },
      ];
      expect(calculateFeasibilityScore(constraints)).toBe('RED');
    });

    test('returns YELLOW when warnings exist', () => {
      const constraints = [
        { type: 'WARNING' as const, message: 'Floodplain' },
        { type: 'INFO' as const, message: 'Small lot' },
      ];
      expect(calculateFeasibilityScore(constraints)).toBe('YELLOW');
    });

    test('returns GREEN when only info constraints exist', () => {
      const constraints = [{ type: 'INFO' as const, message: 'Small lot' }];
      expect(calculateFeasibilityScore(constraints)).toBe('GREEN');
    });

    test('returns GREEN when no constraints exist', () => {
      expect(calculateFeasibilityScore([])).toBe('GREEN');
    });
  });

  describe('analyzeFeasibility - Integration Tests', () => {
    test('analyzes feasible R3 multifamily parcel correctly', () => {
      const inputs: FeasibilityInputs = {
        parcel_id: 'TEST-001',
        address: '123 Main St',
        lot_area_sqft: 15000,
        zoning_district: kingstonNY.zoning_districts['R3'],
        floodplain: { in_floodplain: false },
        jurisdiction_config: kingstonNY,
      };

      const result = analyzeFeasibility(inputs);

      expect(result.score).toBe('GREEN');
      expect(result.zoning.multifamily_allowed).toBe(true);
      expect(result.max_units_range.max).toBeGreaterThan(0);
      expect(result.calculations.lot_area_sqft).toBe(15000);
      expect(result.calculations.buildable_area_sqft).toBe(6000); // 40% coverage
    });

    test('analyzes infeasible R1 single-family parcel correctly', () => {
      const inputs: FeasibilityInputs = {
        parcel_id: 'TEST-002',
        lot_area_sqft: 8000,
        zoning_district: kingstonNY.zoning_districts['R1'],
        floodplain: { in_floodplain: false },
        jurisdiction_config: kingstonNY,
      };

      const result = analyzeFeasibility(inputs);

      expect(result.score).toBe('RED');
      expect(result.zoning.multifamily_allowed).toBe(false);
      expect(result.max_units_range.max).toBe(0);
    });

    test('analyzes parcel in floodplain with warning', () => {
      const inputs: FeasibilityInputs = {
        parcel_id: 'TEST-003',
        lot_area_sqft: 12000,
        zoning_district: kingstonNY.zoning_districts['MU'],
        floodplain: { in_floodplain: true, zone: 'AE' },
        jurisdiction_config: kingstonNY,
      };

      const result = analyzeFeasibility(inputs);

      expect(result.score).toBe('YELLOW');
      expect(result.floodplain.in_floodplain).toBe(true);
      expect(result.constraints.some((c) => c.message.includes('floodplain'))).toBe(true);
    });

    test('FAR constrains development more than parking on small R2 lot', () => {
      const inputs: FeasibilityInputs = {
        parcel_id: 'TEST-004',
        lot_area_sqft: 6000, // Small lot
        zoning_district: kingstonNY.zoning_districts['R2'],
        floodplain: { in_floodplain: false },
        jurisdiction_config: kingstonNY,
      };

      const result = analyzeFeasibility(inputs);

      expect(result.calculations.parking_capacity).toBeDefined();
      // With R2's low FAR (0.6), FAR is the limiting factor, not parking
      // Max by FAR: 6000 * 0.6 / 900 = 4 units
      // Max by parking: ~17 units
      expect(result.max_units_range.max).toBe(4);
      expect(result.calculations.parking_capacity).toBeGreaterThan(result.max_units_range.max);
    });
  });
});
