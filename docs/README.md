# Trip Planner

A trip planning app with flight search, drag-and-drop itinerary building, and an interactive map.

## Prerequisites

- Node.js (v18+)
- A [FlightAPI.io](https://www.flightapi.io/) account (free tier available)

## Setup

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
