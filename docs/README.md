# Trip Planner

A trip planning app with flight search, drag-and-drop itinerary building, and an interactive map.

## Prerequisites

- Node.js (v18+)
- A [FlightAPI.io](https://www.flightapi.io/) account (free tier available)

## Setup

### 0. Navigate to the project

```bash
cd ~/Documents/projects/trip_planner
```

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

Create a `server/.env` file:

```
FLIGHTAPI_KEY=your_api_key
```

### 3. Run the app

Start both the backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend (port 3001)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Restarting

The server uses `tsx watch` which auto-restarts on file changes. If you need to manually restart (e.g. after changing `.env` or clearing the cache), press `Ctrl+C` in the respective terminal and re-run:

```bash
cd ~/Documents/projects/trip_planner

# Restart backend
cd server && npm run dev

# Restart frontend (in a separate terminal)
cd client && npm run dev
```

### Killing a dev server by port

If a dev server is running in the background or another terminal:

```bash
# Kill frontend (port 5173)
lsof -ti:5173 | xargs kill

# Kill backend (port 3001)
lsof -ti:3001 | xargs kill
```

### Clearing the flight cache

The server stores flight search results in `server/cache.db` (SQLite). To reset:

```bash
rm server/cache.db server/cache.db-shm server/cache.db-wal
```

Then restart the server. All three files must be deleted together.
