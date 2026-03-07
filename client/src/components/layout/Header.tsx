import { Plane, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { logout } from '../../services/authService';

export function Header() {
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    await logout();
    useAuthStore.getState().clearAuth();
    window.location.reload();
  };

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="h-12 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Plane className="w-5 h-5" />
          <span className="font-bold text-base">Flight Search</span>
        </div>

        <div className="flex-1" />

        {user && (
          <div className="flex items-center gap-1 sm:gap-2">
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
    </header>
  );
}
