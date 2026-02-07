let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'your_client_id_here') {
    throw new Error('Amadeus API credentials not configured. Update .env file.');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  nonStop?: boolean;
  currency?: string;
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
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult[]> {
  const token = await getAccessToken();

  const query = new URLSearchParams({
    originLocationCode: params.origin.toUpperCase(),
    destinationLocationCode: params.destination.toUpperCase(),
    departureDate: params.departureDate,
    adults: String(params.adults),
    currencyCode: params.currency || 'USD',
    max: '20',
  });

  if (params.nonStop) {
    query.set('nonStop', 'true');
  }

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(
      `Amadeus API error: ${response.status} - ${JSON.stringify(err)}`
    );
  }

  const body = await response.json() as {
    data: Array<{
      id: string;
      itineraries: Array<{
        duration: string;
        segments: Array<{
          departure: { iataCode: string; at: string };
          arrival: { iataCode: string; at: string };
          carrierCode: string;
          number: string;
        }>;
      }>;
      price: { total: string; currency: string; grandTotal: string };
      travelerPricings: Array<{
        fareDetailsBySegment: Array<{ cabin: string }>;
      }>;
    }>;
    dictionaries?: { carriers?: Record<string, string> };
  };

  const carriers = body.dictionaries?.carriers || {};

  return body.data.map((offer) => {
    const itinerary = offer.itineraries[0];
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    const cabin = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';

    return {
      id: offer.id,
      airlineCode: firstSegment.carrierCode,
      airlineName: carriers[firstSegment.carrierCode] || firstSegment.carrierCode,
      flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureAt: firstSegment.departure.at,
      arrivalAt: lastSegment.arrival.at,
      duration: itinerary.duration,
      stops: itinerary.segments.length - 1,
      totalPrice: parseFloat(offer.price.grandTotal),
      pricePerPerson: parseFloat(offer.price.grandTotal) / params.adults,
      currency: offer.price.currency,
      cabin,
    };
  });
}
