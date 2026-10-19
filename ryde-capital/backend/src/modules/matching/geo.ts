import type { LatLng } from '@ryde/shared';

/**
 * Robustly parses PostGIS location representation (GeoJSON object, WKT string, or LatLng object) into LatLng.
 */
export function parseLocation(loc: unknown): LatLng {
  if (!loc) {
    return { latitude: 0, longitude: 0 };
  }

  // LatLng object
  if (typeof loc === 'object' && loc !== null && 'latitude' in loc && 'longitude' in loc) {
    const lat = Number((loc as { latitude: unknown }).latitude);
    const lng = Number((loc as { longitude: unknown }).longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
  if (
    typeof loc === 'object' &&
    loc !== null &&
    'coordinates' in loc &&
    Array.isArray((loc as { coordinates: unknown }).coordinates)
  ) {
    const coords = (loc as { coordinates: [number, number] }).coordinates;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // WKT string: "POINT(77.5946 12.9716)" (lng lat)
  if (typeof loc === 'string') {
    const match = loc.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
    if (match && match[1] && match[2]) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return { latitude: 0, longitude: 0 };
}
