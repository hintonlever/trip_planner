import { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw, Loader2, Plane } from 'lucide-react';
import { fetchCachedQueries, fetchCachedResults } from '../../services/cacheService';
import type { CachedQuery, FlightSearchResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';

export function PastQueriesPage() {
  const [queries, setQueries] = useState<CachedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedResults, setExpandedResults] = useState<FlightSearchResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const loadQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCachedQueries();
      setQueries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueries(); }, []);

  const toggleExpand = async (queryId: number) => {
    if (expandedId === queryId) {
      setExpandedId(null);
      setExpandedResults([]);
      return;
    }

    setExpandedId(queryId);
    setLoadingResults(true);
    try {
      const results = await fetchCachedResults(queryId);
      setExpandedResults(results);
    } catch {
      setExpandedResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading cached queries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button onClick={loadQueries} className="text-sm text-blue-600 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {queries.length} cached quer{queries.length !== 1 ? 'ies' : 'y'}
        </div>
        <button
          onClick={loadQueries}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 px-2 py-1.5 rounded hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {queries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No cached queries yet. Search for flights to populate the cache.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queries.map((q) => (
              <div key={q.id}>
                <button
                  onClick={() => toggleExpand(q.id)}
                  className="w-full px-6 py-3 flex items-center gap-4 hover:bg-gray-50 text-left"
                >
                  <Plane className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">
                      {q.origin} → {q.destination}
                    </span>
                    <span className="text-xs text-gray-500">{q.departure_date}</span>
                    {q.return_date && (
                      <span className="text-xs text-gray-500">Return: {q.return_date}</span>
                    )}
                    <span className="text-xs text-gray-400">{q.adults} pax</span>
                    <span className="text-xs text-gray-400">{q.currency}</span>
                    {q.non_stop === 1 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Direct</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {q.result_count} result{q.result_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimestamp(q.created_at)}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === q.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandedId === q.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {loadingResults ? (
                      <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading results...
                      </div>
                    ) : expandedResults.length > 0 ? (
                      <FlightResultsTable results={expandedResults} passengers={q.adults} />
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        No results stored for this query
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
