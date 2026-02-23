import { useMemo } from 'react';
import { useTripStore, selectColumnTotal } from '../../store/useTripStore';
import { formatCurrency } from '../../utils/formatCurrency';

export function ComparisonBar() {
  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const items = useTripStore((s) => s.items);

  const totals = useMemo(() => {
    return columnOrder.map((colId) => ({
      columnId: colId,
      name: columns[colId]?.name ?? '',
      total: selectColumnTotal({ columns, items, columnOrder, tripName: '', currentTripId: null }, colId),
    }));
  }, [columnOrder, columns, items]);

  if (totals.length === 0) return null;

  const minTotal = Math.min(...totals.filter((t) => t.total > 0).map((t) => t.total));

  return (
    <div className="h-12 bg-white border-t border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 overflow-x-auto">
      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Compare:</span>
      {totals.map((col) => {
        const isCheapest = col.total > 0 && col.total === minTotal && totals.filter((t) => t.total > 0).length > 1;
        return (
          <div
            key={col.columnId}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm flex-shrink-0 ${
              isCheapest
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <span className="font-medium">{col.name}</span>
            <span className="font-bold">{formatCurrency(col.total)}</span>
            {isCheapest && <span className="text-xs">Cheapest</span>}
          </div>
        );
      })}
    </div>
  );
}
