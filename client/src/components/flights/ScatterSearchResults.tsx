import { useState, useMemo } from 'react';
import type { ScatterSearchRouteResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseDuration } from '../../utils/flightUtils';
import { Loader2 } from 'lucide-react';

interface ScatterSearchResultsProps {
  routeResults: ScatterSearchRouteResult[];
  passengers: number;
}

export function ScatterSearchResults({ routeResults, passengers }: ScatterSearchResultsProps) {
  const [directOnly, setDirectOnly] = useState(false);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null);

  const origins = useMemo(() => {
    const seen = new Set<string>();
    return routeResults.map((r) => r.origin).filter((o) => {
      if (seen.has(o)) return false;
      seen.add(o);
      return true;
    });
  }, [routeResults]);

  const destinations = useMemo(() => {
    const seen = new Set<string>();
    return routeResults.map((r) => r.destination).filter((d) => {
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    });
  }, [routeResults]);

  const allCarriers = useMemo(() => {
    const set = new Set<string>();
    for (const route of routeResults) {
      for (const r of route.results) {
        set.add(r.airlineName);
      }
    }
    return Array.from(set).sort();
  }, [routeResults]);

  const filteredRoutes = useMemo(() => {
    return routeResults.map((route) => {
      if (route.status !== 'done') {
        return { ...route, filteredResults: route.results, filteredCheapestPrice: null as number | null };
      }

      let filtered = route.results;
      if (directOnly) filtered = filtered.filter((r) => r.stops === 0);
      if (maxDuration) filtered = filtered.filter((r) => parseDuration(r.duration) <= maxDuration);
      if (selectedCarrier) filtered = filtered.filter((r) => r.airlineName === selectedCarrier);

      const cheapest = filtered.length > 0
        ? filtered.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
        : null;

      return {
        ...route,
        filteredResults: filtered,
        filteredCheapestPrice: cheapest?.totalPrice ?? null,
      };
    });
  }, [routeResults, directOnly, maxDuration, selectedCarrier]);

  const priceRange = useMemo(() => {
    const prices = filteredRoutes
      .filter((r) => r.filteredCheapestPrice !== null)
      .map((r) => r.filteredCheapestPrice!);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [filteredRoutes]);

  const getRouteData = (origin: string, destination: string) => {
    return filteredRoutes.find((r) => r.origin === origin && r.destination === destination);
  };

  const getCellColor = (price: number | null) => {
    if (price === null) return 'bg-gray-50 text-gray-400';
    if (priceRange.max === priceRange.min) return 'bg-green-50 text-green-800';
    const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min);
    if (ratio <= 0.33) return 'bg-green-50 text-green-800 border-green-200';
    if (ratio <= 0.66) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  const selectedRouteData = selectedRoute
    ? filteredRoutes.find((r) => r.origin === selectedRoute.origin && r.destination === selectedRoute.destination)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Filters bar */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
            className="rounded"
          />
          Direct only
        </label>

        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Max duration:</span>
          <select
            value={maxDuration ?? ''}
            onChange={(e) => setMaxDuration(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="">Any</option>
            <option value="300">5h</option>
            <option value="480">8h</option>
            <option value="720">12h</option>
            <option value="960">16h</option>
            <option value="1440">24h</option>
          </select>
        </div>

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

        {selectedRoute && (
          <button
            onClick={() => setSelectedRoute(null)}
            className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Price matrix */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-gray-500 text-left border border-gray-200 bg-gray-50">
                From \ To
              </th>
              {destinations.map((dest) => (
                <th key={dest} className="p-2 text-xs font-medium text-gray-700 text-center border border-gray-200 bg-gray-50 font-mono">
                  {dest}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {origins.map((origin) => (
              <tr key={origin}>
                <td className="p-2 text-xs font-medium text-gray-700 border border-gray-200 bg-gray-50 font-mono">
                  {origin}
                </td>
                {destinations.map((dest) => {
                  const route = getRouteData(origin, dest);
                  const isSelected = selectedRoute?.origin === origin && selectedRoute?.destination === dest;
                  const isLoading = route?.status === 'loading';
                  const isError = route?.status === 'error';
                  const price = route?.filteredCheapestPrice ?? null;

                  return (
                    <td
                      key={dest}
                      onClick={() => route?.status === 'done' && setSelectedRoute({ origin, destination: dest })}
                      className={`p-2 text-center border border-gray-200 min-w-[80px] transition-colors ${
                        isLoading ? 'bg-blue-50' :
                        isError ? 'bg-red-50' :
                        route?.status === 'done' ? getCellColor(price) :
                        'bg-gray-50'
                      } ${
                        route?.status === 'done' ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''
                      } ${
                        isSelected ? 'ring-2 ring-blue-600 ring-inset' : ''
                      }`}
                    >
                      {isLoading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-blue-500" />
                      )}
                      {isError && (
                        <span className="text-xs text-red-500">err</span>
                      )}
                      {route?.status === 'done' && price !== null && (
                        <span className="text-xs font-semibold">
                          {formatCurrency(price)}
                        </span>
                      )}
                      {route?.status === 'done' && price === null && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                      {route?.status === 'pending' && (
                        <span className="text-xs text-gray-300">...</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected route flights */}
      {selectedRouteData && selectedRouteData.filteredResults && selectedRouteData.filteredResults.length > 0 && (
        <div className="flex flex-col min-h-0">
          <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            {selectedRouteData.filteredResults.length} flight{selectedRouteData.filteredResults.length !== 1 ? 's' : ''} from {selectedRoute!.origin} → {selectedRoute!.destination}
          </div>
          <FlightResultsTable results={selectedRouteData.filteredResults} passengers={passengers} />
        </div>
      )}

      {selectedRoute && selectedRouteData && selectedRouteData.filteredResults && selectedRouteData.filteredResults.length === 0 && (
        <div className="px-6 py-8 text-sm text-gray-400 text-center">
          No flights match filters for {selectedRoute.origin} → {selectedRoute.destination}
        </div>
      )}

      {!selectedRoute && filteredRoutes.some((r) => r.status === 'done') && (
        <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
          Click a cell in the matrix to view flights for that route
        </div>
      )}
    </div>
  );
}
