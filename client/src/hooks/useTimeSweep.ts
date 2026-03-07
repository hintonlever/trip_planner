import { useRef, useCallback, useMemo } from 'react';
import { create } from 'zustand';
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

interface TimeSweepStore {
  dayResults: TimeSweepDayResult[];
  status: 'idle' | 'running' | 'done' | 'cancelled';
  completedCount: number;
  totalCount: number;
  timeSweepId: string | null;
  sweepParams: TimeSweepParams | null;
  passengers: number;
  setDayResults: (fn: (prev: TimeSweepDayResult[]) => TimeSweepDayResult[]) => void;
  setStatus: (s: 'idle' | 'running' | 'done' | 'cancelled') => void;
  setCompletedCount: (n: number) => void;
  reset: (dayResults: TimeSweepDayResult[], totalCount: number, id: string, params: TimeSweepParams, passengers: number) => void;
}

export const useTimeSweepStore = create<TimeSweepStore>((set) => ({
  dayResults: [],
  status: 'idle',
  completedCount: 0,
  totalCount: 0,
  timeSweepId: null,
  sweepParams: null,
  passengers: 1,
  setDayResults: (fn) => set((s) => ({ dayResults: fn(s.dayResults) })),
  setStatus: (status) => set({ status }),
  setCompletedCount: (completedCount) => set({ completedCount }),
  reset: (dayResults, totalCount, id, params, passengers) => set({
    dayResults,
    totalCount,
    completedCount: 0,
    status: 'running',
    timeSweepId: id,
    sweepParams: params,
    passengers,
  }),
}));

export function useTimeSweep() {
  const store = useTimeSweepStore();
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    useTimeSweepStore.getState().setStatus('cancelled');
  }, []);

  const combos = useMemo((): TimeSweepCombo[] => {
    if (!store.sweepParams) return [];
    const { minTripDays, maxTripDays } = store.sweepParams;

    const outboundDays = store.dayResults.filter((d) => d.direction === 'outbound' && d.status === 'done');
    const returnDays = store.dayResults.filter((d) => d.direction === 'return' && d.status === 'done');

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
  }, [store.dayResults, store.sweepParams]);

  const start = useCallback(async (params: TimeSweepParams) => {
    cancelRef.current = false;
    const id = nanoid();

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

    useTimeSweepStore.getState().reset(initial, allQueries.length, id, params, params.adults);

    for (let i = 0; i < allQueries.length; i++) {
      if (cancelRef.current) break;

      useTimeSweepStore.getState().setDayResults((prev) => prev.map((d, idx) =>
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

        useTimeSweepStore.getState().setDayResults((prev) => prev.map((d, idx) =>
          idx === i ? {
            ...d,
            results,
            cheapest,
            cheapestPrice: cheapest?.totalPrice ?? null,
            status: 'done' as const,
          } : d
        ));
      } catch (err) {
        useTimeSweepStore.getState().setDayResults((prev) => prev.map((d, idx) =>
          idx === i ? {
            ...d,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Failed',
          } : d
        ));
      }

      useTimeSweepStore.getState().setCompletedCount(i + 1);

      if (i < allQueries.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const cur = useTimeSweepStore.getState().status;
    if (cur !== 'cancelled') {
      useTimeSweepStore.getState().setStatus('done');
    }
  }, []);

  return {
    dayResults: store.dayResults,
    status: store.status,
    completedCount: store.completedCount,
    totalCount: store.totalCount,
    timeSweepId: store.timeSweepId,
    combos,
    passengers: store.passengers,
    start,
    cancel,
  };
}
