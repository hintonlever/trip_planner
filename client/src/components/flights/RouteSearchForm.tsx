import { useState, useMemo } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { getQualifyingDates } from '../../utils/dateRange';
import type { RouteSearchParams } from '../../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RouteSearchFormProps {
  onSearch: (params: RouteSearchParams) => void;
  onCancel: () => void;
  isRunning: boolean;
}

export function RouteSearchForm({ onSearch, onCancel, isRunning }: RouteSearchFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState('AUD');
  const [nonStop, setNonStop] = useState(false);

  const expectedQueries = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return getQualifyingDates(startDate, endDate, daysOfWeek).length;
  }, [startDate, endDate, daysOfWeek]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expectedQueries === 0) return;
    onSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      startDate,
      endDate,
      daysOfWeek,
      adults,
      nonStop,
      currency,
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="JFK"
              maxLength={3}
              required
              disabled={isRunning}
              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
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
              disabled={isRunning}
              className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isRunning}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
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
              disabled={expectedQueries === 0}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Days:</span>
            {DAY_LABELS.map((label, i) => (
              <label key={i} className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(i)}
                  onChange={() => toggleDay(i)}
                  disabled={isRunning}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>

          {expectedQueries > 0 && (
            <span className="text-xs text-gray-500 ml-auto">
              {expectedQueries} API quer{expectedQueries !== 1 ? 'ies' : 'y'}
              {expectedQueries > 20 && (
                <span className="text-amber-600 ml-1">
                  (~{Math.ceil(expectedQueries * 2 / 60)} min)
                </span>
              )}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
