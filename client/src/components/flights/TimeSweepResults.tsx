import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { TimeSweepDayResult, TimeSweepCombo } from '../../types';
import { FlightResultsTable } from './FlightResultsTable';
import { FlightMap } from './FlightMap';
import { FlightFilters, applyFlightFilters, extractCarriers, defaultFilterState, type FlightFilterState } from './FlightFilters';
import { formatCurrency } from '../../utils/formatCurrency';
import { Table2, Map as MapIcon } from 'lucide-react';

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
type SweepViewMode = 'table' | 'map';

export function TimeSweepResults({ dayResults, combos, passengers }: TimeSweepResultsProps) {
  const [activeTab, setActiveTab] = useState<TabView>('combos');
  const [outboundFilters, setOutboundFilters] = useState<FlightFilterState>({ ...defaultFilterState, selectedCarriers: new Set() });
  const [returnFilters, setReturnFilters] = useState<FlightFilterState>({ ...defaultFilterState, selectedCarriers: new Set() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<SweepViewMode>('table');

  // Trip length range filter for combos tab
  const tripDaysRange = useMemo(() => {
    if (combos.length === 0) return { min: 1, max: 30 };
    let min = Infinity, max = -Infinity;
    for (const c of combos) {
      if (c.tripDays < min) min = c.tripDays;
      if (c.tripDays > max) max = c.tripDays;
    }
    return { min, max };
  }, [combos]);

  const [tripLengthMin, setTripLengthMin] = useState<number | null>(null);
  const [tripLengthMax, setTripLengthMax] = useState<number | null>(null);

  const effectiveMin = tripLengthMin ?? tripDaysRange.min;
  const effectiveMax = tripLengthMax ?? tripDaysRange.max;

  const outboundResults = useMemo(() => dayResults.filter((d) => d.direction === 'outbound'), [dayResults]);
  const returnResults = useMemo(() => dayResults.filter((d) => d.direction === 'return'), [dayResults]);

  const currentDirResults = activeTab === 'return' ? returnResults : outboundResults;
  const currentFilters = activeTab === 'return' ? returnFilters : outboundFilters;
  const setCurrentFilters = activeTab === 'return' ? setReturnFilters : setOutboundFilters;

  const currentCarriers = useMemo(() => {
    const allFlights = currentDirResults
      .filter((d) => d.status === 'done')
      .flatMap((d) => d.results);
    return extractCarriers(allFlights, 'outbound');
  }, [currentDirResults]);

  const filteredDayResults = useMemo(() => {
    return currentDirResults.map((day) => {
      if (day.status !== 'done') {
        return { ...day, filteredResults: day.results, filteredCheapestPrice: null as number | null };
      }
      const filtered = applyFlightFilters(day.results, currentFilters, 'outbound');
      const cheapest = filtered.length > 0
        ? filtered.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min)
        : null;
      return {
        ...day,
        filteredResults: filtered,
        filteredCheapestPrice: cheapest?.totalPrice ?? null,
      };
    });
  }, [currentDirResults, currentFilters]);

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

  const filteredCombos = useMemo(() => {
    return combos.filter((c) => c.tripDays >= effectiveMin && c.tripDays <= effectiveMax);
  }, [combos, effectiveMin, effectiveMax]);

  const handleBarClick = (_data: unknown, index: number) => {
    const entry = chartData[index];
    if (entry) setSelectedDate(entry.date);
  };

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
    setSelectedDate(null);
  };

  // Determine which results to show in table/map for outbound/return tabs
  const displayResults = selectedDayData?.filteredResults ?? (selectedDate ? [] : allFilteredResults);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Tab bar */}
      <div className="px-3 sm:px-6 py-2 bg-white border-b border-gray-200 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('combos')}
          className={`text-xs px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'combos'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Combos ({filteredCombos.length})
        </button>
        <button
          onClick={() => handleTabChange('outbound')}
          className={`text-xs px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'outbound'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Out ({outboundResults.filter((d) => d.status === 'done').length})
          {outboundResults.filter((d) => d.status === 'error').length > 0 && (
            <span className="text-red-500 ml-1">
              {outboundResults.filter((d) => d.status === 'error').length} err
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('return')}
          className={`text-xs px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'return'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ret ({returnResults.filter((d) => d.status === 'done').length})
          {returnResults.filter((d) => d.status === 'error').length > 0 && (
            <span className="text-red-500 ml-1">
              {returnResults.filter((d) => d.status === 'error').length} err
            </span>
          )}
        </button>
      </div>

      {/* Combos tab */}
      {activeTab === 'combos' && (
        <div className="flex-1 flex flex-col overflow-auto">
          <FlightFilters
            label="Combo filters"
            filters={outboundFilters}
            onChange={setOutboundFilters}
            carriers={currentCarriers}
            tripLength={{
              min: tripDaysRange.min,
              max: tripDaysRange.max,
              effectiveMin,
              effectiveMax,
              onMinChange: setTripLengthMin,
              onMaxChange: setTripLengthMax,
              filteredCount: filteredCombos.length,
              totalCount: combos.length,
            }}
          />

          {filteredCombos.length === 0 ? (
            <div className="px-3 sm:px-6 py-8 text-sm text-gray-400 text-center">
              {combos.length === 0
                ? 'No valid combos found yet. Combos appear as searches complete.'
                : 'No combos match the trip length filter.'}
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
                  {filteredCombos.slice(0, 50).map((combo, i) => (
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
          {/* Filters + view toggle */}
          <div className="flex items-center">
            <div className="flex-1">
              <FlightFilters
                label={activeTab === 'outbound' ? 'Outbound filters' : 'Return filters'}
                filters={currentFilters}
                onChange={setCurrentFilters}
                carriers={currentCarriers}
              />
            </div>
            <div className="pr-3 sm:pr-6 flex items-center gap-1 bg-gray-50 border-b border-gray-200 py-2">
              <div className="flex items-center gap-1 bg-gray-200 rounded p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded text-xs flex items-center gap-1 ${viewMode === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1 rounded text-xs flex items-center gap-1 ${viewMode === 'map' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Map
                </button>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="px-3 sm:px-6 py-1 bg-gray-50 border-b border-gray-200 flex items-center">
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
              >
                Clear date selection
              </button>
            </div>
          )}

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="px-1 sm:px-6 py-2 sm:py-4 bg-white border-b border-gray-200" style={{ minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={chartData.length > 7 ? Math.floor(chartData.length / 7) : 0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
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

          {/* No results */}
          {chartData.length > 0 && chartData.every((d) => d.price === null) && (
            <div className="px-3 sm:px-6 py-4 text-sm text-gray-500 text-center">
              No flights match the current filters
            </div>
          )}

          {/* Results: table or map */}
          {displayResults.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-3 sm:px-6 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                {displayResults.length} flight{displayResults.length !== 1 ? 's' : ''}
                {selectedDate ? ` on ${formatDateLabel(selectedDate)}` : ' across all dates'}
              </div>
              {viewMode === 'table' && (
                <FlightResultsTable results={displayResults} passengers={passengers} />
              )}
              {viewMode === 'map' && (
                <FlightMap results={displayResults} />
              )}
            </div>
          )}

          {selectedDate && displayResults.length === 0 && (
            <div className="px-3 sm:px-6 py-8 text-sm text-gray-400 text-center">
              No flights match filters for {formatDateLabel(selectedDate)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
