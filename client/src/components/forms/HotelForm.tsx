import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';

export function HotelForm() {
  const [hotelName, setHotelName] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [nights, setNights] = useState('1');
  const [columnId, setColumnId] = useState('');

  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const addItem = useTripStore((s) => s.addItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(pricePerNight);
    const numNights = parseInt(nights);
    const targetCol = columnId || columnOrder[0];

    if (!hotelName.trim() || !price || !numNights || !targetCol) return;

    addItem(targetCol, {
      type: 'hotel',
      hotelName: hotelName.trim(),
      pricePerNight: price,
      numberOfNights: numNights,
      totalCost: price * numNights,
      currency: 'USD',
    });

    setHotelName('');
    setPricePerNight('');
    setNights('1');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Hotel name</label>
        <input
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          placeholder="Park Hyatt Tokyo"
          required
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Price/night ($)</label>
          <input
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            placeholder="200"
            min="0"
            step="1"
            required
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nights</label>
          <input
            type="number"
            value={nights}
            onChange={(e) => setNights(e.target.value)}
            min="1"
            required
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
      </div>

      {columnOrder.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Add to</label>
          <select
            value={columnId || columnOrder[0]}
            onChange={(e) => setColumnId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {columnOrder.map((id) => (
              <option key={id} value={id}>{columns[id]?.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={columnOrder.length === 0}
        className="w-full bg-emerald-600 text-white py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Building2 className="w-4 h-4" />
        Add Hotel
      </button>
      {columnOrder.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Create a destination column first</p>
      )}
    </form>
  );
}
