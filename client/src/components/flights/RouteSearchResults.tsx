import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { RouteSearchDayResult } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseDuration } from '../../utils/flightUtils';

interface RouteSearchResultsProps {
  dayResults: RouteSearchDayResult[];
  passengers: number;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${day} ${date}`;
}

export function RouteSearchResults({ dayResults, passengers }: RouteSearchResultsProps) {
  const [directOnly, setDirectOnly] = useState(false);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allCarriers = useMemo(() => {
    const set = new Set<string>();
    for (const day of dayResults) {
      for (const r of day.results) {
        set.add(r.airlineName);
      }
    }
    return Array.from(set).sort();
  }, [dayResults]);

  const filteredDayResults = useMemo(() => {
    return dayResults.map((day) => {
      if (day.status !== 'done') {
        return { ...day, filteredResults: day.results, filteredCheapestPrice: null as number | null };
      }

      let filtered = day.results;
      if (directOnly) filtered = filtered.filter((r) => r.stops === 0);
      if (maxDuration) filtered = filtered.filter((r) => parseDuration(r.duration) <= maxDuration);
      if (selectedCarrier) filtered = filtered.filter((r) => r.airlineName === selectedCarrier);

      const cheapest = filtered.length > 0
        ? filtered.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
        : null;

      return {
        ...day,
        filteredResults: filtered,
        filteredCheapestPrice: cheapest?.totalPrice ?? null,
      };
    });
  }, [dayResults, directOnly, maxDuration, selectedCarrier]);

  const chartData = filteredDayResults
    .filter((d) => d.status === 'done')
    .map((d) => ({
      date: d.date,
      label: formatDateLabel(d.date),
      price: d.filteredCheapestPrice,
    }));

  const selectedDayData = selectedDate
    ? filteredDayResults.find((d) => d.date === selectedDate)
    : null;

  const handleBarClick = (_data: unknown, index: number) => {
    const entry = chartData[index];
    if (entry) {
      setSelectedDate(entry.date);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters bar */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
            className="rounded"
          />
          Direct only
        </label>

        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Max duration:</span>
          <select
            value={maxDuration ?? ''}
            onChange={(e) => setMaxDuration(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="">Any</option>
            <option value="300">5h</option>
            <option value="480">8h</option>
            <option value="720">12h</option>
            <option value="960">16h</option>
            <option value="1440">24h</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Carrier:</span>
          <select
            value={selectedCarrier ?? ''}
            onChange={(e) => setSelectedCarrier(e.target.value || null)}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value="">All</option>
            {allCarriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="px-6 py-4 bg-white border-b border-gray-200" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={chartData.length > 14 ? Math.floor(chartData.length / 14) : 0}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 60 : 30}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Cheapest']}
                labelFormatter={(label: string) => label}
              />
              <Bar dataKey="price" radius={[4, 4, 0, 0]} onClick={handleBarClick} cursor="pointer">
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.date === selectedDate ? '#2563eb' : '#93c5fd'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No results message */}
      {chartData.length > 0 && chartData.every((d) => d.price === null) && (
        <div className="px-6 py-4 text-sm text-gray-500 text-center">
          No flights match the current filters
        </div>
      )}

      {/* Selected date detail */}
      {selectedDayData && selectedDayData.filteredResults && selectedDayData.filteredResults.length > 0 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            {selectedDayData.filteredResults.length} flight{selectedDayData.filteredResults.length !== 1 ? 's' : ''} on {formatDateLabel(selectedDate!)}
          </div>
          <FlightResultsTable results={selectedDayData.filteredResults} passengers={passengers} />
        </div>
      )}

      {selectedDate && selectedDayData && selectedDayData.filteredResults && selectedDayData.filteredResults.length === 0 && (
        <div className="px-6 py-8 text-sm text-gray-400 text-center">
          No flights match filters for {formatDateLabel(selectedDate)}
        </div>
      )}

      {!selectedDate && chartData.length > 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Click a bar to see flights for that date
        </div>
      )}
    </div>
  );
}
