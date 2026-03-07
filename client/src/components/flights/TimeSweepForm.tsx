import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { getQualifyingDates } from '../../utils/dateRange';
import type { TimeSweepParams } from '../../types';
import { useFlightSearchStore } from '../../store/useFlightSearchStore';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// getDay() values: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

interface TimeSweepFormProps {
  onSearch: (params: TimeSweepParams) => void;
  onCancel: () => void;
  isRunning: boolean;
}

export function TimeSweepForm({ onSearch, onCancel, isRunning }: TimeSweepFormProps) {
  const store = useFlightSearchStore((s) => s.timeSweep);
  const setStore = useFlightSearchStore((s) => s.setTimeSweep);
  const [origin, setOrigin] = useState(store.origin);
  const [destination, setDestination] = useState(store.destination);
  const [startDate, setStartDate] = useState(store.startDate);
  const [endDate, setEndDate] = useState(store.endDate);
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5, 6, 0]);
  const [returnDaysOfWeek, setReturnDaysOfWeek] = useState([1, 2, 3, 4, 5, 6, 0]);
  const [minTripDays, setMinTripDays] = useState(4);
  const [maxTripDays, setMaxTripDays] = useState(5);
  const [adults, setAdults] = useState(store.adults);
  const [currency, setCurrency] = useState(store.currency);

  const outboundCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return getQualifyingDates(startDate, endDate, daysOfWeek).length;
  }, [startDate, endDate, daysOfWeek]);

  const returnCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return getQualifyingDates(startDate, endDate, returnDaysOfWeek).length;
  }, [startDate, endDate, returnDaysOfWeek]);

  const totalQueries = outboundCount + returnCount;

  const toggleDay = (day: number, setter: React.Dispatch<React.SetStateAction<number[]>>) => {
    setter((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQueries === 0) return;
    setStore({ origin, destination, startDate, endDate, adults, currency });
    onSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      startDate,
      endDate,
      daysOfWeek,
      returnDaysOfWeek,
      minTripDays,
      maxTripDays: Math.max(minTripDays, maxTripDays),
      adults,
      currency,
    });
  };

  const inputClass = "border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50";

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Row 1: route + dates — uses grid on mobile for clean 2-col layout */}
        <div className="grid grid-cols-[1fr_1fr] sm:flex sm:items-end gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="JFK"
              maxLength={3}
              required
              disabled={isRunning}
              className={`w-full sm:w-20 uppercase placeholder:normal-case ${inputClass}`}
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
              className={`w-full sm:w-20 uppercase placeholder:normal-case ${inputClass}`}
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
              className={`w-full ${inputClass}`}
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
              className={`w-full ${inputClass}`}
            />
          </div>
        </div>

        {/* Row 2: pax, currency, button */}
        <div className="grid grid-cols-[1fr_1fr_auto] sm:flex sm:items-end gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Passengers</label>
            <input
              type="number"
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={9}
              disabled={isRunning}
              className={`w-full sm:w-16 ${inputClass}`}
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
              className={`w-full sm:w-16 uppercase placeholder:normal-case ${inputClass}`}
            />
          </div>
          {isRunning ? (
            <button
              type="button"
              onClick={onCancel}
              className="self-end bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={totalQueries === 0}
              className="self-end bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          )}
        </div>

        {/* Row 3: day-of-week checkboxes */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">Depart:</span>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {DAY_LABELS.map((label, i) => (
                <label key={i} className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={daysOfWeek.includes(DAY_VALUES[i])}
                    onChange={() => toggleDay(DAY_VALUES[i], setDaysOfWeek)}
                    disabled={isRunning}
                    className="rounded w-3.5 h-3.5"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">Return:</span>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {DAY_LABELS.map((label, i) => (
                <label key={i} className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnDaysOfWeek.includes(DAY_VALUES[i])}
                    onChange={() => toggleDay(DAY_VALUES[i], setReturnDaysOfWeek)}
                    disabled={isRunning}
                    className="rounded w-3.5 h-3.5"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: trip length + query count */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Trip length:</span>
            <input
              type="number"
              value={minTripDays}
              onChange={(e) => setMinTripDays(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={90}
              disabled={isRunning}
              className="w-14 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="number"
              value={maxTripDays}
              onChange={(e) => setMaxTripDays(Math.max(minTripDays, parseInt(e.target.value) || minTripDays))}
              min={minTripDays}
              max={90}
              disabled={isRunning}
              className="w-14 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
            <span className="text-xs text-gray-500">days</span>
          </div>

          {totalQueries > 0 && (
            <span className="text-xs text-gray-500 sm:ml-auto">
              {totalQueries} quer{totalQueries !== 1 ? 'ies' : 'y'}
              {totalQueries > 20 && (
                <span className="text-amber-600 ml-1">
                  (~{Math.ceil(totalQueries * 2 / 60)} min)
                </span>
              )}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
