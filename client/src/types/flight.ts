export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  nonStop?: boolean;
  currency?: string;
  returnDate?: string;
}

export interface FlightSearchResult {
  id: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  stops: number;
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  cabin: string;
  returnDepartureAt?: string;
  returnArrivalAt?: string;
  returnDuration?: string;
  returnStops?: number;
  returnFlightNumber?: string;
  returnOrigin?: string;
  returnDestination?: string;
}
