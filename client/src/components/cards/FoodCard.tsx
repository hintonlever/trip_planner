import { UtensilsCrossed, X, Pencil } from 'lucide-react';
import type { FoodCostItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

const tierColors: Record<string, string> = {
  budget: 'bg-yellow-100 text-yellow-700',
  'mid-range': 'bg-orange-100 text-orange-700',
  luxury: 'bg-purple-100 text-purple-700',
};

interface Props {
  item: FoodCostItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FoodCard({ item, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-sm group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-600 uppercase">Food</span>
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
