import { useState, useRef, useEffect, useMemo } from 'react';
import { airports } from '../../data/airports';
import { create } from 'zustand';

// Recent airports store - persists across component instances
interface RecentAirportsStore {
  recent: string[]; // IATA codes, most recent first
  addRecent: (code: string) => void;
}

export const useRecentAirports = create<RecentAirportsStore>((set) => {
  // Load from localStorage
  let initial: string[] = [];
  try {
    const stored = localStorage.getItem('recentAirports');
    if (stored) initial = JSON.parse(stored);
  } catch { /* ignore */ }

  return {
    recent: initial,
    addRecent: (code) =>
      set((s) => {
        const next = [code, ...s.recent.filter((c) => c !== code)].slice(0, 10);
        try { localStorage.setItem('recentAirports', JSON.stringify(next)); } catch { /* ignore */ }
        return { recent: next };
      }),
  };
});

// Build a flat searchable list once
const airportEntries = Object.entries(airports).map(([code, info]) => ({
  code,
  city: info.city,
  country: info.country,
  searchStr: `${code} ${info.city} ${info.country}`.toLowerCase(),
}));

interface AirportInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AirportInput({ value, onChange, placeholder, required, disabled, className }: AirportInputProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const recent = useRecentAirports((s) => s.recent);
  const addRecent = useRecentAirports((s) => s.addRecent);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const query = value.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!query) {
      // Show recent airports when empty
      return recent
        .filter((code) => airports[code])
        .map((code) => ({
          code,
          city: airports[code].city,
          country: airports[code].country,
          isRecent: true,
        }));
    }

    // Search by code, city, or country
    const matches = airportEntries
      .filter((e) => e.searchStr.includes(query))
      .slice(0, 20);

    // Sort: exact code match first, then code starts-with, then city starts-with
    matches.sort((a, b) => {
      const aExact = a.code.toLowerCase() === query ? 0 : 1;
      const bExact = b.code.toLowerCase() === query ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;

      const aCodeStart = a.code.toLowerCase().startsWith(query) ? 0 : 1;
      const bCodeStart = b.code.toLowerCase().startsWith(query) ? 0 : 1;
      if (aCodeStart !== bCodeStart) return aCodeStart - bCodeStart;

      const aCityStart = a.city.toLowerCase().startsWith(query) ? 0 : 1;
      const bCityStart = b.city.toLowerCase().startsWith(query) ? 0 : 1;
      return aCityStart - bCityStart;
    });

    // Put recent matches at top
    const recentSet = new Set(recent);
    const recentMatches = matches.filter((m) => recentSet.has(m.code));
    const otherMatches = matches.filter((m) => !recentSet.has(m.code));

    return [
      ...recentMatches.map((m) => ({ ...m, isRecent: true })),
      ...otherMatches.map((m) => ({ ...m, isRecent: false })),
    ].slice(0, 12);
  }, [query, recent]);

  useEffect(() => {
    setHighlightIdx(-1);
  }, [suggestions.length, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectAirport = (code: string) => {
    onChange(code);
    addRecent(code);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectAirport(suggestions[highlightIdx].code);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx]);

  const showDropdown = open && focused && suggestions.length > 0;

  // Resolve display label for the current value
  const currentAirport = value.length === 3 ? airports[value.toUpperCase()] : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          // Delay close so click on suggestion registers
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={3}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={className}
      />

      {/* Inline label showing city name when a valid 3-letter code is entered */}
      {currentAirport && currentAirport.city && !showDropdown && (
        <div className="text-[10px] text-gray-400 mt-0.5 truncate leading-tight">
          {currentAirport.city}, {currentAirport.country}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px] max-h-60 overflow-auto"
        >
          {suggestions.some((s) => s.isRecent) && !query && (
            <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wider">Recent</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={s.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAirport(s.code);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                i === highlightIdx
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono font-medium w-8 flex-shrink-0">{s.code}</span>
              <span className="text-gray-500 truncate text-xs">
                {s.city ? `${s.city}, ${s.country}` : s.country}
              </span>
              {s.isRecent && query && (
                <span className="ml-auto text-[10px] text-gray-300 flex-shrink-0">recent</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
