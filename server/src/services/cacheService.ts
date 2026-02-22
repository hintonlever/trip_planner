import Database from 'better-sqlite3';
import path from 'path';
import type { FlightSearchParams, FlightSearchResult } from './flightService.js';

const dbPath = path.join(__dirname, '..', '..', 'cache.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    return_date TEXT,
    adults INTEGER NOT NULL,
    non_stop INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    cache_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
    offer_id TEXT NOT NULL,
    airline_code TEXT NOT NULL,
    airline_name TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_at TEXT NOT NULL,
    arrival_at TEXT NOT NULL,
    duration TEXT NOT NULL,
    stops INTEGER NOT NULL,
    stop_codes TEXT NOT NULL,
    total_price REAL NOT NULL,
    price_per_person REAL NOT NULL,
    currency TEXT NOT NULL,
    cabin TEXT NOT NULL,
    return_departure_at TEXT,
    return_arrival_at TEXT,
    return_duration TEXT,
    return_stops INTEGER,
    return_flight_number TEXT,
    return_origin TEXT,
    return_destination TEXT,
    return_stop_codes TEXT
  );
`);

function buildCacheKey(params: FlightSearchParams): string {
  return [
    params.origin.toUpperCase().trim(),
    params.destination.toUpperCase().trim(),
    params.departureDate,
    params.returnDate || '',
    String(params.adults),
    params.nonStop ? '1' : '0',
    (params.currency || 'USD').toUpperCase(),
  ].join('|');
}

export function getCachedResults(params: FlightSearchParams): FlightSearchResult[] | null {
  const key = buildCacheKey(params);

  const query = db.prepare('SELECT id FROM queries WHERE cache_key = ?').get(key) as { id: number } | undefined;
  if (!query) return null;

  const rows = db.prepare('SELECT * FROM results WHERE query_id = ?').all(query.id) as Array<Record<string, unknown>>;
  return rows.map(mapRowToResult);
}

function mapRowToResult(row: Record<string, unknown>): FlightSearchResult {
  const result: FlightSearchResult = {
    id: row.offer_id as string,
    airlineCode: row.airline_code as string,
    airlineName: row.airline_name as string,
    flightNumber: row.flight_number as string,
    origin: row.origin as string,
    destination: row.destination as string,
    departureAt: row.departure_at as string,
    arrivalAt: row.arrival_at as string,
    duration: row.duration as string,
    stops: row.stops as number,
    stopCodes: JSON.parse(row.stop_codes as string) as string[],
    totalPrice: row.total_price as number,
    pricePerPerson: row.price_per_person as number,
    currency: row.currency as string,
    cabin: row.cabin as string,
  };

  if (row.return_departure_at) {
    result.returnDepartureAt = row.return_departure_at as string;
    result.returnArrivalAt = row.return_arrival_at as string;
    result.returnDuration = row.return_duration as string;
    result.returnStops = row.return_stops as number;
    result.returnFlightNumber = row.return_flight_number as string;
    result.returnOrigin = row.return_origin as string;
    result.returnDestination = row.return_destination as string;
    result.returnStopCodes = JSON.parse(row.return_stop_codes as string) as string[];
  }

  return result;
}

export function getAllQueries() {
  return db.prepare(`
    SELECT q.*, COUNT(r.id) AS result_count
    FROM queries q
    LEFT JOIN results r ON r.query_id = q.id
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `).all() as Array<{
    id: number;
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string | null;
    adults: number;
    non_stop: number;
    currency: string;
    created_at: string;
    result_count: number;
  }>;
}

export function getResultsByQueryId(queryId: number): FlightSearchResult[] {
  const rows = db.prepare('SELECT * FROM results WHERE query_id = ?').all(queryId) as Array<Record<string, unknown>>;
  return rows.map(mapRowToResult);
}

export const cacheResults = db.transaction((params: FlightSearchParams, results: FlightSearchResult[]) => {
  const key = buildCacheKey(params);

  // Delete old cached entry if it exists (for fresh refreshes)
  const existing = db.prepare('SELECT id FROM queries WHERE cache_key = ?').get(key) as { id: number } | undefined;
  if (existing) {
    db.prepare('DELETE FROM queries WHERE id = ?').run(existing.id);
  }

  const info = db.prepare(`
    INSERT INTO queries (origin, destination, departure_date, return_date, adults, non_stop, currency, cache_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.origin.toUpperCase().trim(),
    params.destination.toUpperCase().trim(),
    params.departureDate,
    params.returnDate || null,
    params.adults,
    params.nonStop ? 1 : 0,
    (params.currency || 'USD').toUpperCase(),
    key,
    new Date().toISOString(),
  );

  const queryId = info.lastInsertRowid;

  const insertResult = db.prepare(`
    INSERT INTO results (
      query_id, offer_id, airline_code, airline_name, flight_number,
      origin, destination, departure_at, arrival_at, duration,
      stops, stop_codes, total_price, price_per_person, currency, cabin,
      return_departure_at, return_arrival_at, return_duration, return_stops,
      return_flight_number, return_origin, return_destination, return_stop_codes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of results) {
    insertResult.run(
      queryId,
      r.id,
      r.airlineCode,
      r.airlineName,
      r.flightNumber,
      r.origin,
      r.destination,
      r.departureAt,
      r.arrivalAt,
      r.duration,
      r.stops,
      JSON.stringify(r.stopCodes),
      r.totalPrice,
      r.pricePerPerson,
      r.currency,
      r.cabin,
      r.returnDepartureAt || null,
      r.returnArrivalAt || null,
      r.returnDuration || null,
      r.returnStops ?? null,
      r.returnFlightNumber || null,
      r.returnOrigin || null,
      r.returnDestination || null,
      r.returnStopCodes ? JSON.stringify(r.returnStopCodes) : null,
    );
  }
});
