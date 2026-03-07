import { useMemo, useCallback, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Table2, Map as MapIcon, Grid3x3, Filter } from 'lucide-react';
import { searchCachedFlights } from '../../services/cacheService';
import { FlightResultsTable } from './FlightResultsTable';
import { FlightMap } from './FlightMap';
import { ODMatrix } from './ODMatrix';
import { FlightFilters, applyFlightFilters, extractCarriers } from './FlightFilters';
import { MultiAirportInput } from './MultiAirportInput';
import { usePastQueriesStore } from '../../store/usePastQueriesStore';

const DEBOUNCE_MS = 400;

export function PastQueriesPanel() {
  const s = usePastQueriesStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(async () => {
    const store = usePastQueriesStore.getState();
    store.setLoading(true);
    store.setError('');
    try {
      const data = await searchCachedFlights({
        origins: store.origins.length > 0 ? store.origins : undefined,
        destinations: store.destinations.length > 0 ? store.destinations : undefined,
        departureDates: store.departureDates.length > 0 ? store.departureDates : undefined,
        tripType: store.tripType !== 'any' ? store.tripType : undefined,
        limit: 500,
      }, true);
      usePastQueriesStore.getState().setAllResults(data);
      usePastQueriesStore.getState().setLoaded(true);
    } catch (err) {
      usePastQueriesStore.getState().setError(err instanceof Error ? err.message : 'Failed to load cached results');
    }
    usePastQueriesStore.getState().setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    const { loaded, loading } = usePastQueriesStore.getState();
    if (!loaded && !loading) {
      fetchResults();
    }
  }, [fetchResults]);

  // Re-fetch when search filters change (debounced)
  const filterKey = `${s.origins.join(',')}|${s.destinations.join(',')}|${s.departureDates.join(',')}|${s.tripType}`;
  const initialFilterKey = useRef(filterKey);

  useEffect(() => {
    // Skip the initial render (already loaded above)
    if (filterKey === initialFilterKey.current) return;
    initialFilterKey.current = filterKey;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults();
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [filterKey, fetchResults]);

  // Apply client-side generic flight filters (stops, duration, carrier, time)
  const carriers = useMemo(() => extractCarriers(s.allResults, 'outbound'), [s.allResults]);

  const filteredResults = useMemo(() => {
    return applyFlightFilters(s.allResults, s.filters, 'outbound');
  }, [s.allResults, s.filters]);

  const selectedRouteFlights = useMemo(() => {
    if (!s.selectedRoute) return null;
    return filteredResults.filter(
      (r) => r.origin === s.selectedRoute!.origin && r.destination === s.selectedRoute!.destination
    );
  }, [s.selectedRoute, filteredResults]);

  const hasMultipleRoutes = useMemo(() => {
    const routes = new Set(s.allResults.map((r) => `${r.origin}-${r.destination}`));
    return routes.size > 1;
  }, [s.allResults]);

  const addDate = () => {
    const d = s.dateInput.trim();
    if (d && !s.departureDates.includes(d)) {
      s.setDepartureDates([...s.departureDates, d]);
    }
    s.setDateInput('');
  };

  const removeDate = (date: string) => {
    s.setDepartureDates(s.departureDates.filter((d) => d !== date));
  };

  const hasActiveFilters = s.origins.length > 0 || s.destinations.length > 0 || s.departureDates.length > 0 || s.tripType !== 'any';

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Search form */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter Cached Flights</span>
          </div>
          <button
            onClick={fetchResults}
            disabled={s.loading}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${s.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {s.error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3">{s.error}</p>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
            {/* Trip type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trip Type</label>
              <div className="flex rounded-md overflow-hidden border border-gray-300 text-sm">
                <button
                  type="button"
                  onClick={() => s.setTripType('any')}
                  className={`px-2.5 py-1.5 font-medium transition-colors text-xs ${
                    s.tripType === 'any' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Any
                </button>
                <button
                  type="button"
                  onClick={() => s.setTripType('oneway')}
                  className={`px-2.5 py-1.5 font-medium transition-colors text-xs ${
                    s.tripType === 'oneway' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  One-way
                </button>
                <button
                  type="button"
                  onClick={() => s.setTripType('roundtrip')}
                  className={`px-2.5 py-1.5 font-medium transition-colors text-xs ${
                    s.tripType === 'roundtrip' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Round-trip
                </button>
              </div>
            </div>

            {/* Origins */}
            <div className="flex-1 min-w-[140px] sm:min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Origins</label>
              <MultiAirportInput
                codes={s.origins}
                onChange={s.setOrigins}
                placeholder="Any origin..."
                color="blue"
              />
            </div>

            {/* Destinations */}
            <div className="flex-1 min-w-[140px] sm:min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Destinations</label>
              <MultiAirportInput
                codes={s.destinations}
                onChange={s.setDestinations}
                placeholder="Any destination..."
                color="green"
              />
            </div>

            {/* Date input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departure Dates</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={s.dateInput}
                  onChange={(e) => s.setDateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDate();
                    }
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={addDate}
                  disabled={!s.dateInput.trim()}
                  className="px-2 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={s.clearSearchFilters}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded hover:bg-gray-50"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Date chips */}
          {s.departureDates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {s.departureDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700"
                >
                  {date}
                  <button
                    type="button"
                    onClick={() => removeDate(date)}
                    className="rounded-full p-0.5 hover:bg-amber-200"
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center">
        <div className="flex-1">
          <FlightFilters filters={s.filters} onChange={s.setFilters} carriers={carriers} />
        </div>
        <div className="pr-3 sm:pr-6 flex items-center gap-1 bg-gray-50 border-b border-gray-200 py-2">
          <div className="flex items-center gap-1 bg-gray-200 rounded p-0.5">
            <button
              onClick={() => s.setViewMode('table')}
              className={`p-1 rounded text-xs flex items-center gap-1 ${s.viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => s.setViewMode('map')}
              className={`p-1 rounded text-xs flex items-center gap-1 ${s.viewMode === 'map' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
            {hasMultipleRoutes && (
              <button
                onClick={() => s.setViewMode('od')}
                className={`p-1 rounded text-xs flex items-center gap-1 ${s.viewMode === 'od' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
                O&D
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-white border-b border-gray-100">
        {s.loading ? (
          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
        ) : (
          <>
            {filteredResults.length} flight{filteredResults.length !== 1 ? 's' : ''}
            {filteredResults.length !== s.allResults.length && (
              <span className="text-gray-400 ml-1">({s.allResults.length} from server)</span>
            )}
            {s.allResults.length >= 500 && (
              <span className="text-amber-600 ml-1">(limited to 500 — add filters to narrow down)</span>
            )}
            {s.selectedRoute && (
              <>
                {' '}&middot; Viewing {s.selectedRoute.origin} &rarr; {s.selectedRoute.destination}
                <button
                  onClick={() => s.setSelectedRoute(null)}
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  Show all
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Content */}
      {filteredResults.length > 0 ? (
        <>
          {s.viewMode === 'table' && (
            <FlightResultsTable
              results={s.selectedRoute && selectedRouteFlights ? selectedRouteFlights : filteredResults}
              passengers={1}
              showCacheAge
            />
          )}

          {s.viewMode === 'map' && (
            <FlightMap
              results={filteredResults}
              onRouteSelect={(origin, destination) => s.setSelectedRoute({ origin, destination })}
              selectedRoute={s.selectedRoute}
            />
          )}

          {s.viewMode === 'map' && s.selectedRoute && selectedRouteFlights && selectedRouteFlights.length > 0 && (
            <div className="flex flex-col min-h-0 border-t border-gray-200" style={{ maxHeight: '40vh' }}>
              <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {s.selectedRoute.origin} &rarr; {s.selectedRoute.destination}
              </div>
              <FlightResultsTable results={selectedRouteFlights} passengers={1} showCacheAge />
            </div>
          )}

          {s.viewMode === 'od' && (
            <ODMatrix
              results={filteredResults}
              onCellClick={(origin, destination) => s.setSelectedRoute({ origin, destination })}
              selectedRoute={s.selectedRoute}
            />
          )}

          {s.viewMode === 'od' && s.selectedRoute && selectedRouteFlights && selectedRouteFlights.length > 0 && (
            <div className="flex flex-col min-h-0 border-t border-gray-200" style={{ maxHeight: '40vh' }}>
              <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {s.selectedRoute.origin} &rarr; {s.selectedRoute.destination}
              </div>
              <FlightResultsTable results={selectedRouteFlights} passengers={1} showCacheAge />
            </div>
          )}
        </>
      ) : !s.loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          {!s.loaded
            ? 'Loading...'
            : 'No cached flights found. Run searches from other tabs first.'}
        </div>
      ) : null}
    </div>
  );
}
