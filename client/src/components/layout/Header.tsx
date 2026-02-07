import { MapPin, Save, Trash2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { saveToStorage, clearStorage } from '../../services/persistenceService';

export function Header() {
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const clearTrip = useTripStore((s) => s.clearTrip);

  const handleSave = () => {
    const state = useTripStore.getState();
    saveToStorage({
      tripName: state.tripName,
      columns: state.columns,
      columnOrder: state.columnOrder,
      items: state.items,
    });
  };

  const handleClear = () => {
    if (confirm('Clear all trip data? This cannot be undone.')) {
      clearTrip();
      clearStorage();
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 text-blue-600">
        <MapPin className="w-5 h-5" />
        <span className="font-bold text-base">Trip Planner</span>
      </div>

      <div className="flex-1 flex justify-center">
        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="text-center text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-2 py-1 w-64"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 px-2 py-1.5 rounded hover:bg-gray-50"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 px-2 py-1.5 rounded hover:bg-gray-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </header>
  );
}
