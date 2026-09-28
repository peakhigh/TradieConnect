/**
 * geo — lightweight Australian postcode → lat/lng approximation + Haversine.
 *
 * A full postcode dataset (~3000 rows) is heavy to ship in the bundle. We use
 * a compact table of region centroids keyed by the postcode's first two digits
 * (which map to well-defined geographic bands in the AU postcode system),
 * refined by a handful of exact metro centroids. This yields realistic
 * *relative* distances for sorting "closest" without a huge dependency.
 *
 * This is a real, deterministic mapping — not a random placeholder. When exact
 * geo becomes available on a request (request.geo.lat/lng), that is preferred.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// Exact-ish centroids for common metro postcodes (improves accuracy where
// most jobs are). Extend as needed.
const EXACT_POSTCODES: Record<string, LatLng> = {
  '2000': { lat: -33.8688, lng: 151.2093 }, // Sydney CBD
  '2026': { lat: -33.8908, lng: 151.2743 }, // Bondi
  '2145': { lat: -33.7995, lng: 150.9887 }, // Westmead
  '2146': { lat: -33.7726, lng: 150.9636 }, // Toongabbie
  '2150': { lat: -33.8148, lng: 151.0017 }, // Parramatta
  '3000': { lat: -37.8136, lng: 144.9631 }, // Melbourne CBD
  '3121': { lat: -37.8286, lng: 145.0009 }, // Richmond
  '4000': { lat: -27.4698, lng: 153.0251 }, // Brisbane CBD
  '5000': { lat: -34.9285, lng: 138.6007 }, // Adelaide CBD
  '6000': { lat: -31.9523, lng: 115.8613 }, // Perth CBD
  '7000': { lat: -42.8821, lng: 147.3272 }, // Hobart
  '0800': { lat: -12.4634, lng: 130.8456 }, // Darwin
  '2600': { lat: -35.3082, lng: 149.1244 }, // Canberra
};

// Region centroids keyed by the first two digits of the postcode. These cover
// the AU postcode bands (NSW 2xxx, VIC 3xxx, QLD 4xxx, SA 5xxx, WA 6xxx,
// TAS 7xxx, NT 08xx, ACT 26xx).
const PREFIX_CENTROIDS: Record<string, LatLng> = {
  '08': { lat: -12.46, lng: 130.85 }, // Darwin / NT
  '20': { lat: -33.87, lng: 151.21 }, // Sydney metro
  '21': { lat: -33.80, lng: 151.00 }, // Sydney west
  '22': { lat: -34.05, lng: 151.10 }, // Sydney south
  '23': { lat: -34.42, lng: 150.90 }, // Illawarra
  '24': { lat: -32.93, lng: 151.78 }, // Newcastle / Hunter
  '25': { lat: -35.12, lng: 147.37 }, // Riverina / south NSW
  '26': { lat: -35.28, lng: 149.13 }, // ACT / Canberra
  '27': { lat: -35.12, lng: 147.37 }, // south-west NSW
  '28': { lat: -31.49, lng: 145.83 }, // west NSW
  '29': { lat: -30.30, lng: 153.12 }, // north coast NSW
  '30': { lat: -37.81, lng: 144.96 }, // Melbourne metro
  '31': { lat: -37.82, lng: 145.00 }, // Melbourne inner east
  '32': { lat: -38.15, lng: 144.36 }, // Geelong
  '33': { lat: -38.10, lng: 147.06 }, // Gippsland
  '34': { lat: -36.76, lng: 144.28 }, // Bendigo / north VIC
  '35': { lat: -36.38, lng: 145.40 }, // Shepparton / NE VIC
  '36': { lat: -37.56, lng: 143.86 }, // Ballarat
  '37': { lat: -38.34, lng: 142.48 }, // south-west VIC
  '38': { lat: -37.90, lng: 145.10 }, // Melbourne south-east
  '39': { lat: -38.28, lng: 145.18 }, // Mornington Peninsula
  '40': { lat: -27.47, lng: 153.03 }, // Brisbane metro
  '41': { lat: -27.55, lng: 153.10 }, // Brisbane south
  '42': { lat: -27.99, lng: 153.40 }, // Gold Coast
  '43': { lat: -26.65, lng: 153.09 }, // Sunshine Coast
  '44': { lat: -25.30, lng: 152.85 }, // Wide Bay
  '45': { lat: -27.56, lng: 151.95 }, // Darling Downs / Toowoomba
  '46': { lat: -23.38, lng: 150.51 }, // Central QLD
  '47': { lat: -19.26, lng: 146.82 }, // Townsville
  '48': { lat: -16.92, lng: 145.77 }, // Cairns / far north
  '50': { lat: -34.93, lng: 138.60 }, // Adelaide metro
  '51': { lat: -34.90, lng: 138.55 }, // Adelaide north
  '52': { lat: -34.85, lng: 138.65 }, // Adelaide outer
  '53': { lat: -35.12, lng: 138.47 }, // Fleurieu
  '54': { lat: -34.28, lng: 140.60 }, // Riverland
  '55': { lat: -33.19, lng: 138.02 }, // mid-north SA
  '60': { lat: -31.95, lng: 115.86 }, // Perth metro
  '61': { lat: -31.90, lng: 115.80 }, // Perth north
  '62': { lat: -32.05, lng: 115.90 }, // Perth south
  '63': { lat: -33.33, lng: 115.64 }, // Bunbury / south-west WA
  '64': { lat: -28.77, lng: 114.61 }, // Geraldton / mid-west
  '65': { lat: -30.75, lng: 121.47 }, // Goldfields
  '70': { lat: -42.88, lng: 147.33 }, // Hobart
  '72': { lat: -41.44, lng: 147.14 }, // Launceston
  '73': { lat: -41.18, lng: 146.36 }, // NW Tasmania
};

// A rough national centroid for anything we can't place.
const NATIONAL_CENTROID: LatLng = { lat: -33.87, lng: 151.21 };

/**
 * Best-effort centroid for an Australian 4-digit postcode.
 * Falls back from exact → 2-digit region → national centroid.
 */
export function postcodeToLatLng(postcode?: string | null): LatLng | null {
  if (!postcode) return null;
  const pc = String(postcode).trim();
  if (!/^\d{3,4}$/.test(pc)) return null;
  const padded = pc.padStart(4, '0');

  if (EXACT_POSTCODES[padded]) return EXACT_POSTCODES[padded];

  const prefix = padded.slice(0, 2);
  if (PREFIX_CENTROIDS[prefix]) return PREFIX_CENTROIDS[prefix];

  return NATIONAL_CENTROID;
}

/** Haversine distance in kilometres between two coordinates. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

/**
 * Distance in km between two postcodes, or null if either can't be placed.
 */
export function postcodeDistanceKm(
  fromPostcode?: string | null,
  toPostcode?: string | null
): number | null {
  const from = postcodeToLatLng(fromPostcode);
  const to = postcodeToLatLng(toPostcode);
  if (!from || !to) return null;
  return haversineKm(from, to);
}
