import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { airports } from '../../data/airports';
import { computeBezierArcSegments } from '../../utils/bezierArc';
import { formatCurrency } from '../../utils/formatCurrency';

interface RouteSummary {
  origin: string;
  destination: string;
  cheapestPrice: number;
}

interface ScatterSearchMapProps {
  routeSummaries: RouteSummary[];
  onRouteSelect: (origin: string, destination: string) => void;
  selectedRoute: { origin: string; destination: string } | null;
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 5);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lng] as L.LatLngTuple),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }, [map, points]);

  return null;
}

export function ScatterSearchMap({ routeSummaries, onRouteSelect, selectedRoute }: ScatterSearchMapProps) {
  const priceRange = useMemo(() => {
    const prices = routeSummaries.map((r) => r.cheapestPrice);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [routeSummaries]);

  const getRouteColor = (price: number): string => {
    if (priceRange.max === priceRange.min) return '#22C55E';
    const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min);
    if (ratio <= 0.33) return '#22C55E'; // green
    if (ratio <= 0.66) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  // Collect unique airports
  const uniqueAirports = useMemo(() => {
    const map = new Map<string, { code: string; lat: number; lng: number; city: string; isOrigin: boolean; isDestination: boolean }>();
    const originSet = new Set<string>();
    const destSet = new Set<string>();

    for (const route of routeSummaries) {
      originSet.add(route.origin);
      destSet.add(route.destination);
    }

    for (const code of new Set([...originSet, ...destSet])) {
      const apt = airports[code];
      if (!apt) continue;
      map.set(code, {
        code,
        lat: apt.lat,
        lng: apt.lng,
        city: apt.city,
        isOrigin: originSet.has(code),
        isDestination: destSet.has(code),
      });
    }
    return Array.from(map.values());
  }, [routeSummaries]);

  // Route arcs with resolved coordinates
  const routeArcs = useMemo(() => {
    return routeSummaries
      .map((route) => {
        const orig = airports[route.origin];
        const dest = airports[route.destination];
        if (!orig || !dest) return null;
        const segments = computeBezierArcSegments([orig.lat, orig.lng], [dest.lat, dest.lng]);
        const isSelected = selectedRoute?.origin === route.origin && selectedRoute?.destination === route.destination;
        return { ...route, segments, isSelected, origLat: orig.lat, origLng: orig.lng, destLat: dest.lat, destLng: dest.lng };
      })
      .filter(Boolean) as (RouteSummary & {
        segments: L.LatLngTuple[][];
        isSelected: boolean;
        origLat: number;
        origLng: number;
        destLat: number;
        destLng: number;
      })[];
  }, [routeSummaries, selectedRoute]);

  if (uniqueAirports.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No routes to display on map
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[300px]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', minHeight: 300 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={uniqueAirports} />

        {/* Route arcs — repeated at world copy offsets so they appear when zoomed out */}
        {[-360, 0, 360].map((lngOffset) =>
          routeArcs.map((route) => {
            const color = getRouteColor(route.cheapestPrice);
            return route.segments.map((seg, segIdx) => (
              <Polyline
                key={`${route.origin}-${route.destination}-${segIdx}-${lngOffset}`}
                positions={seg.map(([lat, lng]) => [lat, lng + lngOffset] as L.LatLngTuple)}
                pathOptions={{
                  color: route.isSelected ? '#2563EB' : color,
                  weight: route.isSelected ? 3.5 : 2,
                  opacity: route.isSelected ? 1 : 0.7,
                  dashArray: undefined,
                }}
                eventHandlers={{
                  click: () => onRouteSelect(route.origin, route.destination),
                }}
              >
                <Tooltip sticky>
                  <span style={{ fontWeight: 600 }}>{route.origin} → {route.destination}</span>
                  <br />
                  {formatCurrency(route.cheapestPrice)}
                </Tooltip>
              </Polyline>
            ));
          })
        )}

        {/* Airport markers — repeated at world copy offsets */}
        {[-360, 0, 360].map((lngOffset) =>
          uniqueAirports.map((apt) => (
            <CircleMarker
              key={`${apt.code}-${lngOffset}`}
              center={[apt.lat, apt.lng + lngOffset]}
              radius={5}
              pathOptions={apt.isOrigin ? {
                color: '#1E40AF',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                weight: 2,
              } : {
                color: '#065F46',
                fillColor: '#10B981',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span style={{ fontWeight: 600 }}>{apt.code}</span>
                {apt.city && <> — {apt.city}</>}
                {apt.isOrigin && apt.isDestination && <span style={{ color: '#6B7280' }}> (origin & dest)</span>}
                {apt.isOrigin && !apt.isDestination && <span style={{ color: '#3B82F6' }}> (origin)</span>}
                {!apt.isOrigin && apt.isDestination && <span style={{ color: '#10B981' }}> (destination)</span>}
              </Tooltip>
            </CircleMarker>
          ))
        )}
      </MapContainer>
    </div>
  );
}
