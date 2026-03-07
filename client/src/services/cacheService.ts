import type { CachedQuery, FlightSearchResult, CacheSearchResult } from '../types';

export async function fetchCachedQueries(showAll = false): Promise<CachedQuery[]> {
  const url = showAll ? '/api/cache/queries?all=true' : '/api/cache/queries';
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch cached queries (${response.status})`);
  }

  const data = (await response.json()) as { queries: CachedQuery[] };
  return data.queries;
}

export async function searchCachedFlights(filters: {
  origins?: string[];
  destinations?: string[];
  departureDates?: string[];
  tripType?: 'any' | 'oneway' | 'roundtrip';
  limit?: number;
} = {}, showAll = false): Promise<CacheSearchResult[]> {
  const params = new URLSearchParams();
  if (filters.origins?.length) params.set('origin', filters.origins.join(','));
  if (filters.destinations?.length) params.set('destination', filters.destinations.join(','));
  if (filters.departureDates?.length) params.set('departureDate', filters.departureDates.join(','));
  if (filters.tripType && filters.tripType !== 'any') params.set('tripType', filters.tripType);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (showAll) params.set('all', 'true');

  const response = await fetch(`/api/cache/search?${params}`, { credentials: 'include' });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Search failed (${response.status})`);
  }

  const data = (await response.json()) as { results: CacheSearchResult[] };
  return data.results;
}

export async function fetchCachedResults(queryId: number): Promise<FlightSearchResult[]> {
  const response = await fetch(`/api/cache/queries/${queryId}/results`, { credentials: 'include' });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch cached results (${response.status})`);
  }

  const data = (await response.json()) as { results: FlightSearchResult[] };
  return data.results;
}

export async function fetchTimeSweepResults(timeSweepId: string): Promise<(FlightSearchResult & { departureDate: string })[]> {
  const response = await fetch(`/api/cache/time-sweep/${timeSweepId}`, { credentials: 'include' });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch time sweep results (${response.status})`);
  }

  const data = (await response.json()) as { results: (FlightSearchResult & { departureDate: string })[] };
  return data.results;
}
