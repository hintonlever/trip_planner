import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Header } from './components/layout/Header';
import type { Tab } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Board } from './components/board/Board';
import { ComparisonBar } from './components/comparison/ComparisonBar';
import { TripMap } from './components/map/TripMap';
import { FlightSearchPage } from './components/flights/FlightSearchPage';
import { PastQueriesPage } from './components/flights/PastQueriesPage';
import { LoginPage } from './components/auth/LoginPage';
import { useTripStore } from './store/useTripStore';
import { useAuthStore } from './store/useAuthStore';
import { fetchCurrentUser } from './services/authService';
import { updateTrip, createTrip, fetchTrips, fetchTrip } from './services/tripService';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const loadState = useTripStore((s) => s.loadState);
  const setCurrentTripId = useTripStore((s) => s.setCurrentTripId);
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  const { isAuthenticated, isLoading } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);

  // Check for existing session on mount
  useEffect(() => {
    fetchCurrentUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null));
  }, [setUser]);

  // Load most recent trip from backend after authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTrips().then(async (trips) => {
      if (trips.length > 0) {
        const trip = await fetchTrip(trips[0].id);
        loadState(
          {
            tripName: trip.tripName,
            columns: trip.columns as Parameters<typeof loadState>[0]['columns'],
            columnOrder: trip.columnOrder,
            items: trip.items as Parameters<typeof loadState>[0]['items'],
            currentTripId: trip.id,
          },
          trip.id
        );
      }
    }).catch(console.error);
  }, [isAuthenticated, loadState, setCurrentTripId]);

  // Auto-save to backend (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeout: ReturnType<typeof setTimeout>;
    const unsub = useTripStore.subscribe((state) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          if (state.currentTripId) {
            await updateTrip(state.currentTripId, {
              tripName: state.tripName,
              columns: state.columns,
              columnOrder: state.columnOrder,
              items: state.items,
            });
          } else if (state.columnOrder.length > 0) {
            // Auto-create trip when user starts adding data
            const id = await createTrip({
              tripName: state.tripName,
              columns: state.columns,
              columnOrder: state.columnOrder,
              items: state.items,
            });
            useTripStore.getState().setCurrentTripId(id);
          }
        } catch (err) {
          console.error('Auto-save failed:', err);
        }
      }, 1000);
    });
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginPage />
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'planner' && (
        <>
          <TripMap />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <Board />
          </div>
          <ComparisonBar />
        </>
      )}

      {activeTab === 'search' && <FlightSearchPage />}

      {activeTab === 'queries' && <PastQueriesPage />}
    </div>
  );
}
