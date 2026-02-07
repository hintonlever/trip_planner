import { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ChevronUp, ChevronDown, Map as MapIcon } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { airports } from '../../data/airports';
import { computeBezierArc } from '../../utils/bezierArc';
import type { FlightCostItem } from '../../types';

const COLUMN_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

interface AirportPoint {
  code: string;
  lat: number;
  lng: number;
  city: string;
  isTransit?: boolean;
}

interface FlightRoute {
  /** All airports in order: origin, stops, destination */
  waypoints: AirportPoint[];
}

interface RouteGroup {
  colId: string;
  colIndex: number;
  columnName: string;
  routes: FlightRoute[];
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

function InvalidateSize({ collapsed }: { collapsed: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!collapsed) {
      // Small delay so the CSS transition finishes before Leaflet recalculates
      const timer = setTimeout(() => map.invalidateSize(), 300);
      return () => clearTimeout(timer);
    }
  }, [map, collapsed]);
  return null;
}

export function TripMap() {
  const [collapsed, setCollapsed] = useState(false);
  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const items = useTripStore((s) => s.items);

  const routeGroups = useMemo(() => {
    const groups: RouteGroup[] = [];
    columnOrder.forEach((colId, colIndex) => {
      const column = columns[colId];
      if (!column) return;

      const routes: FlightRoute[] = [];
      for (const itemId of column.itemIds) {
        const item = items[itemId];
        if (!item || item.type !== 'flight') continue;
        const flight = item as FlightCostItem;
        const codes = [flight.origin, ...(flight.stopCodes ?? []), flight.destination];
        const waypoints: AirportPoint[] = [];
        for (let i = 0; i < codes.length; i++) {
          const apt = airports[codes[i].toUpperCase()];
          if (!apt) continue;
          waypoints.push({
            code: codes[i].toUpperCase(),
            lat: apt.lat,
            lng: apt.lng,
            city: apt.city,
            isTransit: i > 0 && i < codes.length - 1,
          });
        }
        if (waypoints.length >= 2) {
          routes.push({ waypoints });
        }
      }

      if (routes.length > 0) {
        groups.push({ colId, colIndex, columnName: column.name, routes });
      }
    });
    return groups;
  }, [columnOrder, columns, items]);

  const uniqueAirports = useMemo(() => {
    const map = new Map<string, AirportPoint>();
    for (const group of routeGroups) {
      for (const route of group.routes) {
        for (const wp of route.waypoints) {
          if (!map.has(wp.code)) {
            map.set(wp.code, wp);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [routeGroups]);

  if (uniqueAirports.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-gray-200 relative z-0 flex-shrink-0">
      {/* Map container with animated height */}
      <div
        className="w-full overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: collapsed ? 0 : 256 }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: 256, width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={uniqueAirports} />
          <InvalidateSize collapsed={collapsed} />

          {/* Flight route arcs — one arc per segment */}
          {routeGroups.map((group) => {
            const color = COLUMN_COLORS[group.colIndex % COLUMN_COLORS.length];
            return group.routes.map((route, ri) =>
              route.waypoints.slice(0, -1).map((wp, si) => {
                const next = route.waypoints[si + 1];
                const arc = computeBezierArc(
                  [wp.lat, wp.lng],
                  [next.lat, next.lng],
                );
                return (
                  <Polyline
                    key={`${group.colId}-${ri}-${wp.code}-${next.code}`}
                    positions={arc}
                    pathOptions={{
                      color,
                      weight: 2.5,
                      opacity: 0.8,
                      dashArray: '8 4',
                    }}
                  />
                );
              }),
            );
          })}

          {/* Airport markers */}
          {uniqueAirports.map((apt) => (
            <CircleMarker
              key={apt.code}
              center={[apt.lat, apt.lng]}
              radius={apt.isTransit ? 3.5 : 5}
              pathOptions={apt.isTransit ? {
                color: '#C2410C',
                fillColor: '#F97316',
                fillOpacity: 1,
                weight: 1.5,
              } : {
                color: '#1E40AF',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span style={{ fontWeight: 600 }}>{apt.code}</span> — {apt.city}
                {apt.isTransit && <span style={{ color: '#C2410C' }}> (transit)</span>}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        {routeGroups.length > 1 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 z-[1000] text-xs space-y-1">
            {routeGroups.map((group) => (
              <div key={group.colId} className="flex items-center gap-2">
                <span
                  className="w-4 h-0.5 inline-block rounded-full"
                  style={{ backgroundColor: COLUMN_COLORS[group.colIndex % COLUMN_COLORS.length] }}
                />
                <span className="text-gray-700 font-medium">{group.columnName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapse/expand toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[1000] bg-white border border-gray-300 rounded-full px-3 py-0.5 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs text-gray-600"
      >
        <MapIcon className="w-3 h-3" />
        {collapsed ? (
          <>
            Show map <ChevronDown className="w-3 h-3" />
          </>
        ) : (
          <>
            Hide map <ChevronUp className="w-3 h-3" />
          </>
        )}
      </button>
    </div>
  );
}
