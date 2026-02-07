import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import type { OtherCostMode } from '../../types';

export function OtherCostForm() {
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<OtherCostMode>('total');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('1');
  const [columnId, setColumnId] = useState('');

  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const addItem = useTripStore((s) => s.addItem);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedDays = parseInt(days) || 0;
  const totalCost = mode === 'per-day' ? parsedAmount * parsedDays : parsedAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCol = columnId || columnOrder[0];

    if (!label.trim() || !parsedAmount || !targetCol) return;
    if (mode === 'per-day' && !parsedDays) return;

    addItem(targetCol, {
      type: 'other',
      label: label.trim(),
      mode,
      dailyCost: mode === 'per-day' ? parsedAmount : parsedAmount,
      numberOfDays: mode === 'per-day' ? parsedDays : 1,
      totalCost,
      currency: 'USD',
    });

    setLabel('');
    setAmount('');
    setDays('1');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. City tour, Museum pass..."
          required
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cost type</label>
        <div className="flex gap-1">
          {([
            { key: 'total' as OtherCostMode, label: 'Total amount' },
            { key: 'per-day' as OtherCostMode, label: 'Per day' },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                mode === opt.key
                  ? 'bg-violet-100 border-violet-400 text-violet-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={mode === 'per-day' ? 'grid grid-cols-2 gap-2' : ''}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {mode === 'per-day' ? 'Daily cost ($)' : 'Amount ($)'}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="any"
            required
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
        </div>
        {mode === 'per-day' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="1"
              required
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
        )}
      </div>

      {totalCost > 0 && (
        <p className="text-xs text-gray-500 text-right">
          Total: <span className="font-bold text-violet-700">${totalCost}</span>
        </p>
      )}

      {columnOrder.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Add to</label>
          <select
            value={columnId || columnOrder[0]}
            onChange={(e) => setColumnId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
          >
            {columnOrder.map((id) => (
              <option key={id} value={id}>{columns[id]?.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={columnOrder.length === 0 || !label.trim()}
        className="w-full bg-violet-600 text-white py-2 rounded-md text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Ticket className="w-4 h-4" />
        Add Other Cost
      </button>
      {columnOrder.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Create a destination column first</p>
      )}
    </form>
  );
}
