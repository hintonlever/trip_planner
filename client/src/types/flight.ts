export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  nonStop?: boolean;
  currency?: string;
  returnDate?: string;
}

export interface CachedQuery {
  id: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  non_stop: number;
  currency: string;
  created_at: string;
  result_count: number;
}

export interface FlightSegment {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
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
  stopCodes: string[];
  segments: FlightSegment[];
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
  returnStopCodes?: string[];
  returnSegments?: FlightSegment[];
}
