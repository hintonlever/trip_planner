export type CostItemType = 'flight' | 'hotel' | 'food';
export type FoodTier = 'budget' | 'mid-range' | 'luxury';

interface CostItemBase {
  id: string;
  type: CostItemType;
  columnId: string;
  totalCost: number;
  currency: string;
}

export interface FlightCostItem extends CostItemBase {
  type: 'flight';
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  airlineName: string;
  airlineCode: string;
  flightNumber: string;
  duration: string;
  stops: number;
  pricePerPerson: number;
  passengers: number;
  cabin: string;
}

export interface HotelCostItem extends CostItemBase {
  type: 'hotel';
  hotelName: string;
  pricePerNight: number;
  numberOfNights: number;
}

export interface FoodCostItem extends CostItemBase {
  type: 'food';
  cityName: string;
  tier: FoodTier;
  dailyCost: number;
  isOverridden: boolean;
  numberOfDays: number;
  numberOfPeople: number;
}

export type CostItem = FlightCostItem | HotelCostItem | FoodCostItem;

export interface DestinationColumn {
  id: string;
  name: string;
  itemIds: string[];
}
