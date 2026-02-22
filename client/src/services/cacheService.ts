import type { CachedQuery, FlightSearchResult } from '../types';

export async function fetchCachedQueries(): Promise<CachedQuery[]> {
  const response = await fetch('/api/cache/queries');

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch cached queries (${response.status})`);
  }

  const data = (await response.json()) as { queries: CachedQuery[] };
  return data.queries;
}

export async function fetchCachedResults(queryId: number): Promise<FlightSearchResult[]> {
  const response = await fetch(`/api/cache/queries/${queryId}/results`);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch cached results (${response.status})`);
  }

  const data = (await response.json()) as { results: FlightSearchResult[] };
  return data.results;
}
