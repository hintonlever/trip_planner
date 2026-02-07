import { useState } from 'react';
import { Plane, Building2, UtensilsCrossed, Ticket, ChevronDown } from 'lucide-react';
import { FlightSearchForm } from '../forms/FlightSearchForm';
import { HotelForm } from '../forms/HotelForm';
import { FoodEstimateForm } from '../forms/FoodEstimateForm';
import { OtherCostForm } from '../forms/OtherCostForm';

type Section = 'flights' | 'hotels' | 'food' | 'other';

const sections: { key: Section; label: string; icon: typeof Plane; color: string }[] = [
  { key: 'flights', label: 'Flights', icon: Plane, color: 'text-blue-600' },
  { key: 'hotels', label: 'Hotels', icon: Building2, color: 'text-emerald-600' },
  { key: 'food', label: 'Food', icon: UtensilsCrossed, color: 'text-amber-600' },
  { key: 'other', label: 'Other Costs', icon: Ticket, color: 'text-violet-600' },
];

export function Sidebar() {
  const [open, setOpen] = useState<Section>('flights');

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-2">
        {sections.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === key ? key : key)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === key ? 'rotate-180' : ''}`} />
            </button>
            {open === key && (
              <div className="px-3 pb-3 border-t border-gray-100">
                <div className="pt-3">
                  {key === 'flights' && <FlightSearchForm />}
                  {key === 'hotels' && <HotelForm />}
                  {key === 'food' && <FoodEstimateForm />}
                  {key === 'other' && <OtherCostForm />}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
