// [highF, lowF, rainMm, snowCm, humidity%]
export type MonthlyClimate = [number, number, number, number, number];

export interface CityClimate {
  city: string;
  aliases?: string[];
  country: string;
  months: MonthlyClimate[]; // 12 entries, index 0 = January
}
