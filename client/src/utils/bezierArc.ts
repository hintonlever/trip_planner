import type { LatLngTuple } from 'leaflet';

/**
 * Generate points along a quadratic bezier curve between two lat/lng points.
 * The control point is offset perpendicular to the midpoint for a curved arc effect.
 */
export function computeBezierArc(
  start: LatLngTuple,
  end: LatLngTuple,
  numPoints = 50,
  curvature = 0.3,
): LatLngTuple[] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Offset perpendicular to the line, scaled by curvature
  const ctrlLat = midLat + -dLng * curvature;
  const ctrlLng = midLng + dLat * curvature;

  const points: LatLngTuple[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const u = 1 - t;
    const lat = u * u * lat1 + 2 * u * t * ctrlLat + t * t * lat2;
    const lng = u * u * lng1 + 2 * u * t * ctrlLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}
