import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { searchFlightsWithCache } from '../services/amadeusService.js';

export const flightsRouter = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a minute.' },
});

flightsRouter.use(limiter);

flightsRouter.get('/search', async (req, res) => {
  try {
    const { origin, destination, departureDate, adults, nonStop, currency, returnDate, fresh } = req.query;

    if (!origin || !destination || !departureDate || !adults) {
      res.status(400).json({ error: 'Missing required params: origin, destination, departureDate, adults' });
      return;
    }

    const results = await searchFlightsWithCache({
      origin: String(origin),
      destination: String(destination),
      departureDate: String(departureDate),
      adults: Number(adults),
      nonStop: nonStop === 'true',
      currency: currency ? String(currency) : undefined,
      returnDate: returnDate ? String(returnDate) : undefined,
    }, fresh === 'true');

    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Flight search error:', message);
    res.status(500).json({ error: message });
  }
});
