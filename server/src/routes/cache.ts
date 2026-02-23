import { Router } from 'express';
import { getAllQueries, getResultsByQueryId, searchCachedResults, getRouteSearchResults } from '../services/cacheService.js';

export const cacheRouter = Router();

cacheRouter.get('/queries', (req, res) => {
  try {
    // Admin can pass ?all=true to see all users' queries
    const showAll = req.query.all === 'true' && req.user?.is_admin === 1;
    const userId = showAll ? undefined : req.user!.id;
    const queries = getAllQueries(userId);
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

    const showAll = req.query.all === 'true' && req.user?.is_admin === 1;
    const userId = showAll ? undefined : req.user!.id;
    const results = searchCachedResults({ origin, destination, departureDate }, userId);
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

cacheRouter.get('/route-search/:id', (req, res) => {
  try {
    const routeSearchId = req.params.id;
    const showAll = req.query.all === 'true' && req.user?.is_admin === 1;
    const userId = showAll ? undefined : req.user!.id;
    const results = getRouteSearchResults(routeSearchId, userId);
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Route search results error:', message);
    res.status(500).json({ error: message });
  }
});
