import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, RefreshCw, Table2, Map as MapIcon, Grid3x3 } from 'lucide-react';
import type { CachedQuery, CacheSearchResult } from '../../types';
import { fetchCachedQueries, searchCachedFlights } from '../../services/cacheService';
import { FlightResultsTable } from './FlightResultsTable';
import { FlightMap } from './FlightMap';
import { ODMatrix } from './ODMatrix';
import { FlightFilters, applyFlightFilters, extractCarriers, defaultFilterState, type FlightFilterState } from './FlightFilters';

type PastViewMode = 'table' | 'map' | 'od';

export function PastQueriesPanel() {
  const [queries, setQueries] = useState<CachedQuery[]>([]);
  const [results, setResults] = useState<CacheSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');
  const [selectedQueryIds, setSelectedQueryIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<PastViewMode>('table');
  const [filters, setFilters] = useState<FlightFilterState>({ ...defaultFilterState, selectedCarriers: new Set() });
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCachedQueries(true);
      setQueries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queries');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  const loadResults = useCallback(async () => {
    setLoadingResults(true);
    setError('');
    try {
      const data = await searchCachedFlights({}, true);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    }
    setLoadingResults(false);
  }, []);

  // Load all results on mount
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Group queries by route
  const queryGroups = useMemo(() => {
    const groups = new Map<string, CachedQuery[]>();
    for (const q of queries) {
      const key = `${q.origin}-${q.destination}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }
    return Array.from(groups.entries()).map(([key, qs]) => ({
      route: key,
      origin: qs[0].origin,
      destination: qs[0].destination,
      queries: qs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      totalResults: qs.reduce((sum, q) => sum + q.result_count, 0),
    }));
  }, [queries]);

  // Filter results by selected queries (or show all if none selected)
  const activeResults = useMemo(() => {
    if (selectedQueryIds.size === 0) return results;
    return results.filter((r) => {
      // Match by origin+destination+date from selected queries
      return queries.some((q) =>
        selectedQueryIds.has(q.id) &&
        q.origin === r.origin &&
        q.destination === r.destination
      );
    });
  }, [results, selectedQueryIds, queries]);

  const carriers = useMemo(() => extractCarriers(activeResults, 'outbound'), [activeResults]);

  const filteredResults = useMemo(() => {
    return applyFlightFilters(activeResults, filters, 'outbound');
  }, [activeResults, filters]);

  const selectedRouteFlights = useMemo(() => {
    if (!selectedRoute) return null;
    return filteredResults.filter(
      (r) => r.origin === selectedRoute.origin && r.destination === selectedRoute.destination
    );
  }, [selectedRoute, filteredResults]);

  const toggleQuery = (id: number) => {
    setSelectedQueryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRoute = (origin: string, destination: string) => {
    const routeQueries = queries.filter((q) => q.origin === origin && q.destination === destination);
    const allSelected = routeQueries.every((q) => selectedQueryIds.has(q.id));
    setSelectedQueryIds((prev) => {
      const next = new Set(prev);
      for (const q of routeQueries) {
        if (allSelected) next.delete(q.id);
        else next.add(q.id);
      }
      return next;
    });
  };

  const hasMultipleRoutes = queryGroups.length > 1 ||
    (queryGroups.length === 1 && (
      new Set(results.map((r) => r.origin)).size > 1 ||
      new Set(results.map((r) => r.destination)).size > 1
    ));

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Query selector */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Cached Queries ({queries.length})
          </h3>
          <button
            onClick={() => { loadQueries(); loadResults(); }}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">{error}</p>
        )}

        {loading && queries.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading cached queries...
          </div>
        ) : queries.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No cached queries found. Run searches from other tabs first.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
            {queryGroups.map((group) => {
              const allSelected = group.queries.every((q) => selectedQueryIds.has(q.id));
              const someSelected = !allSelected && group.queries.some((q) => selectedQueryIds.has(q.id));
              return (
                <button
                  key={group.route}
                  onClick={() => toggleRoute(group.origin, group.destination)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    allSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : someSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : selectedQueryIds.size === 0
                          ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-mono font-medium">{group.origin}→{group.destination}</span>
                  <span className="ml-1 text-gray-400">
                    {group.queries.length}q · {group.totalResults}r
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedQueryIds.size > 0 && (
          <button
            onClick={() => setSelectedQueryIds(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700 mt-1.5"
          >
            Clear selection (show all)
          </button>
        )}
      </div>

      {/* Results area */}
      {(results.length > 0 || loadingResults) && (
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Filters + view toggle */}
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
                {hasMultipleRoutes && (
                  <button
                    onClick={() => setViewMode('od')}
                    className={`p-1 rounded text-xs flex items-center gap-1 ${viewMode === 'od' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
            {loadingResults ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading results...</span>
            ) : (
              <>
                {filteredResults.length} flight{filteredResults.length !== 1 ? 's' : ''}
                {filteredResults.length !== activeResults.length && (
                  <span className="text-gray-400 ml-1">({activeResults.length} total)</span>
                )}
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
              </>
            )}
          </div>

          {/* Content */}
          {viewMode === 'table' && (
            <FlightResultsTable
              results={selectedRoute && selectedRouteFlights ? selectedRouteFlights : filteredResults}
              passengers={1}
              showCacheAge
            />
          )}

          {viewMode === 'map' && (
            <FlightMap
              results={filteredResults}
              onRouteSelect={(origin, destination) => setSelectedRoute({ origin, destination })}
              selectedRoute={selectedRoute}
            />
          )}

          {viewMode === 'map' && selectedRoute && selectedRouteFlights && selectedRouteFlights.length > 0 && (
            <div className="flex flex-col min-h-0 border-t border-gray-200" style={{ maxHeight: '40vh' }}>
              <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {selectedRoute.origin} &rarr; {selectedRoute.destination}
              </div>
              <FlightResultsTable results={selectedRouteFlights} passengers={1} showCacheAge />
            </div>
          )}

          {viewMode === 'od' && (
            <ODMatrix
              results={filteredResults}
              onCellClick={(origin, destination) => setSelectedRoute({ origin, destination })}
              selectedRoute={selectedRoute}
            />
          )}

          {viewMode === 'od' && selectedRoute && selectedRouteFlights && selectedRouteFlights.length > 0 && (
            <div className="flex flex-col min-h-0 border-t border-gray-200" style={{ maxHeight: '40vh' }}>
              <div className="px-3 sm:px-6 py-1.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {selectedRouteFlights.length} flight{selectedRouteFlights.length !== 1 ? 's' : ''} from {selectedRoute.origin} &rarr; {selectedRoute.destination}
              </div>
              <FlightResultsTable results={selectedRouteFlights} passengers={1} showCacheAge />
            </div>
          )}
        </div>
      )}

      {!loadingResults && results.length === 0 && queries.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          No cached results found
        </div>
      )}
    </div>
  );
}
