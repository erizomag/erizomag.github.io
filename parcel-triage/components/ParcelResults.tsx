'use client';

import { ParcelFeature } from '@/lib/types';

interface ParcelResultsProps {
  results: ParcelFeature[];
  onSelect: (parcel: ParcelFeature) => void;
}

export default function ParcelResults({ results, onSelect }: ParcelResultsProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No parcels found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Found {results.length} {results.length === 1 ? 'Parcel' : 'Parcels'}
      </h3>

      <div className="space-y-3">
        {results.map((parcel) => (
          <button
            key={parcel.properties.parcel_id}
            onClick={() => onSelect(parcel)}
            className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-medium text-gray-900">
              {parcel.properties.address || 'No address'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Parcel ID: {parcel.properties.parcel_id}
            </div>
            {parcel.properties.zoning && (
              <div className="text-sm text-gray-600">
                Zoning: {parcel.properties.zoning}
              </div>
            )}
            {parcel.properties.lot_area_sqft && (
              <div className="text-sm text-gray-600">
                Lot Area: {parcel.properties.lot_area_sqft.toLocaleString()} sqft
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
