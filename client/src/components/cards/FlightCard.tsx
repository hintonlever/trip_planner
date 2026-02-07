import { Plane, Clock, X, Pencil } from 'lucide-react';
import type { FlightCostItem } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h ${m}m`;
}

function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface Props {
  item: FlightCostItem;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FlightCard({ item, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Plane className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-600 uppercase">Flight</span>
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

      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="font-bold text-sm">{item.origin}</span>
        {item.stopCodes?.map((code) => (
          <span key={code} className="contents">
            <span className="text-gray-400 text-xs">→</span>
            <span className="text-xs text-orange-500 font-medium">{code}</span>
          </span>
        ))}
        <span className="text-gray-400 text-xs">→</span>
        <span className="font-bold text-sm">{item.destination}</span>
      </div>

      <p className="text-xs text-gray-600 mb-1">
        {item.airlineName} &middot; {item.flightNumber}
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        <span>{formatTime(item.departureTime)} – {formatTime(item.arrivalTime)}</span>
        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {formatDuration(item.duration)}
        </span>
        {item.stops > 0 && (
          <span className="text-orange-500">{item.stops} stop{item.stops > 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {item.passengers > 1 ? `${item.passengers} pax` : '1 pax'}
        </span>
        <span className="font-bold text-blue-700">{formatCurrency(item.totalCost)}</span>
      </div>
    </div>
  );
}
