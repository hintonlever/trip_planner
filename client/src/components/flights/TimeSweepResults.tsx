import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { TimeSweepDayResult, TimeSweepCombo } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { formatCurrency } from '../../utils/formatCurrency';
import { parseDuration } from '../../utils/flightUtils';

interface TimeSweepResultsProps {
  dayResults: TimeSweepDayResult[];
  combos: TimeSweepCombo[];
  passengers: number;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${day} ${date}`;
}

type TabView = 'combos' | 'outbound' | 'return';

export function TimeSweepResults({ dayResults, combos, passengers }: TimeSweepResultsProps) {
  const [activeTab, setActiveTab] = useState<TabView>('combos');
  const [directOnly, setDirectOnly] = useState(false);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const outboundResults = useMemo(() => dayResults.filter((d) => d.direction === 'outbound'), [dayResults]);
  const returnResults = useMemo(() => dayResults.filter((d) => d.direction === 'return'), [dayResults]);

  const currentDirResults = activeTab === 'return' ? returnResults : outboundResults;

  const allCarriers = useMemo(() => {
    const set = new Set<string>();
    for (const day of currentDirResults) {
      for (const r of day.results) {
        set.add(r.airlineName);
      }
    }
    return Array.from(set).sort();
  }, [currentDirResults]);

  const filteredDayResults = useMemo(() => {
    return currentDirResults.map((day) => {
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
  }, [currentDirResults, directOnly, maxDuration, selectedCarrier]);

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

  const allFilteredResults = useMemo(() => {
    return filteredDayResults
      .filter((d) => d.status === 'done' && d.filteredResults && d.filteredResults.length > 0)
      .flatMap((d) => d.filteredResults!);
  }, [filteredDayResults]);

  const handleBarClick = (_data: unknown, index: number) => {
    const entry = chartData[index];
    if (entry) {
      setSelectedDate(entry.date);
    }
  };

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    setSelectedDate(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Tab bar */}
      <div className="px-3 sm:px-6 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => handleTabChange('combos')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'combos'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Best Combos ({combos.length})
        </button>
        <button
          onClick={() => handleTabChange('outbound')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'outbound'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Outbound ({outboundResults.filter((d) => d.status === 'done').length})
          {outboundResults.filter((d) => d.status === 'error').length > 0 && (
            <span className="text-red-500 ml-1">
              {outboundResults.filter((d) => d.status === 'error').length} err
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('return')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'return'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Return ({returnResults.filter((d) => d.status === 'done').length})
          {returnResults.filter((d) => d.status === 'error').length > 0 && (
            <span className="text-red-500 ml-1">
              {returnResults.filter((d) => d.status === 'error').length} err
            </span>
          )}
        </button>
      </div>

      {/* Combos tab */}
      {activeTab === 'combos' && (
        <div className="flex-1 overflow-auto">
          {combos.length === 0 ? (
            <div className="px-3 sm:px-6 py-8 text-sm text-gray-400 text-center">
              No valid combos found yet. Combos appear as searches complete.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Rank</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Total Price</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Trip</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Outbound</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Out Price</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Return</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Ret Price</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Out Flight</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Ret Flight</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.slice(0, 50).map((combo, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(combo.totalPrice)}</td>
                      <td className="px-4 py-2 text-gray-600">{combo.tripDays}d</td>
                      <td className="px-4 py-2">{formatDateLabel(combo.outboundDate)}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrency(combo.outbound.totalPrice)}</td>
                      <td className="px-4 py-2">{formatDateLabel(combo.returnDate)}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrency(combo.returnFlight.totalPrice)}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {combo.outbound.airlineName} {combo.outbound.flightNumber}
                        {combo.outbound.stops > 0 && <span className="text-gray-400 ml-1">({combo.outbound.stops} stop{combo.outbound.stops > 1 ? 's' : ''})</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {combo.returnFlight.airlineName} {combo.returnFlight.flightNumber}
                        {combo.returnFlight.stops > 0 && <span className="text-gray-400 ml-1">({combo.returnFlight.stops} stop{combo.returnFlight.stops > 1 ? 's' : ''})</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outbound / Return tabs */}
      {(activeTab === 'outbound' || activeTab === 'return') && (
        <>
          {/* Filters bar */}
          <div className="px-3 sm:px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 sm:gap-4 flex-wrap">
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
            <div className="px-3 sm:px-6 py-4 bg-white border-b border-gray-200" style={{ minHeight: 280 }}>
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
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Cheapest']}
                    labelFormatter={(label: React.ReactNode) => String(label)}
                  />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]} onClick={handleBarClick} cursor="pointer">
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.date === selectedDate ? '#2563eb' : (activeTab === 'return' ? '#86efac' : '#93c5fd')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Errors */}
          {currentDirResults.filter((d) => d.status === 'error').length > 0 && (
            <div className="px-3 sm:px-6 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600">
              {currentDirResults.filter((d) => d.status === 'error').length} date(s) failed
              {(() => {
                const firstErr = currentDirResults.find((d) => d.status === 'error' && d.error);
                return firstErr?.error ? `: ${firstErr.error}` : '';
              })()}
            </div>
          )}

          {/* No results message */}
          {chartData.length > 0 && chartData.every((d) => d.price === null) && (
            <div className="px-3 sm:px-6 py-4 text-sm text-gray-500 text-center">
              No flights match the current filters
            </div>
          )}

          {/* Results table */}
          {selectedDayData && selectedDayData.filteredResults && selectedDayData.filteredResults.length > 0 && (
            <div className="flex flex-col min-h-0">
              <div className="px-3 sm:px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {selectedDayData.filteredResults.length} flight{selectedDayData.filteredResults.length !== 1 ? 's' : ''} on {formatDateLabel(selectedDate!)}
              </div>
              <FlightResultsTable results={selectedDayData.filteredResults} passengers={passengers} />
            </div>
          )}

          {selectedDate && selectedDayData && selectedDayData.filteredResults && selectedDayData.filteredResults.length === 0 && (
            <div className="px-3 sm:px-6 py-8 text-sm text-gray-400 text-center">
              No flights match filters for {formatDateLabel(selectedDate)}
            </div>
          )}

          {!selectedDate && allFilteredResults.length > 0 && (
            <div className="flex flex-col min-h-0">
              <div className="px-3 sm:px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {allFilteredResults.length} flight{allFilteredResults.length !== 1 ? 's' : ''} across all dates
              </div>
              <FlightResultsTable results={allFilteredResults} passengers={passengers} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
