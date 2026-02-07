import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { searchFlights } from '../services/amadeusService.js';

export const flightsRouter = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a minute.' },
});

flightsRouter.use(limiter);

flightsRouter.get('/search', async (req, res) => {
  try {
    const { origin, destination, departureDate, adults, nonStop, currency, returnDate } = req.query;

    if (!origin || !destination || !departureDate || !adults) {
      res.status(400).json({ error: 'Missing required params: origin, destination, departureDate, adults' });
      return;
    }

    const results = await searchFlights({
      origin: String(origin),
      destination: String(destination),
      departureDate: String(departureDate),
      adults: Number(adults),
      nonStop: nonStop === 'true',
      currency: currency ? String(currency) : undefined,
      returnDate: returnDate ? String(returnDate) : undefined,
    });

    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Flight search error:', message);
    res.status(500).json({ error: message });
  }
});
