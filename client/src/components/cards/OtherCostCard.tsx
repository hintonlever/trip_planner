import { Ticket, X, Pencil } from 'lucide-react';
import type { OtherCostItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface Props {
  item: OtherCostItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function OtherCostCard({ item, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-violet-200 p-3 shadow-sm group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-medium text-violet-600 uppercase">Other</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="p-1 hover:bg-gray-100 rounded">
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 hover:bg-red-50 rounded">
              <X className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      </div>

      <p className="font-semibold text-sm mb-1">{item.label}</p>

      <p className="text-xs text-gray-500 mb-2">
        {item.mode === 'per-day' ? (
          <>{formatCurrency(item.dailyCost)}/day &middot; {item.numberOfDays} day{item.numberOfDays !== 1 ? 's' : ''}</>
        ) : (
          <>Fixed cost</>
        )}
      </p>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <span className="font-bold text-violet-700">{formatCurrency(item.totalCost)}</span>
      </div>
    </div>
  );
}
