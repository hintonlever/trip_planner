import type { CityFoodCosts, FoodTier } from '../types';

export const cityFoodCosts: CityFoodCosts[] = [
  { cityName: 'New York', countryCode: 'US', budget: 30, midRange: 60, luxury: 150 },
  { cityName: 'Los Angeles', countryCode: 'US', budget: 25, midRange: 55, luxury: 130 },
  { cityName: 'Chicago', countryCode: 'US', budget: 25, midRange: 50, luxury: 120 },
  { cityName: 'London', countryCode: 'GB', budget: 25, midRange: 55, luxury: 140 },
  { cityName: 'Paris', countryCode: 'FR', budget: 25, midRange: 60, luxury: 160 },
  { cityName: 'Tokyo', countryCode: 'JP', budget: 20, midRange: 45, luxury: 120 },
  { cityName: 'Bangkok', countryCode: 'TH', budget: 10, midRange: 25, luxury: 70 },
  { cityName: 'Barcelona', countryCode: 'ES', budget: 20, midRange: 45, luxury: 110 },
  { cityName: 'Rome', countryCode: 'IT', budget: 20, midRange: 50, luxury: 120 },
  { cityName: 'Berlin', countryCode: 'DE', budget: 18, midRange: 40, luxury: 100 },
  { cityName: 'Sydney', countryCode: 'AU', budget: 25, midRange: 55, luxury: 130 },
  { cityName: 'Dubai', countryCode: 'AE', budget: 20, midRange: 50, luxury: 150 },
  { cityName: 'Singapore', countryCode: 'SG', budget: 15, midRange: 35, luxury: 100 },
  { cityName: 'Mexico City', countryCode: 'MX', budget: 10, midRange: 25, luxury: 70 },
  { cityName: 'Istanbul', countryCode: 'TR', budget: 12, midRange: 30, luxury: 80 },
  { cityName: 'Seoul', countryCode: 'KR', budget: 15, midRange: 35, luxury: 90 },
  { cityName: 'Lisbon', countryCode: 'PT', budget: 18, midRange: 40, luxury: 100 },
  { cityName: 'Amsterdam', countryCode: 'NL', budget: 20, midRange: 50, luxury: 120 },
  { cityName: 'Bali', countryCode: 'ID', budget: 8, midRange: 20, luxury: 60 },
  { cityName: 'Prague', countryCode: 'CZ', budget: 15, midRange: 30, luxury: 80 },
  { cityName: 'Buenos Aires', countryCode: 'AR', budget: 10, midRange: 25, luxury: 65 },
  { cityName: 'Marrakech', countryCode: 'MA', budget: 8, midRange: 20, luxury: 60 },
  { cityName: 'Reykjavik', countryCode: 'IS', budget: 30, midRange: 65, luxury: 160 },
  { cityName: 'Hanoi', countryCode: 'VN', budget: 8, midRange: 18, luxury: 50 },
  { cityName: 'Cape Town', countryCode: 'ZA', budget: 12, midRange: 30, luxury: 80 },
];

export function getFoodCost(cityName: string, tier: FoodTier): number | undefined {
  const city = cityFoodCosts.find(
    (c) => c.cityName.toLowerCase() === cityName.toLowerCase()
  );
  if (!city) return undefined;
  if (tier === 'budget') return city.budget;
  if (tier === 'mid-range') return city.midRange;
  return city.luxury;
}
