import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import type { Tab } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Board } from './components/board/Board';
import { ComparisonBar } from './components/comparison/ComparisonBar';
import { TripMap } from './components/map/TripMap';
import { FlightSearchPage } from './components/flights/FlightSearchPage';
import { PastQueriesPage } from './components/flights/PastQueriesPage';
import { useTripStore } from './store/useTripStore';
import { loadFromStorage, saveToStorage } from './services/persistenceService';

export default function App() {
  const loadState = useTripStore((s) => s.loadState);
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  // Load saved state on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      loadState(saved as Parameters<typeof loadState>[0]);
    }
  }, [loadState]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const unsub = useTripStore.subscribe((state) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveToStorage({
          tripName: state.tripName,
          columns: state.columns,
          columnOrder: state.columnOrder,
          items: state.items,
        });
      }, 500);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

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
