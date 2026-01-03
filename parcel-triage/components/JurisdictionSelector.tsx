'use client';

import { listJurisdictions } from '@/lib/config/jurisdictions';

interface JurisdictionSelectorProps {
  selectedJurisdiction: string;
  onSelect: (jurisdictionId: string) => void;
}

export default function JurisdictionSelector({
  selectedJurisdiction,
  onSelect,
}: JurisdictionSelectorProps) {
  const jurisdictions = listJurisdictions();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-2">
        Select Jurisdiction
      </label>
      <select
        id="jurisdiction"
        value={selectedJurisdiction}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      >
        {jurisdictions.map((jurisdiction) => (
          <option key={jurisdiction.id} value={jurisdiction.id}>
            {jurisdiction.name}, {jurisdiction.state}
            {jurisdiction.id === 'albany-ny' && ' (Demo)'}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">
        {selectedJurisdiction === 'kingston-ny'
          ? 'Kingston, NY - Pilot municipality with sample data'
          : 'Albany, NY - Dummy jurisdiction for portability demo'}
      </p>
    </div>
  );
}
