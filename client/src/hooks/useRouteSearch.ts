import { useState, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { searchFlightsForRouteSearch } from '../services/flightService';
import { getQualifyingDates } from '../utils/dateRange';
import type { RouteSearchParams, RouteSearchDayResult } from '../types';

const DELAY_MS = 2000;

export function useRouteSearch() {
  const [dayResults, setDayResults] = useState<RouteSearchDayResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'cancelled'>('idle');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [routeSearchId, setRouteSearchId] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setStatus('cancelled');
  }, []);

  const start = useCallback(async (params: RouteSearchParams) => {
    cancelRef.current = false;
    const id = nanoid();
    setRouteSearchId(id);

    const dates = getQualifyingDates(params.startDate, params.endDate, params.daysOfWeek);
    const initial: RouteSearchDayResult[] = dates.map((date) => ({
      date,
      results: [],
      cheapest: null,
      cheapestPrice: null,
      status: 'pending',
    }));

    setDayResults(initial);
    setTotalCount(dates.length);
    setCompletedCount(0);
    setStatus('running');

    for (let i = 0; i < dates.length; i++) {
      if (cancelRef.current) break;

      setDayResults((prev) => prev.map((d, idx) =>
        idx === i ? { ...d, status: 'loading' as const } : d
      ));

      try {
        const results = await searchFlightsForRouteSearch({
          origin: params.origin,
          destination: params.destination,
          departureDate: dates[i],
          adults: params.adults,
          nonStop: params.nonStop,
          currency: params.currency,
        }, id);

        const cheapest = results.length > 0
          ? results.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
          : null;

        setDayResults((prev) => prev.map((d, idx) =>
          idx === i ? {
            ...d,
            results,
            cheapest,
            cheapestPrice: cheapest?.totalPrice ?? null,
            status: 'done' as const,
          } : d
        ));
      } catch (err) {
        setDayResults((prev) => prev.map((d, idx) =>
          idx === i ? {
            ...d,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Failed',
          } : d
        ));
      }

      setCompletedCount(i + 1);

      if (i < dates.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    if (!cancelRef.current) {
      setStatus('done');
    }
  }, []);

  return { dayResults, status, completedCount, totalCount, routeSearchId, start, cancel };
}
