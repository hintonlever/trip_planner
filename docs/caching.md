# Caching

The app uses two application-level caches. Both are essential.

## SQLite Cache (server-side)

- **Location:** `server/cache.db` (SQLite with WAL mode)
- **Purpose:** Caches FlightAPI.io responses to avoid redundant API calls and provide instant results for repeated searches
- **Strategy:** Cache-first — checks for existing results before calling the API
- **Cache key:** `ORIGIN|DESTINATION|DEPARTURE_DATE|RETURN_DATE|ADULTS|CURRENCY`
- **Bypass:** Add `?fresh=true` query param to force a fresh API call (old cached entry is deleted and replaced)
- **Schema:**
  - `queries` table — stores search parameters (origin, destination, dates, adults, currency, route_search_id)
  - `results` table — stores denormalized flight offers (pricing, segments, carrier info)
- **API endpoints:**
  - `GET /api/cache/queries` — list all cached searches
  - `GET /api/cache/search` — search cached results by filters
  - `GET /api/cache/queries/:id/results` — get results for a specific query
  - `GET /api/cache/route-search/:id` — get results for a route search

## localStorage (client-side)

- **Location:** Browser localStorage, key `trip_planner_state`
- **Purpose:** Persists the trip planning board so users don't lose work on page refresh
- **What it stores:** trip name, columns (names + ordering), and cost items
- **Save behavior:** Auto-saves on state changes with 500ms debounce via Zustand store subscription; also saveable manually via the header "Save" button

## .gitignore Notes

`cache.db` is in `.gitignore` but `cache.db-wal` and `cache.db-shm` (SQLite WAL/shared-memory files) are not — these are generated at runtime and should also be ignored.
