import { useState, useMemo, useCallback } from 'react';
import type { ScatterSearchRouteResult, FlightSearchResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { ScatterSearchMap } from './ScatterSearchMap';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseDuration, formatDuration } from '../../utils/flightUtils';
import { Table2, Map as MapIcon } from 'lucide-react';

type ViewMode = 'table' | 'map';
type StopsFilter = 'any' | 'direct' | '1stop' | '2stop';
type DurationFilter = number | null; // minutes

function carrierLabel(r: FlightSearchResult): string {
  if (!r.segments || r.segments.length === 0) return r.airlineName;
  const names = new Set<string>();
  for (const seg of r.segments) names.add(seg.airlineName);
  if (names.size === 1) return [...names][0];
  return 'Mixed';
}

function getHour(isoDate: string): number {
  const d = new Date(isoDate);
  return d.getHours() + d.getMinutes() / 60;
}

interface ScatterSearchResultsProps {
  routeResults: ScatterSearchRouteResult[];
  passengers: number;
}

export function ScatterSearchResults({ routeResults, passengers }: ScatterSearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>('any');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [depRange, setDepRange] = useState<[number, number]>([0, 24]);
  const [arrRange, setArrRange] = useState<[number, number]>([0, 24]);
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null);

  const durationOptions: { label: string; value: number }[] = [
    { label: '< 6h', value: 360 },
    { label: '< 10h', value: 600 },
    { label: '< 14h', value: 840 },
    { label: '< 18h', value: 1080 },
    { label: '< 24h', value: 1440 },
    { label: '< 28h', value: 1680 },
  ];

  // Collect all unique carriers from results
  const allCarriers = useMemo(() => {
    const set = new Set<string>();
    for (const route of routeResults) {
      for (const r of route.results) {
        set.add(carrierLabel(r));
      }
    }
    return Array.from(set).sort();
  }, [routeResults]);

  const applyFilters = useCallback((results: FlightSearchResult[]) => {
    let filtered = results;

    // Stops filter
    if (stopsFilter === 'direct') filtered = filtered.filter((r) => r.stops === 0);
    else if (stopsFilter === '1stop') filtered = filtered.filter((r) => r.stops <= 1);
    else if (stopsFilter === '2stop') filtered = filtered.filter((r) => r.stops <= 2);

    // Duration filter
    if (durationFilter) filtered = filtered.filter((r) => parseDuration(r.duration) <= durationFilter);

    // Carrier filter
    if (selectedCarrier) filtered = filtered.filter((r) => carrierLabel(r) === selectedCarrier);

    // Departure time filter
    if (depRange[0] > 0 || depRange[1] < 24) {
      filtered = filtered.filter((r) => {
        const h = getHour(r.departureAt);
        return h >= depRange[0] && h <= depRange[1];
      });
    }

    // Arrival time filter
    if (arrRange[0] > 0 || arrRange[1] < 24) {
      filtered = filtered.filter((r) => {
        const h = getHour(r.arrivalAt);
        return h >= arrRange[0] && h <= arrRange[1];
      });
    }

    return filtered;
  }, [stopsFilter, durationFilter, selectedCarrier, depRange, arrRange]);

  // All flights across all routes, filtered, with cheapest per route
  const filteredRoutes = useMemo(() => {
    return routeResults.map((route) => {
      if (route.status !== 'done') {
        return { ...route, filteredResults: route.results, filteredCheapestPrice: null as number | null };
      }
      const filtered = applyFilters(route.results);
      const cheapest = filtered.length > 0
        ? filtered.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
        : null;
      return {
        ...route,
        filteredResults: filtered,
        filteredCheapestPrice: cheapest?.totalPrice ?? null,
      };
    });
  }, [routeResults, applyFilters]);

  // Combined table: all flights across all routes
  const allFilteredFlights = useMemo(() => {
    const flights: FlightSearchResult[] = [];
    for (const route of filteredRoutes) {
      if (route.status === 'done') {
        flights.push(...route.filteredResults);
      }
    }
    return flights;
  }, [filteredRoutes]);

  // For map: cheapest price per route
  const routeSummaries = useMemo(() => {
    return filteredRoutes
      .filter((r) => r.status === 'done' && r.filteredCheapestPrice !== null)
      .map((r) => ({
        origin: r.origin,
        destination: r.destination,
        cheapestPrice: r.filteredCheapestPrice!,
      }));
  }, [filteredRoutes]);

  const selectedRouteFlights = useMemo(() => {
    if (!selectedRoute) return null;
    const route = filteredRoutes.find((r) => r.origin === selectedRoute.origin && r.destination === selectedRoute.destination);
    return route?.filteredResults ?? null;
  }, [selectedRoute, filteredRoutes]);

  const totalFlightCount = allFilteredFlights.length;
  const routeCount = filteredRoutes.filter((r) => r.status === 'done').length;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Filters bar */}
      <div className="px-3 sm:px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* Stops */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Stops:</span>
          <select
            value={stopsFilter}
            onChange={(e) => setStopsFilter(e.target.value as StopsFilter)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="any">Any</option>
            <option value="direct">Direct only</option>
            <option value="1stop">≤ 1 stop</option>
            <option value="2stop">≤ 2 stops</option>
          </select>
        </div>

        {/* Journey time */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Duration:</span>
          <select
            value={durationFilter ?? ''}
            onChange={(e) => setDurationFilter(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="">Any</option>
            {durationOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Carrier */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Carrier:</span>
          <select
            value={selectedCarrier ?? ''}
            onChange={(e) => setSelectedCarrier(e.target.value || null)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="">All</option>
            {allCarriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Departure time slider */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Depart:</span>
          <TimeRangeSlider value={depRange} onChange={setDepRange} />
        </div>

        {/* Arrival time slider */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Arrive:</span>
          <TimeRangeSlider value={arrRange} onChange={setArrRange} />
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-gray-200 rounded p-0.5">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1 rounded text-xs flex items-center gap-1 ${viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-1 rounded text-xs flex items-center gap-1 ${viewMode === 'map' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-white border-b border-gray-100">
        {totalFlightCount} flight{totalFlightCount !== 1 ? 's' : ''} across {routeCount} route{routeCount !== 1 ? 's' : ''}
        {selectedRoute && (
          <>
            {' '}&middot; Viewing {selectedRoute.origin} → {selectedRoute.destination}
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-blue-600 hover:text-blue-800 ml-2"
            >
              Show all
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {viewMode === 'table' && (
        <FlightResultsTable
          results={selectedRoute && selectedRouteFlights ? selectedRouteFlights : allFilteredFlights}
          passengers={passengers}
        />
      )}

      {viewMode === 'map' && (
        <ScatterSearchMap
          routeSummaries={routeSummaries}
          onRouteSelect={(origin, destination) => setSelectedRoute({ origin, destination })}
          selectedRoute={selectedRoute}
        />
      )}

      {viewMode === 'map' && selectedRoute && selectedRouteFlights && selectedRouteFlights.length > 0 && (
        <div className="flex flex-col min-h-0 border-t border-gray-200" style={{ maxHeight: '40vh' }}>
          <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {selectedRoute.origin} → {selectedRoute.destination}
          </div>
          <FlightResultsTable results={selectedRouteFlights} passengers={passengers} />
        </div>
      )}
    </div>
  );
}

function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function TimeRangeSlider({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const handlePointerDown = (thumb: 'min' | 'max') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(thumb);
    const bar = e.currentTarget.parentElement!;
    const rect = bar.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const hour = Math.round(pct * 48) / 2; // snap to 30-min
      onChange(thumb === 'min'
        ? [Math.min(hour, value[1] - 0.5), value[1]]
        : [value[0], Math.max(hour, value[0] + 0.5)]
      );
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const leftPct = (value[0] / 24) * 100;
  const widthPct = ((value[1] - value[0]) / 24) * 100;
  const isDefault = value[0] === 0 && value[1] === 24;

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] tabular-nums w-[72px] text-center ${isDefault ? 'text-gray-400' : 'text-blue-600 font-medium'}`}>
        {formatHour(value[0])}–{formatHour(value[1])}
      </span>
      <div className="relative w-24 h-4 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1 bg-gray-200 rounded-full" />
        {/* Active range */}
        <div
          className="absolute h-1 bg-blue-400 rounded-full"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* Min thumb */}
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-pointer -translate-x-1/2 hover:scale-110 transition-transform"
          style={{ left: `${leftPct}%` }}
          onPointerDown={handlePointerDown('min')}
        />
        {/* Max thumb */}
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-pointer -translate-x-1/2 hover:scale-110 transition-transform"
          style={{ left: `${leftPct + widthPct}%` }}
          onPointerDown={handlePointerDown('max')}
        />
      </div>
    </div>
  );
}
