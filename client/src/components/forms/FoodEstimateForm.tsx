import { useState, useMemo } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { cityFoodCosts, getFoodCost } from '../../data/foodCosts';
import type { FoodTier } from '../../types';

export function FoodEstimateForm() {
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [tier, setTier] = useState<FoodTier>('mid-range');
  const [days, setDays] = useState('1');
  const [people, setPeople] = useState('1');
  const [override, setOverride] = useState(false);
  const [customCost, setCustomCost] = useState('');
  const [columnId, setColumnId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const addItem = useTripStore((s) => s.addItem);

  const filteredCities = useMemo(() => {
    if (!cityQuery) return cityFoodCosts;
    const q = cityQuery.toLowerCase();
    return cityFoodCosts.filter((c) => c.cityName.toLowerCase().includes(q));
  }, [cityQuery]);

  const dailyCost = override
    ? parseFloat(customCost) || 0
    : getFoodCost(selectedCity, tier) ?? 0;

  const handleSelectCity = (name: string) => {
    setSelectedCity(name);
    setCityQuery(name);
    setShowDropdown(false);
    setOverride(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numDays = parseInt(days);
    const numPeople = parseInt(people);
    const targetCol = columnId || columnOrder[0];

    if (!selectedCity || !dailyCost || !numDays || !numPeople || !targetCol) return;

    addItem(targetCol, {
      type: 'food',
      cityName: selectedCity,
      tier,
      dailyCost,
      isOverridden: override,
      numberOfDays: numDays,
      numberOfPeople: numPeople,
      totalCost: dailyCost * numDays * numPeople,
      currency: 'USD',
    });

    setCityQuery('');
    setSelectedCity('');
    setDays('1');
    setOverride(false);
    setCustomCost('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
        <input
          value={cityQuery}
          onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(''); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search cities..."
          required
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        {showDropdown && filteredCities.length > 0 && (
          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
            {filteredCities.map((c) => (
              <button
                key={c.cityName}
                type="button"
                onClick={() => handleSelectCity(c.cityName)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-amber-50 flex justify-between"
              >
                <span>{c.cityName}</span>
                <span className="text-xs text-gray-400">${c.midRange}/day</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCity && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Budget tier</label>
            <div className="flex gap-1">
              {(['budget', 'mid-range', 'luxury'] as FoodTier[]).map((t) => {
                const cost = getFoodCost(selectedCity, t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTier(t); setOverride(false); }}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                      tier === t && !override
                        ? 'bg-amber-100 border-amber-400 text-amber-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div>{t}</div>
                    <div className="font-bold">${cost}/day</div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="rounded"
            />
            Custom daily amount
          </label>

          {override && (
            <div>
              <input
                type="number"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder="$ per person/day"
                min="0"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="1"
                required
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">People</label>
              <input
                type="number"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                min="1"
                required
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {dailyCost > 0 && (
            <p className="text-xs text-gray-500 text-right">
              Total: <span className="font-bold text-amber-700">${dailyCost * parseInt(days || '0') * parseInt(people || '0')}</span>
            </p>
          )}
        </>
      )}

      {columnOrder.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Add to</label>
          <select
            value={columnId || columnOrder[0]}
            onChange={(e) => setColumnId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {columnOrder.map((id) => (
              <option key={id} value={id}>{columns[id]?.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={columnOrder.length === 0 || !selectedCity}
        className="w-full bg-amber-600 text-white py-2 rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <UtensilsCrossed className="w-4 h-4" />
        Add Food Estimate
      </button>
      {columnOrder.length === 0 && (
        <p className="text-xs text-gray-400 text-center">Create a destination column first</p>
      )}
    </form>
  );
}
