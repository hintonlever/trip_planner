import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ScatterSearchParams } from '../../types';
import { useFlightSearchStore } from '../../store/useFlightSearchStore';
import { useRecentAirports } from './AirportInput';
import { MultiAirportInput } from './MultiAirportInput';

interface ScatterSearchFormProps {
  onSearch: (params: ScatterSearchParams) => void;
  onCancel: () => void;
  isRunning: boolean;
}

export function ScatterSearchForm({ onSearch, onCancel, isRunning }: ScatterSearchFormProps) {
  const store = useFlightSearchStore((s) => s.scatter);
  const setStore = useFlightSearchStore((s) => s.setScatter);
  const addRecent = useRecentAirports((s) => s.addRecent);
  const [origins, setOrigins] = useState<string[]>(store.origins);
  const [destinations, setDestinations] = useState<string[]>(store.destinations);
  const [departureDate, setDepartureDate] = useState(store.departureDate);
  const [adults, setAdults] = useState(store.adults);
  const [currency, setCurrency] = useState(store.currency);

  const combinationCount = origins.length * destinations.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (combinationCount === 0) return;
    setStore({ origins, destinations, departureDate, adults, currency });
    for (const code of origins) addRecent(code);
    for (const code of destinations) addRecent(code);
    onSearch({
      origins,
      destinations,
      departureDate,
      adults,
      currency,
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px] sm:min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Origins</label>
            <MultiAirportInput
              codes={origins}
              onChange={setOrigins}
              placeholder="Add airports..."
              disabled={isRunning}
              color="blue"
            />
          </div>

          <div className="flex-1 min-w-[140px] sm:min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Destinations</label>
            <MultiAirportInput
              codes={destinations}
              onChange={setDestinations}
              placeholder="Add airports..."
              disabled={isRunning}
              color="green"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              required
              disabled={isRunning}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Passengers</label>
            <input
              type="number"
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={9}
              disabled={isRunning}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="AUD"
              maxLength={3}
              disabled={isRunning}
              className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          {isRunning ? (
            <button
              type="button"
              onClick={onCancel}
              className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={combinationCount === 0 || !departureDate}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          )}
        </div>

        {combinationCount > 0 && (
          <div className="text-xs text-gray-500">
            {origins.length} origin{origins.length !== 1 ? 's' : ''} × {destinations.length} destination{destinations.length !== 1 ? 's' : ''} = {combinationCount} API quer{combinationCount !== 1 ? 'ies' : 'y'}
            {combinationCount > 10 && (
              <span className="text-amber-600 ml-1">
                (~{Math.ceil(combinationCount * 2 / 60)} min)
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
