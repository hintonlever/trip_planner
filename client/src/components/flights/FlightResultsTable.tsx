import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, ArrowRight } from 'lucide-react';
import type { FlightSearchResult, FlightSegment } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency } from '../../utils/formatCurrency';

type SortKey = 'totalPrice' | 'airlineName' | 'duration' | 'stops' | 'departureAt';
type SortDir = 'asc' | 'desc';

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h ${m}m`;
}

function formatTime(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
}

function SegmentRow({ seg, isLast }: { seg: FlightSegment; isLast: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-xs ${!isLast ? 'pb-1.5 mb-1.5 border-b border-gray-100' : ''}`}>
      <span className="text-gray-500 w-14 flex-shrink-0 font-mono">{seg.flightNumber}</span>
      <span className="text-gray-400 w-24 flex-shrink-0 truncate" title={seg.airlineName}>{seg.airlineName}</span>
      <span className="font-medium w-8 flex-shrink-0">{seg.origin}</span>
      <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
      <span className="font-medium w-8 flex-shrink-0">{seg.destination}</span>
      <span className="text-gray-600 w-12 flex-shrink-0">{formatTime(seg.departureAt)}</span>
      <span className="text-gray-300 flex-shrink-0">-</span>
      <span className="text-gray-600 w-12 flex-shrink-0">{formatTime(seg.arrivalAt)}</span>
      <span className="text-gray-400 flex-shrink-0">{formatDuration(seg.duration)}</span>
    </div>
  );
}

function LegBlock({ label, segments, totalDuration, stops }: {
  label?: string;
  segments: FlightSegment[];
  totalDuration: string;
  stops: number;
}) {
  return (
    <div>
      {label && <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>}
      {segments.map((seg, i) => (
        <SegmentRow key={i} seg={seg} isLast={i === segments.length - 1} />
      ))}
      <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
        <span>Total: {formatDuration(totalDuration)}</span>
        <span>{stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}</span>
      </div>
    </div>
  );
}

interface FlightResultsTableProps {
  results: FlightSearchResult[];
  passengers: number;
}

export function FlightResultsTable({ results, passengers }: FlightResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalPrice');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const addItem = useTripStore((s) => s.addItem);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...results].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'totalPrice': cmp = a.totalPrice - b.totalPrice; break;
      case 'airlineName': cmp = a.airlineName.localeCompare(b.airlineName); break;
      case 'duration': cmp = parseDuration(a.duration) - parseDuration(b.duration); break;
      case 'stops': cmp = a.stops - b.stops; break;
      case 'departureAt': cmp = a.departureAt.localeCompare(b.departureAt); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const addFlight = (result: FlightSearchResult, columnId: string) => {
    addItem(columnId, {
      type: 'flight',
      origin: result.origin,
      destination: result.destination,
      departureDate: result.departureAt.split('T')[0],
      departureTime: result.departureAt,
      arrivalTime: result.arrivalAt,
      airlineName: result.airlineName,
      airlineCode: result.airlineCode,
      flightNumber: result.flightNumber,
      duration: result.duration,
      stops: result.stops,
      stopCodes: result.stopCodes,
      pricePerPerson: result.pricePerPerson,
      passengers,
      cabin: result.cabin,
      totalCost: result.totalPrice,
      currency: result.currency,
      ...(result.returnDepartureAt && {
        returnDate: result.returnDepartureAt.split('T')[0],
        returnDepartureTime: result.returnDepartureAt,
        returnArrivalTime: result.returnArrivalAt,
        returnDuration: result.returnDuration,
        returnStops: result.returnStops,
        returnFlightNumber: result.returnFlightNumber,
        returnStopCodes: result.returnStopCodes,
      }),
    });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const thClass = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none";

  return (
    <div className="overflow-auto flex-1">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itinerary</th>
            <th className={thClass} onClick={() => handleSort('departureAt')}>
              <span className="flex items-center gap-1">Date <SortIcon col="departureAt" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('stops')}>
              <span className="flex items-center gap-1">Stops <SortIcon col="stops" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('duration')}>
              <span className="flex items-center gap-1">Duration <SortIcon col="duration" /></span>
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Per Person</th>
            <th className={`${thClass} text-right`} onClick={() => handleSort('totalPrice')}>
              <span className="flex items-center justify-end gap-1">Total <SortIcon col="totalPrice" /></span>
            </th>
            <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Add</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-blue-50/30 align-top">
              <td className="px-3 py-2.5">
                {r.segments && r.segments.length > 0 ? (
                  <div className="space-y-2">
                    <LegBlock
                      label={r.returnSegments ? 'Outbound' : undefined}
                      segments={r.segments}
                      totalDuration={r.duration}
                      stops={r.stops}
                    />
                    {r.returnSegments && r.returnSegments.length > 0 && (
                      <LegBlock
                        label="Return"
                        segments={r.returnSegments}
                        totalDuration={r.returnDuration || ''}
                        stops={r.returnStops ?? 0}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    <div>{r.airlineName} {r.flightNumber}</div>
                    <div className="text-xs text-gray-500">
                      {r.origin} → {r.stopCodes.length > 0 ? r.stopCodes.join(' → ') + ' → ' : ''}{r.destination}
                    </div>
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                <div>{formatDate(r.departureAt)}</div>
                {r.returnDepartureAt && (
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(r.returnDepartureAt)}</div>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm text-center whitespace-nowrap">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                  r.stops === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.stops === 0 ? 'Direct' : r.stops}
                </span>
                {r.returnStops !== undefined && (
                  <div className="mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                      r.returnStops === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.returnStops === 0 ? 'Direct' : r.returnStops}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                <div>{formatDuration(r.duration)}</div>
                {r.returnDuration && (
                  <div className="text-xs text-gray-400 mt-0.5">{formatDuration(r.returnDuration)}</div>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm text-right whitespace-nowrap text-gray-600">
                {formatCurrency(r.pricePerPerson)}
              </td>
              <td className="px-3 py-2.5 text-sm text-right whitespace-nowrap font-semibold text-blue-700">
                {formatCurrency(r.totalPrice)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {columnOrder.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {columnOrder.map((colId) => (
                      <button
                        key={colId}
                        onClick={() => addFlight(r, colId)}
                        className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        {columns[colId]?.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">No destinations</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
