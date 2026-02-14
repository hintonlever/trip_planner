import { UtensilsCrossed, X, Pencil, ChevronUp } from 'lucide-react';
import type { FoodCostItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

const tierColors: Record<string, string> = {
  budget: 'bg-yellow-100 text-yellow-700',
  'mid-range': 'bg-orange-100 text-orange-700',
  luxury: 'bg-purple-100 text-purple-700',
};

interface Props {
  item: FoodCostItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FoodCard({ item, expanded, onToggle, onEdit, onDelete }: Props) {
  if (!expanded) {
    return (
      <div
        className="bg-white rounded-lg border border-amber-200 px-3 py-2 shadow-sm group cursor-pointer hover:bg-amber-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 pl-4">
          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 truncate">
            {item.cityName} <span className="text-gray-400">&middot;</span> {item.tier}
          </span>
          <span className="ml-auto font-bold text-xs text-amber-700 flex-shrink-0">{formatCurrency(item.totalCost)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-0.5 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-sm group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onToggle}>
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-600 uppercase">Food</span>
          <ChevronUp className="w-3 h-3 text-gray-400" />
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

      <div className="flex items-center gap-2 mb-1">
        <p className="font-semibold text-sm">{item.cityName}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${tierColors[item.tier] || ''}`}>
          {item.tier}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {formatCurrency(item.dailyCost)}/day &middot; {item.numberOfDays} day{item.numberOfDays !== 1 ? 's' : ''} &middot; {item.numberOfPeople} {item.numberOfPeople === 1 ? 'person' : 'people'}
        {item.isOverridden && <span className="text-gray-400 ml-1">(custom)</span>}
      </p>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <span className="font-bold text-amber-700">{formatCurrency(item.totalCost)}</span>
      </div>
    </div>
  );
}
