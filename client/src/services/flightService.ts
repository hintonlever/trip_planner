import type { FlightSearchParams, FlightSearchResult } from '../types';

export async function searchFlights(
  params: FlightSearchParams
): Promise<FlightSearchResult[]> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults),
    fresh: 'true',
  });

  if (params.currency) query.set('currency', params.currency);
  if (params.returnDate) query.set('returnDate', params.returnDate);

  const response = await fetch(`/api/flights/search?${query}`);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Search failed (${response.status})`);
  }

  const data = (await response.json()) as { results: FlightSearchResult[] };
  return data.results;
}

export async function searchFlightsForRouteSearch(
  params: FlightSearchParams,
  routeSearchId: string
): Promise<FlightSearchResult[]> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults),
    routeSearchId,
  });

  if (params.currency) query.set('currency', params.currency);

  const response = await fetch(`/api/flights/search?${query}`);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Search failed (${response.status})`);
  }

  const data = (await response.json()) as { results: FlightSearchResult[] };
  return data.results;
}
