import { Router } from 'express';
import { getAllQueries, getResultsByQueryId, searchCachedResults } from '../services/cacheService.js';

export const cacheRouter = Router();

cacheRouter.get('/queries', (_req, res) => {
  try {
    const queries = getAllQueries();
    res.json({ queries });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cache queries error:', message);
    res.status(500).json({ error: message });
  }
});

cacheRouter.get('/search', (req, res) => {
  try {
    const origin = req.query.origin as string | undefined;
    const destination = req.query.destination as string | undefined;
    const departureDate = req.query.departureDate as string | undefined;

    if (!origin && !destination && !departureDate) {
      res.status(400).json({ error: 'Provide at least one filter: origin, destination, or departureDate' });
      return;
    }

    const results = searchCachedResults({ origin, destination, departureDate });
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cache search error:', message);
    res.status(500).json({ error: message });
  }
});

cacheRouter.get('/queries/:id/results', (req, res) => {
  try {
    const queryId = Number(req.params.id);
    if (isNaN(queryId)) {
      res.status(400).json({ error: 'Invalid query ID' });
      return;
    }

    const results = getResultsByQueryId(queryId);
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cache results error:', message);
    res.status(500).json({ error: message });
  }
});
