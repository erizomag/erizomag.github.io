'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SearchForm from '@/components/SearchForm';
import ParcelResults from '@/components/ParcelResults';
import FeasibilityDisplay from '@/components/FeasibilityDisplay';
import JurisdictionSelector from '@/components/JurisdictionSelector';
import { ParcelFeature, FeasibilityResult } from '@/lib/types';

// Dynamically import map to avoid SSR issues with Leaflet
const ParcelMap = dynamic(() => import('@/components/ParcelMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [jurisdiction, setJurisdiction] = useState('kingston-ny');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<ParcelFeature[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null);
  const [feasibilityResult, setFeasibilityResult] = useState<FeasibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJurisdictionChange = (newJurisdiction: string) => {
    setJurisdiction(newJurisdiction);
    // Reset state when jurisdiction changes
    setSearchResults([]);
    setSelectedParcel(null);
    setFeasibilityResult(null);
    setError(null);
  };

  const handleSearch = async (query: string, type: 'address' | 'parcel_id') => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedParcel(null);
    setFeasibilityResult(null);

    try {
      const params = new URLSearchParams({
        jurisdiction,
        query,
        type,
      });

      const response = await fetch(`/api/parcels?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search parcels');
      }

      const data = await response.json();
      setSearchResults(data.results);

      // Auto-select if only one result
      if (data.results.length === 1) {
        handleSelectParcel(data.results[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectParcel = async (parcel: ParcelFeature) => {
    setSelectedParcel(parcel);
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jurisdiction,
          parcel_id: parcel.properties.parcel_id,
          use_type: 'multifamily',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze parcel');
      }

      const result = await response.json();
      setFeasibilityResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search and Results */}
        <div className="lg:col-span-1 space-y-6">
          <JurisdictionSelector
            selectedJurisdiction={jurisdiction}
            onSelect={handleJurisdictionChange}
          />

          <SearchForm onSearch={handleSearch} isLoading={isSearching} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {searchResults.length > 0 && !selectedParcel && (
            <ParcelResults results={searchResults} onSelect={handleSelectParcel} />
          )}

          {isAnalyzing && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Analyzing parcel...</span>
              </div>
            </div>
          )}

          {feasibilityResult && (
            <FeasibilityDisplay result={feasibilityResult} />
          )}
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 h-[600px] lg:h-[800px]">
            <ParcelMap
              selectedParcel={selectedParcel || undefined}
              feasibilityResult={feasibilityResult || undefined}
              jurisdiction={jurisdiction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
