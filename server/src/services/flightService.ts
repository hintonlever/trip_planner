import { getCachedResults, cacheResults } from './cacheService.js';

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
  stopCodes: string[];
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
}

// FlightAPI.io response types
interface FlightApiPlace {
  id: number;
  iata: string;
  name: string;
}

interface FlightApiCarrier {
  id: number;
  name: string;
  alt_id: string;
}

interface FlightApiSegment {
  id: string;
  origin_place_id: number;
  destination_place_id: number;
  departure: string;
  arrival: string;
  duration: number;
  marketing_flight_number: string;
  marketing_carrier_id: number;
  operating_carrier_id: number;
}

interface FlightApiLeg {
  id: string;
  origin_place_id: number;
  destination_place_id: number;
  departure: string;
  arrival: string;
  segment_ids: string[];
  duration: number;
  stop_count: number;
  marketing_carrier_ids: number[];
  stop_ids: number[][];
}

interface FlightApiItinerary {
  id: string;
  leg_ids: string[];
  pricing_options: Array<{
    price: { amount: number };
    agent_ids: string[];
    items: Array<{
      price: { amount: number };
      fares: Array<{ fare_family: string }>;
    }>;
  }>;
}

interface FlightApiResponse {
  itineraries: FlightApiItinerary[];
  legs: FlightApiLeg[];
  segments: FlightApiSegment[];
  places: FlightApiPlace[];
  carriers: FlightApiCarrier[];
  agents: Array<{ id: string; name: string }>;
}

function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h}H${m}M`;
}

export async function searchFlightsWithCache(params: FlightSearchParams, fresh = false): Promise<FlightSearchResult[]> {
  if (!fresh) {
    const cached = getCachedResults(params);
    if (cached) {
      console.log(`Cache hit for ${params.origin} -> ${params.destination}`);
      return cached;
    }
  }

  const results = await searchFlights(params);
  cacheResults(params, results);
  console.log(`Cached ${results.length} results for ${params.origin} -> ${params.destination}`);
  return results;
}

async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult[]> {
  const apiKey = process.env.FLIGHTAPI_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('FlightAPI key not configured. Update FLIGHTAPI_KEY in .env file.');
  }

  const from = params.origin.toUpperCase();
  const to = params.destination.toUpperCase();
  const currency = params.currency || 'USD';
  const cabin = 'Economy';

  let url: string;
  if (params.returnDate) {
    url = `https://api.flightapi.io/roundtrip/${apiKey}/${from}/${to}/${params.departureDate}/${params.returnDate}/${params.adults}/0/0/${cabin}/${currency}`;
  } else {
    url = `https://api.flightapi.io/onewaytrip/${apiKey}/${from}/${to}/${params.departureDate}/${params.adults}/0/0/${cabin}/${currency}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`FlightAPI error: ${response.status} - ${text}`);
  }

  const body = await response.json() as FlightApiResponse;

  // Build lookup maps from denormalized response
  const placesMap = new Map<number, FlightApiPlace>();
  for (const p of body.places ?? []) {
    placesMap.set(p.id, p);
  }

  const carriersMap = new Map<number, FlightApiCarrier>();
  for (const c of body.carriers ?? []) {
    carriersMap.set(c.id, c);
  }

  const legsMap = new Map<string, FlightApiLeg>();
  for (const l of body.legs ?? []) {
    legsMap.set(l.id, l);
  }

  const segmentsMap = new Map<string, FlightApiSegment>();
  for (const s of body.segments ?? []) {
    segmentsMap.set(s.id, s);
  }

  let itineraries = body.itineraries ?? [];

  // Filter non-stop if requested
  if (params.nonStop) {
    itineraries = itineraries.filter((it) => {
      const outboundLeg = legsMap.get(it.leg_ids[0]);
      return outboundLeg && outboundLeg.stop_count === 0;
    });
  }

  // Limit to 20 results
  itineraries = itineraries.slice(0, 20);

  return itineraries.map((it, index) => {
    const outboundLeg = legsMap.get(it.leg_ids[0])!;
    const firstSegment = segmentsMap.get(outboundLeg.segment_ids[0])!;
    const carrier = carriersMap.get(firstSegment.marketing_carrier_id);
    const originPlace = placesMap.get(outboundLeg.origin_place_id);
    const destPlace = placesMap.get(outboundLeg.destination_place_id);

    const price = it.pricing_options[0]?.price?.amount ?? 0;

    // Resolve stop airport codes from leg stop_ids
    const stopCodes: string[] = [];
    if (outboundLeg.stop_ids) {
      for (const stopIdGroup of outboundLeg.stop_ids) {
        for (const stopId of stopIdGroup) {
          const place = placesMap.get(stopId);
          if (place?.iata) stopCodes.push(place.iata);
        }
      }
    }

    const result: FlightSearchResult = {
      id: it.id || String(index + 1),
      airlineCode: carrier?.alt_id || String(firstSegment.marketing_carrier_id),
      airlineName: carrier?.name || carrier?.alt_id || String(firstSegment.marketing_carrier_id),
      flightNumber: `${carrier?.alt_id || ''} ${firstSegment.marketing_flight_number}`.trim(),
      origin: originPlace?.iata || from,
      destination: destPlace?.iata || to,
      departureAt: outboundLeg.departure,
      arrivalAt: outboundLeg.arrival,
      duration: minutesToIsoDuration(outboundLeg.duration),
      stops: outboundLeg.stop_count,
      stopCodes,
      totalPrice: price,
      pricePerPerson: price / params.adults,
      currency,
      cabin,
    };

    // Return leg for round-trip
    if (it.leg_ids.length > 1) {
      const returnLeg = legsMap.get(it.leg_ids[1]);
      if (returnLeg) {
        const retFirstSegment = segmentsMap.get(returnLeg.segment_ids[0]);
        const retCarrier = retFirstSegment ? carriersMap.get(retFirstSegment.marketing_carrier_id) : undefined;
        const retOrigin = placesMap.get(returnLeg.origin_place_id);
        const retDest = placesMap.get(returnLeg.destination_place_id);

        const retStopCodes: string[] = [];
        if (returnLeg.stop_ids) {
          for (const stopIdGroup of returnLeg.stop_ids) {
            for (const stopId of stopIdGroup) {
              const place = placesMap.get(stopId);
              if (place?.iata) retStopCodes.push(place.iata);
            }
          }
        }

        result.returnOrigin = retOrigin?.iata || to;
        result.returnDestination = retDest?.iata || from;
        result.returnDepartureAt = returnLeg.departure;
        result.returnArrivalAt = returnLeg.arrival;
        result.returnDuration = minutesToIsoDuration(returnLeg.duration);
        result.returnStops = returnLeg.stop_count;
        result.returnFlightNumber = retFirstSegment
          ? `${retCarrier?.alt_id || ''} ${retFirstSegment.marketing_flight_number}`.trim()
          : undefined;
        result.returnStopCodes = retStopCodes;
      }
    }

    return result;
  });
}
