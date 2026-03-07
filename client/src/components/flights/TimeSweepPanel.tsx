import { useState } from 'react';
import { TimeSweepForm } from './TimeSweepForm';
import { TimeSweepResults } from './TimeSweepResults';
import { useTimeSweep } from '../../hooks/useTimeSweep';
import type { TimeSweepParams } from '../../types';

export function TimeSweepPanel() {
  const { dayResults, status, completedCount, totalCount, combos, start, cancel } = useTimeSweep();
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (params: TimeSweepParams) => {
    setPassengers(params.adults);
    start(params);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <TimeSweepForm
        onSearch={handleSearch}
        onCancel={cancel}
        isRunning={status === 'running' || status === 'cancelled'}
      />

      {status === 'running' && totalCount > 0 && (
        <div className="px-3 sm:px-6 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
            <span>Searching... {completedCount} / {totalCount} flights</span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="px-3 sm:px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          Search cancelled ({completedCount} / {totalCount} flights completed)
        </div>
      )}

      {(status === 'done' || status === 'running' || status === 'cancelled') && dayResults.length > 0 && (
        <TimeSweepResults dayResults={dayResults} combos={combos} passengers={passengers} />
      )}

      {status === 'idle' && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          Search a route across a date range to find the cheapest outbound + return combo
        </div>
      )}
    </div>
  );
}
