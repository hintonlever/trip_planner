import { MapPin, Save, Trash2, Plane, Search, History, LogOut, Menu } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import { logout } from '../../services/authService';
import { updateTrip, createTrip } from '../../services/tripService';

export type Tab = 'planner' | 'search' | 'queries';

const tabs: { key: Tab; label: string; icon: typeof Plane }[] = [
  { key: 'planner', label: 'Trip Planner', icon: MapPin },
  { key: 'search', label: 'Flight Search', icon: Search },
  { key: 'queries', label: 'Past Queries', icon: History },
];

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function Header({ activeTab, onTabChange, onToggleSidebar, showSidebarToggle }: HeaderProps) {
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const clearTrip = useTripStore((s) => s.clearTrip);
  const user = useAuthStore((s) => s.user);

  const handleSave = async () => {
    const state = useTripStore.getState();
    try {
      if (state.currentTripId) {
        await updateTrip(state.currentTripId, {
          tripName: state.tripName,
          columns: state.columns,
          columnOrder: state.columnOrder,
          items: state.items,
        });
      } else {
        const id = await createTrip({
          tripName: state.tripName,
          columns: state.columns,
          columnOrder: state.columnOrder,
          items: state.items,
        });
        useTripStore.getState().setCurrentTripId(id);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleClear = () => {
    if (confirm('Clear all trip data? This cannot be undone.')) {
      clearTrip();
    }
  };

  const handleLogout = async () => {
    await logout();
    useAuthStore.getState().clearAuth();
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="h-14 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        {/* Sidebar toggle (mobile only, planner tab) */}
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 -ml-1 rounded hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-blue-600 flex-shrink-0">
          <Plane className="w-5 h-5" />
          <span className="font-bold text-base hidden sm:inline">Trip Planner</span>
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          <input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="text-center text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none px-2 py-1 w-full max-w-64"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 px-1.5 sm:px-2 py-1.5 rounded hover:bg-gray-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 px-1.5 sm:px-2 py-1.5 rounded hover:bg-gray-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {user && (
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-gray-200">
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-xs text-gray-600 max-w-24 truncate hidden md:inline">{user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 px-1.5 py-1 rounded hover:bg-gray-50"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex px-3 sm:px-4 gap-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
