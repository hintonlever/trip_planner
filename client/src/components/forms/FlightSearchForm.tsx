import { useState } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { searchFlights } from '../../services/flightService';
import type { FlightSearchResult } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency } from '../../utils/formatCurrency';

export function FlightSearchForm() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<FlightSearchResult[]>([]);

  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const addItem = useTripStore((s) => s.addItem);

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
        nonStop,
      });
      setResults(data);
      if (data.length === 0) setError('No flights found for this route/date.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const addFlight = (result: FlightSearchResult, columnId: string) => {
    addItem(columnId, {
      type: 'flight',
      origin: result.origin,
      destination: result.destination,
      departureDate: result.departureAt.split('T')[0],
      departureTime: result.departureAt,
      arrivalTime: result.arrivalAt,
      airlineName: result.airlineName,
      airlineCode: result.airlineCode,
      flightNumber: result.flightNumber,
      duration: result.duration,
      stops: result.stops,
      pricePerPerson: result.pricePerPerson,
      passengers: adults,
      cabin: result.cabin,
      totalCost: result.totalPrice,
      currency: result.currency,
    });
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="JFK"
              maxLength={3}
              required
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
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
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Passengers</label>
            <input
              type="number"
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={9}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-xs font-medium">{r.airlineName}</span>
                  <span className="text-xs text-gray-400 ml-1">{r.flightNumber}</span>
                </div>
                <span className="font-bold text-sm text-blue-700">{formatCurrency(r.totalPrice)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {r.origin} → {r.destination} &middot; {r.stops === 0 ? 'Direct' : `${r.stops} stop${r.stops > 1 ? 's' : ''}`}
              </p>

              {columnOrder.length > 0 ? (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {columnOrder.map((colId) => (
                    <button
                      key={colId}
                      onClick={() => addFlight(r, colId)}
                      className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      <Plus className="w-3 h-3" />
                      {columns[colId]?.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Create a destination column first</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
