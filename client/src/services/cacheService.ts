import type { CachedQuery, FlightSearchResult, CacheSearchResult } from '../types';

export async function fetchCachedQueries(): Promise<CachedQuery[]> {
  const response = await fetch('/api/cache/queries');

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch cached queries (${response.status})`);
  }

  const data = (await response.json()) as { queries: CachedQuery[] };
  return data.queries;
}

export async function searchCachedFlights(filters: {
  origin?: string;
  destination?: string;
  departureDate?: string;
}): Promise<CacheSearchResult[]> {
  const params = new URLSearchParams();
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.destination) params.set('destination', filters.destination);
  if (filters.departureDate) params.set('departureDate', filters.departureDate);

  const response = await fetch(`/api/cache/search?${params}`);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Search failed (${response.status})`);
  }

  const data = (await response.json()) as { results: CacheSearchResult[] };
  return data.results;
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
