import { useMemo } from 'react';
import { Search, Loader2, BarChart3, Grid3x3 } from 'lucide-react';
import { searchFlights } from '../../services/flightService';
import { FlightResultsTable } from './FlightResultsTable';
import { FlightFilters, applyFlightFilters, extractCarriers } from './FlightFilters';
import { TimeSweepPanel } from './TimeSweepPanel';
import { ScatterSearchPanel } from './ScatterSearchPanel';
import { useFlightSearchStore } from '../../store/useFlightSearchStore';
import { create } from 'zustand';

type SearchMode = 'specific' | 'timesweep' | 'scatter';

const useSearchMode = create<{ mode: SearchMode; setMode: (m: SearchMode) => void }>((set) => ({
  mode: 'specific',
  setMode: (mode) => set({ mode }),
}));

export function FlightSearchPage() {
  const { mode: searchMode, setMode: setSearchMode } = useSearchMode();

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Sub-tab navigation */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <button
          onClick={() => setSearchMode('specific')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
            searchMode === 'specific'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Route Search
        </button>
        <button
          onClick={() => setSearchMode('timesweep')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
            searchMode === 'timesweep'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Time Sweep
        </button>
        <button
          onClick={() => setSearchMode('scatter')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
            searchMode === 'scatter'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Grid3x3 className="w-3.5 h-3.5" />
          Scatter Search
        </button>
      </div>

      {searchMode === 'specific' && <SpecificSearchPanel />}
      {searchMode === 'timesweep' && <TimeSweepPanel />}
      {searchMode === 'scatter' && <ScatterSearchPanel />}
    </div>
  );
}

function SpecificSearchPanel() {
  const s = useFlightSearchStore((st) => st.specific);
  const set = useFlightSearchStore((st) => st.setSpecific);

  const hasReturn = s.tripType === 'roundtrip';

  const outFiltered = useMemo(
    () => applyFlightFilters(s.results, s.outboundFilters, 'outbound'),
    [s.results, s.outboundFilters],
  );

  const displayResults = useMemo(
    () => hasReturn ? applyFlightFilters(outFiltered, s.returnFilters, 'return') : outFiltered,
    [outFiltered, s.returnFilters, hasReturn],
  );

  const outboundCarriers = useMemo(() => extractCarriers(s.results, 'outbound'), [s.results]);
  const returnCarriers = useMemo(() => hasReturn ? extractCarriers(s.results, 'return') : [], [s.results, hasReturn]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    set({ error: '', results: [], loading: true });
    try {
      const data = await searchFlights({
        origin: s.origin.toUpperCase(),
        destination: s.destination.toUpperCase(),
        departureDate: s.date,
        adults: s.adults,
        currency: s.currency,
        returnDate: hasReturn ? s.returnDate : undefined,
      });
      set({ results: data, loading: false });
      if (data.length === 0) set({ error: 'No flights found for this route/date.' });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Search failed', loading: false });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
        <form onSubmit={handleSearch} className="flex items-end gap-2 sm:gap-3 flex-wrap">
          <div className="flex rounded-md overflow-auto border border-gray-300 text-sm">
            <button
              type="button"
              onClick={() => set({ tripType: 'oneway' })}
              className={`px-3 py-1.5 font-medium transition-colors ${
                s.tripType === 'oneway'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              One-way
            </button>
            <button
              type="button"
              onClick={() => set({ tripType: 'roundtrip' })}
              className={`px-3 py-1.5 font-medium transition-colors ${
                s.tripType === 'roundtrip'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Round-trip
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              value={s.origin}
              onChange={(e) => set({ origin: e.target.value })}
              placeholder="JFK"
              maxLength={3}
              required
              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              value={s.destination}
              onChange={(e) => set({ destination: e.target.value })}
              placeholder="NRT"
              maxLength={3}
              required
              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Departure</label>
            <input
              type="date"
              value={s.date}
              onChange={(e) => set({ date: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {hasReturn && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return</label>
              <input
                type="date"
                value={s.returnDate}
                onChange={(e) => set({ returnDate: e.target.value })}
                min={s.date}
                required
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Passengers</label>
            <input
              type="number"
              value={s.adults}
              onChange={(e) => set({ adults: Math.max(1, parseInt(e.target.value) || 1) })}
              min={1}
              max={9}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <input
              value={s.currency}
              onChange={(e) => set({ currency: e.target.value.toUpperCase() })}
              placeholder="AUD"
              maxLength={3}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={s.loading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {s.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {s.loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {s.error && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{s.error}</p>
        )}
      </div>

      {s.results.length > 0 && (
        <div className="flex-1 flex flex-col overflow-auto">
          <FlightFilters
            label={hasReturn ? 'Outbound filters' : undefined}
            filters={s.outboundFilters}
            onChange={(f) => set({ outboundFilters: f })}
            carriers={outboundCarriers}
          />

          {hasReturn && (
            <FlightFilters
              label="Return filters"
              filters={s.returnFilters}
              onChange={(f) => set({ returnFilters: f })}
              carriers={returnCarriers}
            />
          )}

          <div className="px-3 sm:px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found
            {displayResults.length !== s.results.length && (
              <span className="text-gray-400 ml-1">({s.results.length} total)</span>
            )}
          </div>
          <FlightResultsTable results={displayResults} passengers={s.adults} />
        </div>
      )}

      {!s.loading && s.results.length === 0 && !s.error && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          Search for flights to see results here
        </div>
      )}
    </div>
  );
}
