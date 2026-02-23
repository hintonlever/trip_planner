export interface TripSummary {
  id: number;
  trip_name: string;
  created_at: string;
  updated_at: string;
}

export interface TripData {
  id: number;
  tripName: string;
  columns: Record<string, unknown>;
  columnOrder: string[];
  items: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function fetchTrips(): Promise<TripSummary[]> {
  const res = await fetch('/api/trips', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch trips');
  const data = (await res.json()) as { trips: TripSummary[] };
  return data.trips;
}

export async function fetchTrip(id: number): Promise<TripData> {
  const res = await fetch(`/api/trips/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch trip');
  const data = (await res.json()) as { trip: TripData };
  return data.trip;
}

export async function createTrip(state: {
  tripName: string;
  columns: unknown;
  columnOrder: string[];
  items: unknown;
}): Promise<number> {
  const res = await fetch('/api/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('Failed to create trip');
  const data = (await res.json()) as { id: number };
  return data.id;
}

export async function updateTrip(
  id: number,
  state: { tripName: string; columns: unknown; columnOrder: string[]; items: unknown }
): Promise<void> {
  const res = await fetch(`/api/trips/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('Failed to save trip');
}

export async function deleteTrip(id: number): Promise<void> {
  const res = await fetch(`/api/trips/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete trip');
}
