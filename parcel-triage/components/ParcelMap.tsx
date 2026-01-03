'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ParcelFeature, FeasibilityResult } from '@/lib/types';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ParcelMapProps {
  selectedParcel?: ParcelFeature;
  feasibilityResult?: FeasibilityResult;
  jurisdiction: string;
}

export default function ParcelMap({
  selectedParcel,
  feasibilityResult,
  jurisdiction,
}: ParcelMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{
    parcels?: L.GeoJSON;
    zoning?: L.GeoJSON;
    floodplain?: L.GeoJSON;
    selectedParcel?: L.GeoJSON;
  }>({});

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Kingston, NY
    const map = L.map(mapContainerRef.current).setView([41.9279, -73.9971], 14);

    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Load initial layers
    loadLayers(map, jurisdiction);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [jurisdiction]);

  // Load GeoJSON layers
  const loadLayers = async (map: L.Map, jurisdiction: string) => {
    try {
      // Load parcels layer
      const parcelsResponse = await fetch(`/api/layers?jurisdiction=${jurisdiction}&type=parcels`);
      if (parcelsResponse.ok) {
        const parcelsData = await parcelsResponse.json();
        layersRef.current.parcels = L.geoJSON(parcelsData, {
          style: {
            color: '#666',
            weight: 1,
            fillOpacity: 0,
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div class="p-2">
                <strong>${feature.properties.address || 'No address'}</strong><br/>
                Parcel: ${feature.properties.parcel_id}<br/>
                Zoning: ${feature.properties.zoning || 'Unknown'}
              </div>
            `);
          },
        }).addTo(map);
      }

      // Load zoning layer
      const zoningResponse = await fetch(`/api/layers?jurisdiction=${jurisdiction}&type=zoning`);
      if (zoningResponse.ok) {
        const zoningData = await zoningResponse.json();
        layersRef.current.zoning = L.geoJSON(zoningData, {
          style: (feature) => ({
            color: getZoningColor(feature?.properties?.zone_code),
            weight: 2,
            fillOpacity: 0.15,
          }),
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div class="p-2">
                <strong>${feature.properties.zone_name}</strong><br/>
                Code: ${feature.properties.zone_code}
              </div>
            `);
          },
        }).addTo(map);
      }

      // Load floodplain layer
      const floodplainResponse = await fetch(`/api/layers?jurisdiction=${jurisdiction}&type=floodplain`);
      if (floodplainResponse.ok) {
        const floodplainData = await floodplainResponse.json();
        layersRef.current.floodplain = L.geoJSON(floodplainData, {
          style: {
            color: '#0066cc',
            weight: 2,
            fillOpacity: 0.3,
            fillColor: '#0066cc',
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div class="p-2">
                <strong>Floodplain Zone ${feature.properties.fld_zone}</strong>
              </div>
            `);
          },
        }).addTo(map);
      }
    } catch (error) {
      console.error('Error loading map layers:', error);
    }
  };

  // Get color based on zoning code
  const getZoningColor = (zoneCode?: string): string => {
    if (!zoneCode) return '#999';

    const colors: Record<string, string> = {
      R1: '#90EE90',
      R2: '#98FB98',
      R3: '#32CD32',
      MU: '#FFD700',
      C1: '#FF6347',
    };

    return colors[zoneCode] || '#999';
  };

  // Get color based on feasibility score
  const getFeasibilityColor = (score: string): string => {
    const colors = {
      GREEN: '#10b981',
      YELLOW: '#f59e0b',
      RED: '#ef4444',
    };
    return colors[score as keyof typeof colors] || '#6b7280';
  };

  // Update selected parcel highlight
  useEffect(() => {
    if (!mapRef.current || !selectedParcel) return;

    // Remove previous selection
    if (layersRef.current.selectedParcel) {
      mapRef.current.removeLayer(layersRef.current.selectedParcel);
    }

    // Add new selection
    const color = feasibilityResult
      ? getFeasibilityColor(feasibilityResult.score)
      : '#3b82f6';

    layersRef.current.selectedParcel = L.geoJSON(selectedParcel, {
      style: {
        color: color,
        weight: 3,
        fillOpacity: 0.3,
        fillColor: color,
      },
    }).addTo(mapRef.current);

    // Zoom to selected parcel
    const bounds = layersRef.current.selectedParcel.getBounds();
    mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
  }, [selectedParcel, feasibilityResult]);

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-sm max-w-xs z-[1000]">
        <h4 className="font-semibold text-gray-900 mb-2">Map Layers</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-gray-600 mr-2"></div>
            <span className="text-gray-700">Parcel Boundaries</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 opacity-40 border border-green-600 mr-2"></div>
            <span className="text-gray-700">Residential Zoning</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 opacity-40 border border-yellow-600 mr-2"></div>
            <span className="text-gray-700">Mixed Use Zoning</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-400 opacity-40 border border-blue-600 mr-2"></div>
            <span className="text-gray-700">Floodplain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
