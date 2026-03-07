import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { airports } from '../../data/airports';
import { formatCurrency } from '../../utils/formatCurrency';
import type { FlightSearchResult } from '../../types';

interface RouteSummary {
  origin: string;
  destination: string;
  cheapestPrice: number;
  waypoints: string[]; // intermediate stop codes
}

interface FlightMapProps {
  results: FlightSearchResult[];
  onRouteSelect?: (origin: string, destination: string) => void;
  selectedRoute?: { origin: string; destination: string } | null;
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 5);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }, [map, points]);
  return null;
}

/**
 * Compute a great-circle arc between two points, correctly handling the antimeridian.
 * Returns an array of LatLngTuple with possible breaks for date-line crossing.
 */
function computeGreatCircleArc(
  start: [number, number],
  end: [number, number],
  numPoints = 50,
): L.LatLngTuple[][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Determine shortest path direction across antimeridian
  let dLng = lng2 - lng1;
  if (dLng > 180) dLng -= 360;
  if (dLng < -180) dLng += 360;
  const effectiveEnd: [number, number] = [lat2, lng1 + dLng];

  // Offset for curve (quadratic bezier feel)
  const midLat = (lat1 + effectiveEnd[0]) / 2;
  const midLng = (lng1 + effectiveEnd[1]) / 2;
  const dLatC = effectiveEnd[0] - lat1;
  const dLngC = effectiveEnd[1] - lng1;
  const curvature = 0.25;
  const ctrlLat = midLat + -dLngC * curvature;
  const ctrlLng = midLng + dLatC * curvature;

  const rawPoints: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const u = 1 - t;
    const lat = u * u * lat1 + 2 * u * t * ctrlLat + t * t * effectiveEnd[0];
    const lng = u * u * lng1 + 2 * u * t * ctrlLng + t * t * effectiveEnd[1];
    rawPoints.push([lat, lng]);
  }

  // Split into segments that don't cross the antimeridian
  const segments: L.LatLngTuple[][] = [];
  let current: L.LatLngTuple[] = [];

  for (let i = 0; i < rawPoints.length; i++) {
    const [lat, lng] = rawPoints[i];
    // Normalize longitude to [-180, 180]
    const normLng = ((lng + 540) % 360) - 180;

    if (current.length > 0) {
      const prevLng = current[current.length - 1][1];
      // If jump > 180, we crossed the antimeridian — start new segment
      if (Math.abs(normLng - prevLng) > 180) {
        segments.push(current);
        current = [];
      }
    }
    current.push([lat, normLng]);
  }
  if (current.length > 0) segments.push(current);

  return segments;
}

