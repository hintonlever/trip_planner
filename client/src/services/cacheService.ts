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
  origin?: string;
  destination?: string;
  departureDate?: string;
}, showAll = false): Promise<CacheSearchResult[]> {
  const params = new URLSearchParams();
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.destination) params.set('destination', filters.destination);
  if (filters.departureDate) params.set('departureDate', filters.departureDate);
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

export async function fetchRouteSearchResults(routeSearchId: string): Promise<(FlightSearchResult & { departureDate: string })[]> {
  const response = await fetch(`/api/cache/route-search/${routeSearchId}`, { credentials: 'include' });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Failed to fetch route search results (${response.status})`);
  }

  const data = (await response.json()) as { results: (FlightSearchResult & { departureDate: string })[] };
  return data.results;
}
