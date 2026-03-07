import { useRef, useCallback } from 'react';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { searchFlightsForTimeSweep } from '../services/flightService';
import type { ScatterSearchParams, ScatterSearchRouteResult } from '../types';

const DELAY_MS = 2000;

interface ScatterSearchStore {
  routeResults: ScatterSearchRouteResult[];
  status: 'idle' | 'running' | 'done' | 'cancelled';
  completedCount: number;
  totalCount: number;
  passengers: number;
  setRouteResults: (fn: (prev: ScatterSearchRouteResult[]) => ScatterSearchRouteResult[]) => void;
  setStatus: (s: 'idle' | 'running' | 'done' | 'cancelled') => void;
  setCompletedCount: (n: number) => void;
  reset: (routeResults: ScatterSearchRouteResult[], totalCount: number, passengers: number) => void;
}

export const useScatterSearchStore = create<ScatterSearchStore>((set) => ({
  routeResults: [],
  status: 'idle',
  completedCount: 0,
  totalCount: 0,
  passengers: 1,
  setRouteResults: (fn) => set((s) => ({ routeResults: fn(s.routeResults) })),
  setStatus: (status) => set({ status }),
  setCompletedCount: (completedCount) => set({ completedCount }),
  reset: (routeResults, totalCount, passengers) => set({
    routeResults,
    totalCount,
    completedCount: 0,
    status: 'running',
    passengers,
  }),
}));

export function useScatterSearch() {
  const store = useScatterSearchStore();
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    useScatterSearchStore.getState().setStatus('cancelled');
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

    useScatterSearchStore.getState().reset(initial, combinations.length, params.adults);

    for (let i = 0; i < combinations.length; i++) {
      if (cancelRef.current) break;

      useScatterSearchStore.getState().setRouteResults((prev) => prev.map((r, idx) =>
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

        useScatterSearchStore.getState().setRouteResults((prev) => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            results,
            cheapest,
            cheapestPrice: cheapest?.totalPrice ?? null,
            status: 'done' as const,
          } : r
        ));
      } catch (err) {
        useScatterSearchStore.getState().setRouteResults((prev) => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Failed',
          } : r
        ));
      }

      useScatterSearchStore.getState().setCompletedCount(i + 1);

      if (i < combinations.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    if (!cancelRef.current) {
      useScatterSearchStore.getState().setStatus('done');
    }
  }, []);

  return {
    routeResults: store.routeResults,
    status: store.status,
    completedCount: store.completedCount,
    totalCount: store.totalCount,
    passengers: store.passengers,
    start,
    cancel,
  };
}
