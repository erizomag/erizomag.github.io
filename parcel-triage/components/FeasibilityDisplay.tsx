'use client';

import { FeasibilityResult } from '@/lib/types';

interface FeasibilityDisplayProps {
  result: FeasibilityResult;
}

const scoreColors = {
  GREEN: 'bg-green-100 text-green-800 border-green-300',
  YELLOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  RED: 'bg-red-100 text-red-800 border-red-300',
};

const scoreLabels = {
  GREEN: 'Feasible',
  YELLOW: 'Conditional',
  RED: 'Not Feasible',
};

export default function FeasibilityDisplay({ result }: FeasibilityDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Score Header */}
      <div className={`p-6 border-b-4 ${scoreColors[result.score]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{scoreLabels[result.score]}</h2>
            <p className="text-sm mt-1">
              {result.address || `Parcel ${result.parcel_id}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {result.max_units_range.min === result.max_units_range.max
                ? result.max_units_range.max
                : `${result.max_units_range.min}-${result.max_units_range.max}`}
            </div>
            <div className="text-sm">Estimated Units</div>
          </div>
        </div>
      </div>

      {/* Zoning Info */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Zoning & Basics</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600">Zoning District</dt>
            <dd className="font-medium text-gray-900">{result.zoning.district}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Multifamily Allowed</dt>
            <dd className="font-medium text-gray-900">
              {result.zoning.multifamily_allowed ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600">In Floodplain</dt>
            <dd className="font-medium text-gray-900">
              {result.floodplain.in_floodplain ? `Yes (${result.floodplain.zone})` : 'No'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Calculations */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Key Calculations</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Lot Area</dt>
            <dd className="font-medium text-gray-900">
              {result.calculations.lot_area_sqft.toLocaleString()} sqft
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Buildable Area</dt>
            <dd className="font-medium text-gray-900">
              {result.calculations.buildable_area_sqft.toLocaleString()} sqft
            </dd>
          </div>
          {result.calculations.max_far && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Max FAR</dt>
              <dd className="font-medium text-gray-900">{result.calculations.max_far}</dd>
            </div>
          )}
          {result.calculations.applied_far && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Applied FAR</dt>
              <dd className="font-medium text-gray-900">
                {result.calculations.applied_far.toFixed(2)}
              </dd>
            </div>
          )}
          {result.calculations.parking_capacity !== undefined && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Parking Capacity</dt>
              <dd className="font-medium text-gray-900">
                {result.calculations.parking_capacity} spaces
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Constraints */}
      {result.constraints.length > 0 && (
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Constraints & Considerations</h3>
          <div className="space-y-3">
            {result.constraints.map((constraint, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  constraint.type === 'CRITICAL'
                    ? 'bg-red-50 border-red-200'
                    : constraint.type === 'WARNING'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded mr-2 ${
                      constraint.type === 'CRITICAL'
                        ? 'bg-red-200 text-red-800'
                        : constraint.type === 'WARNING'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {constraint.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{constraint.message}</p>
                    {constraint.impact && (
                      <p className="text-xs text-gray-600 mt-1">{constraint.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
