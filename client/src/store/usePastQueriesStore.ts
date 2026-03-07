import { create } from 'zustand';
import type { CacheSearchResult } from '../types';
import { defaultFilterState, type FlightFilterState } from '../components/flights/FlightFilters';

type PastViewMode = 'table' | 'map' | 'od';

interface PastQueriesStore {
  // Search form
  origins: string[];
  destinations: string[];
  departureDates: string[];
  dateInput: string;
  tripType: 'any' | 'oneway' | 'roundtrip';

  // Results
  allResults: CacheSearchResult[];
  loading: boolean;
  error: string;
  loaded: boolean;

  // View
  viewMode: PastViewMode;
  filters: FlightFilterState;
  selectedRoute: { origin: string; destination: string } | null;

  // Actions
  setOrigins: (v: string[]) => void;
  setDestinations: (v: string[]) => void;
  setDepartureDates: (v: string[]) => void;
  setDateInput: (v: string) => void;
  setTripType: (v: 'any' | 'oneway' | 'roundtrip') => void;
  setAllResults: (v: CacheSearchResult[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string) => void;
  setLoaded: (v: boolean) => void;
  setViewMode: (v: PastViewMode) => void;
  setFilters: (v: FlightFilterState) => void;
  setSelectedRoute: (v: { origin: string; destination: string } | null) => void;
  clearSearchFilters: () => void;
}

export const usePastQueriesStore = create<PastQueriesStore>((set) => ({
  origins: [],
  destinations: [],
  departureDates: [],
  dateInput: '',
  tripType: 'any',

  allResults: [],
  loading: false,
  error: '',
  loaded: false,

  viewMode: 'table',
  filters: { ...defaultFilterState, selectedCarriers: new Set() },
  selectedRoute: null,

  setOrigins: (origins) => set({ origins }),
  setDestinations: (destinations) => set({ destinations }),
  setDepartureDates: (departureDates) => set({ departureDates }),
  setDateInput: (dateInput) => set({ dateInput }),
  setTripType: (tripType) => set({ tripType }),
  setAllResults: (allResults) => set({ allResults }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLoaded: (loaded) => set({ loaded }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilters: (filters) => set({ filters }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  clearSearchFilters: () => set({ origins: [], destinations: [], departureDates: [], tripType: 'any' }),
}));
