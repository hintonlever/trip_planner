import { useMemo } from 'react';
import { Thermometer, CloudRain, Snowflake, Droplets } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { findCityClimate, getMonthName } from '../../data/climateData';
import type { FlightCostItem } from '../../types';

interface Props {
  columnId: string;
}

export function WeatherInfo({ columnId }: Props) {
  const column = useTripStore((s) => s.columns[columnId]);
  const items = useTripStore((s) => s.items);

  const travelMonth = useMemo(() => {
    if (!column) return null;
    let earliest: string | null = null;
    for (const itemId of column.itemIds) {
      const item = items[itemId];
      if (item?.type === 'flight') {
        const flight = item as FlightCostItem;
        if (flight.departureDate && (!earliest || flight.departureDate < earliest)) {
          earliest = flight.departureDate;
        }
      }
    }
    if (!earliest) return null;
    return parseInt(earliest.split('-')[1], 10); // 1-12
  }, [column, items]);

  const climate = useMemo(() => {
    if (!column?.name || !travelMonth) return null;
    const city = findCityClimate(column.name);
    if (!city) return null;
    const data = city.months[travelMonth - 1];
    if (!data) return null;
    return {
      cityName: city.city,
      country: city.country,
      monthName: getMonthName(travelMonth),
      highF: data[0],
      lowF: data[1],
      rainMm: data[2],
      snowCm: data[3],
      humidity: data[4],
    };
  }, [column?.name, travelMonth]);

  if (!climate) return null;

  return (
    <div className="mx-3 mb-2 px-2.5 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs">
      <p className="font-semibold text-sky-700 mb-1">
        {climate.monthName} Climate
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600">
        <span className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-orange-500" />
          {climate.highF}° / {climate.lowF}°F
        </span>
        <span className="flex items-center gap-1">
          <CloudRain className="w-3 h-3 text-blue-500" />
          {climate.rainMm}mm rain
        </span>
        {climate.snowCm > 0 && (
          <span className="flex items-center gap-1">
            <Snowflake className="w-3 h-3 text-cyan-400" />
            {climate.snowCm}cm snow
          </span>
        )}
        <span className="flex items-center gap-1">
          <Droplets className="w-3 h-3 text-teal-500" />
          {climate.humidity}% humidity
        </span>
      </div>
    </div>
  );
}