export function FlightMap({ results, onRouteSelect, selectedRoute }: FlightMapProps) {
  // Build route summaries from results
  const routeSummaries = useMemo<RouteSummary[]>(() => {
    const routeMap = new Map<string, { prices: number[]; waypoints: Set<string> }>();
    for (const r of results) {
      const key = `${r.origin}-${r.destination}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, { prices: [], waypoints: new Set() });
      }
      const entry = routeMap.get(key)!;
      entry.prices.push(r.totalPrice);
      // Collect intermediate stop codes as waypoints
      if (r.stopCodes) {
        for (const code of r.stopCodes) entry.waypoints.add(code);
      }
    }
    return Array.from(routeMap.entries()).map(([key, val]) => {
      const [origin, destination] = key.split('-');
      return {
        origin,
        destination,
        cheapestPrice: Math.min(...val.prices),
        waypoints: Array.from(val.waypoints),
      };
    });
  }, [results]);

  const priceRange = useMemo(() => {
    const prices = routeSummaries.map((r) => r.cheapestPrice);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [routeSummaries]);

  const getRouteColor = (price: number): string => {
    if (priceRange.max === priceRange.min) return '#22C55E';
    const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min);
    if (ratio <= 0.33) return '#22C55E';
    if (ratio <= 0.66) return '#F59E0B';
    return '#EF4444';
  };

  // Collect unique airports with cheapest prices
  const uniqueAirports = useMemo(() => {
    const map = new Map<string, {
      code: string; lat: number; lng: number; city: string;
      isOrigin: boolean; isDestination: boolean; isWaypoint: boolean;
      cheapestPrice: number | null;
    }>();
    const originSet = new Set<string>();
    const destSet = new Set<string>();
    const waypointSet = new Set<string>();
    const cheapestAtAirport = new Map<string, number>();

    for (const route of routeSummaries) {
      originSet.add(route.origin);
      destSet.add(route.destination);
      for (const wp of route.waypoints) waypointSet.add(wp);

      // Track cheapest price at each airport
      for (const code of [route.origin, route.destination]) {
        const existing = cheapestAtAirport.get(code);
        if (existing === undefined || route.cheapestPrice < existing) {
          cheapestAtAirport.set(code, route.cheapestPrice);
        }
      }
    }

    for (const code of new Set([...originSet, ...destSet, ...waypointSet])) {
      const apt = airports[code];
      if (!apt) continue;
      map.set(code, {
        code,
        lat: apt.lat,
        lng: apt.lng,
        city: apt.city,
        isOrigin: originSet.has(code),
        isDestination: destSet.has(code),
        isWaypoint: waypointSet.has(code) && !originSet.has(code) && !destSet.has(code),
        cheapestPrice: cheapestAtAirport.get(code) ?? null,
      });
    }
    return Array.from(map.values());
  }, [routeSummaries]);

  // Route arcs with waypoints
  const routeArcs = useMemo(() => {
    return routeSummaries
      .map((route) => {
        const orig = airports[route.origin];
        const dest = airports[route.destination];
        if (!orig || !dest) return null;

        // Build waypoint chain: origin -> waypoints -> destination
        const allPoints: [number, number][] = [[orig.lat, orig.lng]];
        for (const wp of route.waypoints) {
          const wpApt = airports[wp];
          if (wpApt) allPoints.push([wpApt.lat, wpApt.lng]);
        }
        allPoints.push([dest.lat, dest.lng]);

        // Compute arcs between consecutive points
        const segments: L.LatLngTuple[][] = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
          const arcSegments = computeGreatCircleArc(allPoints[i], allPoints[i + 1]);
          for (const seg of arcSegments) segments.push(seg);
        }

        const isSelected = selectedRoute?.origin === route.origin && selectedRoute?.destination === route.destination;
        return { ...route, segments, isSelected };
      })
      .filter(Boolean) as (RouteSummary & { segments: L.LatLngTuple[][]; isSelected: boolean })[];
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

        {/* Route arcs — dashed lines per spec */}
        {routeArcs.map((route) => {
          const color = getRouteColor(route.cheapestPrice);
          return route.segments.map((seg, segIdx) => (
            <Polyline
              key={`${route.origin}-${route.destination}-${segIdx}`}
              positions={seg}
              pathOptions={{
                color: route.isSelected ? '#2563EB' : color,
                weight: route.isSelected ? 3.5 : 2,
                opacity: route.isSelected ? 1 : 0.7,
                dashArray: '8 4',
              }}
              eventHandlers={
                onRouteSelect
                  ? { click: () => onRouteSelect(route.origin, route.destination) }
                  : undefined
              }
            >
              <Tooltip sticky>
                <span style={{ fontWeight: 600 }}>{route.origin} → {route.destination}</span>
                {route.waypoints.length > 0 && (
                  <><br /><span style={{ fontSize: 11, color: '#6b7280' }}>via {route.waypoints.join(', ')}</span></>
                )}
                <br />
                {formatCurrency(route.cheapestPrice)}
              </Tooltip>
            </Polyline>
          ));
        })}

        {/* Waypoint markers (small gray) */}
        {uniqueAirports
          .filter((apt) => apt.isWaypoint)
          .map((apt) => (
            <CircleMarker
              key={apt.code}
              center={[apt.lat, apt.lng]}
              radius={3}
              pathOptions={{
                color: '#9CA3AF',
                fillColor: '#D1D5DB',
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                <span style={{ fontWeight: 600, fontSize: 11 }}>{apt.code}</span>
                {apt.city && <> — {apt.city}</>}
                <span style={{ color: '#9CA3AF' }}> (stop)</span>
              </Tooltip>
            </CircleMarker>
          ))}

        {/* Origin & destination markers with price labels */}
        {uniqueAirports
          .filter((apt) => !apt.isWaypoint)
          .map((apt) => (
            <CircleMarker
              key={apt.code}
              center={[apt.lat, apt.lng]}
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
              <Tooltip direction="top" offset={[0, -6]} permanent={false}>
                <span style={{ fontWeight: 600 }}>{apt.code}</span>
                {apt.city && <> — {apt.city}</>}
                {apt.cheapestPrice !== null && (
                  <><br /><span style={{ color: '#059669', fontWeight: 500 }}>from {formatCurrency(apt.cheapestPrice)}</span></>
                )}
                {apt.isOrigin && apt.isDestination && <span style={{ color: '#6B7280' }}> (origin & dest)</span>}
                {apt.isOrigin && !apt.isDestination && <span style={{ color: '#3B82F6' }}> (origin)</span>}
                {!apt.isOrigin && apt.isDestination && <span style={{ color: '#10B981' }}> (destination)</span>}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
