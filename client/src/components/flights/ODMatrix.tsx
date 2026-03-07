import { useMemo } from 'react';
import type { FlightSearchResult } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface ODMatrixProps {
  results: FlightSearchResult[];
  onCellClick?: (origin: string, destination: string) => void;
  selectedRoute?: { origin: string; destination: string } | null;
}

export function ODMatrix({ results, onCellClick, selectedRoute }: ODMatrixProps) {
  const { origins, destinations, matrix, globalMin } = useMemo(() => {
    const routeMap = new Map<string, { cheapest: number; count: number }>();
    const originSet = new Set<string>();
    const destSet = new Set<string>();

    for (const r of results) {
      originSet.add(r.origin);
      destSet.add(r.destination);
      const key = `${r.origin}-${r.destination}`;
      const existing = routeMap.get(key);
      if (!existing || r.totalPrice < existing.cheapest) {
        routeMap.set(key, { cheapest: r.totalPrice, count: (existing?.count ?? 0) + 1 });
      } else {
        existing.count++;
      }
    }

    const origins = Array.from(originSet).sort();
    const destinations = Array.from(destSet).sort();

    let globalMin = Infinity;
    for (const val of routeMap.values()) {
      if (val.cheapest < globalMin) globalMin = val.cheapest;
    }

    return { origins, destinations, matrix: routeMap, globalMin };
  }, [results]);

  if (origins.length === 0 || destinations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No routes to display
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-3 sm:p-6">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 sticky left-0 z-10">
                  Origin \ Dest
                </th>
                {destinations.map((dest) => (
                  <th
                    key={dest}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 font-mono"
                  >
                    {dest}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {origins.map((origin) => (
                <tr key={origin}>
                  <td className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 font-mono sticky left-0 z-10">
                    {origin}
                  </td>
                  {destinations.map((dest) => {
                    const key = `${origin}-${dest}`;
                    const cell = matrix.get(key);
                    const isSelected = selectedRoute?.origin === origin && selectedRoute?.destination === dest;
                    const isCheapest = cell && cell.cheapest === globalMin;

                    return (
                      <td
                        key={dest}
                        onClick={() => cell && onCellClick?.(origin, dest)}
                        className={`px-3 py-2 border border-gray-200 text-center transition-colors ${
                          cell
                            ? `cursor-pointer hover:bg-blue-50 ${
                                isSelected
                                  ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset'
                                  : isCheapest
                                    ? 'bg-green-50'
                                    : 'bg-white'
                              }`
                            : 'bg-gray-50 text-gray-300'
                        }`}
                      >
                        {cell ? (
                          <div>
                            <div className={`font-medium text-sm ${isCheapest ? 'text-green-700' : 'text-gray-800'}`}>
                              {formatCurrency(cell.cheapest)}
                            </div>
                            <div className="text-[10px] text-gray-400">{cell.count} flight{cell.count !== 1 ? 's' : ''}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
