import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { flightsRouter } from './routes/flights.js';
import { cacheRouter } from './routes/cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/flights', flightsRouter);
app.use('/api/cache', cacheRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
