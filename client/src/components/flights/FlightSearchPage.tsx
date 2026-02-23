import { useState } from 'react';
import { Search, Loader2, BarChart3, Grid3x3 } from 'lucide-react';
import { searchFlights } from '../../services/flightService';
import type { FlightSearchResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { RouteSearchPanel } from './RouteSearchPanel';
import { ScatterSearchPanel } from './ScatterSearchPanel';

type SearchMode = 'specific' | 'route' | 'scatter';

export function FlightSearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('specific');

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Sub-tab navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
        <button
          onClick={() => setSearchMode('specific')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
            searchMode === 'specific'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Specific Date
        </button>
        <button
          onClick={() => setSearchMode('route')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
            searchMode === 'route'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Route Search
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
      {searchMode === 'route' && <RouteSearchPanel />}
      {searchMode === 'scatter' && <ScatterSearchPanel />}
    </div>
  );
}

function SpecificSearchPanel() {
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState('AUD');
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<FlightSearchResult[]>([]);

  const displayResults = nonStop
    ? results.filter((r) => r.stops === 0)
    : results;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setLoading(true);
    try {
      const data = await searchFlights({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate: date,
        adults,
        currency,
        returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      });
      setResults(data);
      if (data.length === 0) setError('No flights found for this route/date.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <form onSubmit={handleSearch} className="flex items-end gap-3 flex-wrap">
          <div className="flex rounded-md overflow-auto border border-gray-300 text-sm">
            <button
              type="button"
              onClick={() => setTripType('oneway')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                tripType === 'oneway'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              One-way
            </button>
            <button
              type="button"
              onClick={() => setTripType('roundtrip')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                tripType === 'roundtrip'
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
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="JFK"
              maxLength={3}
              required
              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {tripType === 'roundtrip' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={date}
                required
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Passengers</label>
            <input
              type="number"
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={9}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="AUD"
              maxLength={3}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <label className="flex items-center gap-1.5 pb-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={nonStop}
              onChange={(e) => setNonStop(e.target.checked)}
              className="rounded"
            />
            Direct only
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found
            {nonStop && displayResults.length !== results.length && (
              <span className="text-gray-400 ml-1">({results.length} total, filtering to direct)</span>
            )}
          </div>
          <FlightResultsTable results={displayResults} passengers={adults} />
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Search for flights to see results here
        </div>
      )}
    </div>
  );
}
