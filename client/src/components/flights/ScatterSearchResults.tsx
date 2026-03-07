import { useState, useMemo } from 'react';
import type { ScatterSearchRouteResult, FlightSearchResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { ScatterSearchMap } from './ScatterSearchMap';
import { FlightFilters, applyFlightFilters, extractCarriers, defaultFilterState, type FlightFilterState } from './FlightFilters';
import { Table2, Map as MapIcon } from 'lucide-react';

type ViewMode = 'table' | 'map';

interface ScatterSearchResultsProps {
  routeResults: ScatterSearchRouteResult[];
  passengers: number;
}

export function ScatterSearchResults({ routeResults, passengers }: ScatterSearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<FlightFilterState>({ ...defaultFilterState, selectedCarriers: new Set() });
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null);

  const allResults = useMemo(() => {
    return routeResults.filter((r) => r.status === 'done').flatMap((r) => r.results);
  }, [routeResults]);

  const carriers = useMemo(() => extractCarriers(allResults, 'outbound'), [allResults]);

  const filteredRoutes = useMemo(() => {
    return routeResults.map((route) => {
      if (route.status !== 'done') {
        return { ...route, filteredResults: route.results, filteredCheapestPrice: null as number | null };
      }
      const filtered = applyFlightFilters(route.results, filters, 'outbound');
      const cheapest = filtered.length > 0
        ? filtered.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
        : null;
      return {
        ...route,
        filteredResults: filtered,
        filteredCheapestPrice: cheapest?.totalPrice ?? null,
      };
    });
  }, [routeResults, filters]);

  const allFilteredFlights = useMemo(() => {
    const flights: FlightSearchResult[] = [];
    for (const route of filteredRoutes) {
      if (route.status === 'done') {
        flights.push(...route.filteredResults);
      }
    }
    return flights;
  }, [filteredRoutes]);

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
      {/* Shared filters + view toggle */}
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="flex-1">
            <FlightFilters filters={filters} onChange={setFilters} carriers={carriers} />
          </div>
          <div className="pr-3 sm:pr-6 flex items-center gap-1 bg-gray-50 border-b border-gray-200 py-2">
            <div className="flex items-center gap-1 bg-gray-200 rounded p-0.5">
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
        </div>
      </div>

      {/* Status bar */}
      <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-white border-b border-gray-100">
        {totalFlightCount} flight{totalFlightCount !== 1 ? 's' : ''} across {routeCount} route{routeCount !== 1 ? 's' : ''}
        {selectedRoute && (
          <>
            {' '}&middot; Viewing {selectedRoute.origin} &rarr; {selectedRoute.destination}
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
            {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {selectedRoute.origin} &rarr; {selectedRoute.destination}
          </div>
          <FlightResultsTable results={selectedRouteFlights} passengers={passengers} />
        </div>
      )}
    </div>
  );
}
