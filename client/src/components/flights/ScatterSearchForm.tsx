import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { ScatterSearchParams } from '../../types';

interface ScatterSearchFormProps {
  onSearch: (params: ScatterSearchParams) => void;
  onCancel: () => void;
  isRunning: boolean;
}

function parseAirportCodes(input: string): string[] {
  return input
    .toUpperCase()
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length === 3 && /^[A-Z]{3}$/.test(s));
}

export function ScatterSearchForm({ onSearch, onCancel, isRunning }: ScatterSearchFormProps) {
  const [originsInput, setOriginsInput] = useState('');
  const [destinationsInput, setDestinationsInput] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState('AUD');
  const [nonStop, setNonStop] = useState(false);

  const origins = useMemo(() => parseAirportCodes(originsInput), [originsInput]);
  const destinations = useMemo(() => parseAirportCodes(destinationsInput), [destinationsInput]);
  const combinationCount = origins.length * destinations.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (combinationCount === 0) return;
    onSearch({
      origins,
      destinations,
      departureDate,
      adults,
      nonStop,
      currency,
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Origins</label>
            <input
              value={originsInput}
              onChange={(e) => setOriginsInput(e.target.value)}
              placeholder="SYD, MEL, BNE"
              disabled={isRunning}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Destinations</label>
            <input
              value={destinationsInput}
              onChange={(e) => setDestinationsInput(e.target.value)}
              placeholder="NRT, KIX, ICN"
              disabled={isRunning}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
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

          <label className="flex items-center gap-1.5 pb-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={nonStop}
              onChange={(e) => setNonStop(e.target.checked)}
              disabled={isRunning}
              className="rounded"
            />
            Direct only
          </label>

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

        <div className="flex items-center gap-4">
          {origins.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500">From:</span>
              {origins.map((code) => (
                <span key={code} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                  {code}
                </span>
              ))}
            </div>
          )}

          {destinations.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500">To:</span>
              {destinations.map((code) => (
                <span key={code} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                  {code}
                </span>
              ))}
            </div>
          )}

          {combinationCount > 0 && (
            <span className="text-xs text-gray-500 ml-auto">
              {origins.length} origin{origins.length !== 1 ? 's' : ''} × {destinations.length} destination{destinations.length !== 1 ? 's' : ''} = {combinationCount} API quer{combinationCount !== 1 ? 'ies' : 'y'}
              {combinationCount > 10 && (
                <span className="text-amber-600 ml-1">
                  (~{Math.ceil(combinationCount * 2 / 60)} min)
                </span>
              )}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
