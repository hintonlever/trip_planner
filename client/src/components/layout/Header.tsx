import { MapPin, Save, Trash2, Plane, Search, History } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { saveToStorage, clearStorage } from '../../services/persistenceService';

export type Tab = 'planner' | 'search' | 'queries';

const tabs: { key: Tab; label: string; icon: typeof Plane }[] = [
  { key: 'planner', label: 'Trip Planner', icon: MapPin },
  { key: 'search', label: 'Flight Search', icon: Search },
  { key: 'queries', label: 'Past Queries', icon: History },
];

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
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
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="h-14 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Plane className="w-5 h-5" />
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
      </div>

      <nav className="flex px-4 gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
