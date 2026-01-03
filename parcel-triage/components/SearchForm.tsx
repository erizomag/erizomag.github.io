'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSearch: (query: string, type: 'address' | 'parcel_id') => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'address' | 'parcel_id'>('address');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Search for a Parcel
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="search-type" className="block text-sm font-medium text-gray-700 mb-1">
            Search By
          </label>
          <select
            id="search-type"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'address' | 'parcel_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="address">Address</option>
            <option value="parcel_id">Parcel ID</option>
          </select>
        </div>

        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
            {searchType === 'address' ? 'Street Address' : 'Parcel ID'}
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchType === 'address'
                ? 'e.g., 123 Broadway'
                : 'e.g., 48.28-1-1'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search Parcel'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <p><strong>Jurisdiction:</strong> Kingston, NY (MVP)</p>
        <p><strong>Use Type:</strong> Multifamily Development</p>
      </div>
    </div>
  );
}
