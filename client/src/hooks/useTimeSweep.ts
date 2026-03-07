import { useState, useRef, useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { searchFlightsForTimeSweep } from '../services/flightService';
import { getQualifyingDates } from '../utils/dateRange';
import type { TimeSweepParams, TimeSweepDayResult, TimeSweepCombo } from '../types';

const DELAY_MS = 2000;

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function useTimeSweep() {
  const [dayResults, setDayResults] = useState<TimeSweepDayResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'cancelled'>('idle');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeSweepId, setTimeSweepId] = useState<string | null>(null);
  const [sweepParams, setSweepParams] = useState<TimeSweepParams | null>(null);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setStatus('cancelled');
  }, []);

  const combos = useMemo((): TimeSweepCombo[] => {
    if (!sweepParams) return [];
    const { minTripDays, maxTripDays } = sweepParams;

    const outboundDays = dayResults.filter((d) => d.direction === 'outbound' && d.status === 'done');
    const returnDays = dayResults.filter((d) => d.direction === 'return' && d.status === 'done');

    const results: TimeSweepCombo[] = [];

    for (const ob of outboundDays) {
      if (ob.results.length === 0) continue;
      for (const ret of returnDays) {
        if (ret.results.length === 0) continue;
        const trip = daysBetween(ob.date, ret.date);
        if (trip < minTripDays || trip > maxTripDays) continue;

        const cheapestOut = ob.results.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min);
        const cheapestRet = ret.results.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min);

        results.push({
          outbound: cheapestOut,
          outboundDate: ob.date,
          returnFlight: cheapestRet,
          returnDate: ret.date,
          totalPrice: cheapestOut.totalPrice + cheapestRet.totalPrice,
          tripDays: trip,
        });
      }
    }

    results.sort((a, b) => a.totalPrice - b.totalPrice);
    return results;
  }, [dayResults, sweepParams]);

  const start = useCallback(async (params: TimeSweepParams) => {
    cancelRef.current = false;
    const id = nanoid();
    setTimeSweepId(id);
    setSweepParams(params);

    const outboundDates = getQualifyingDates(params.startDate, params.endDate, params.daysOfWeek);
    const returnDates = getQualifyingDates(params.startDate, params.endDate, params.returnDaysOfWeek);

    const allQueries: { date: string; direction: 'outbound' | 'return'; origin: string; destination: string }[] = [];
    for (const date of outboundDates) {
      allQueries.push({ date, direction: 'outbound', origin: params.origin, destination: params.destination });
    }
    for (const date of returnDates) {
      allQueries.push({ date, direction: 'return', origin: params.destination, destination: params.origin });
    }

    const initial: TimeSweepDayResult[] = allQueries.map((q) => ({
      date: q.date,
      direction: q.direction,
      results: [],
      cheapest: null,
      cheapestPrice: null,
      status: 'pending',
    }));

    setDayResults(initial);
    setTotalCount(allQueries.length);
    setCompletedCount(0);
    setStatus('running');

    for (let i = 0; i < allQueries.length; i++) {
      if (cancelRef.current) break;

      setDayResults((prev) => prev.map((d, idx) =>
        idx === i ? { ...d, status: 'loading' as const } : d
      ));

      try {
        const q = allQueries[i];
        const results = await searchFlightsForTimeSweep({
          origin: q.origin,
          destination: q.destination,
          departureDate: q.date,
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

      if (i < allQueries.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    setStatus((prev) => prev === 'cancelled' ? 'cancelled' : 'done');
  }, []);

  return { dayResults, status, completedCount, totalCount, timeSweepId, combos, start, cancel };
}
