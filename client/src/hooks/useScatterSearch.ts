import { useState, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { searchFlightsForTimeSweep } from '../services/flightService';
import type { ScatterSearchParams, ScatterSearchRouteResult } from '../types';

const DELAY_MS = 2000;

export function useScatterSearch() {
  const [routeResults, setRouteResults] = useState<ScatterSearchRouteResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'cancelled'>('idle');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setStatus('cancelled');
  }, []);

  const start = useCallback(async (params: ScatterSearchParams) => {
    cancelRef.current = false;
    const id = nanoid();

    const combinations: { origin: string; destination: string }[] = [];
    for (const origin of params.origins) {
      for (const dest of params.destinations) {
        combinations.push({ origin, destination: dest });
      }
    }

    const initial: ScatterSearchRouteResult[] = combinations.map((c) => ({
      origin: c.origin,
      destination: c.destination,
      results: [],
      cheapest: null,
      cheapestPrice: null,
      status: 'pending',
    }));

    setRouteResults(initial);
    setTotalCount(combinations.length);
    setCompletedCount(0);
    setStatus('running');

    for (let i = 0; i < combinations.length; i++) {
      if (cancelRef.current) break;

      setRouteResults((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'loading' as const } : r
      ));

      try {
        const results = await searchFlightsForTimeSweep({
          origin: combinations[i].origin,
          destination: combinations[i].destination,
          departureDate: params.departureDate,
          adults: params.adults,

          currency: params.currency,
        }, id);

        const cheapest = results.length > 0
          ? results.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
          : null;

        setRouteResults((prev) => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            results,
            cheapest,
            cheapestPrice: cheapest?.totalPrice ?? null,
            status: 'done' as const,
          } : r
        ));
      } catch (err) {
        setRouteResults((prev) => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Failed',
          } : r
        ));
      }

      setCompletedCount(i + 1);

      if (i < combinations.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    if (!cancelRef.current) {
      setStatus('done');
    }
  }, []);

  return { routeResults, status, completedCount, totalCount, start, cancel };
}
