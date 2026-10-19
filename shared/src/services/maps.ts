// shared/src/services/maps.ts
// Google Directions and Distance Matrix wrapper with caching, timeouts, retries, and haversine fallback

import { CircuitBreaker } from '../lib/circuitBreaker.js';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface DistanceMatrixResult {
  distanceMeters: number;
  durationSeconds: number;
}

export interface DirectionsResult {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface IMapsService {
  getDistanceAndDuration(origin: LatLng, destination: LatLng): Promise<DistanceMatrixResult>;
  getDirections(origin: LatLng, destination: LatLng): Promise<DirectionsResult>;
  reverseGeocode(location: LatLng): Promise<{ formattedAddress: string }>;
}

/**
 * Encodes an array of LatLng coordinates into a Google Maps Polyline string.
 */
export function encodePolyline(points: LatLng[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    for (let val of [dLat, dLng]) {
      val = val < 0 ? ~(val << 1) : val << 1;
      while (val >= 0x20) {
        encoded += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
        val >>= 5;
      }
      encoded += String.fromCharCode(val + 63);
    }
  }

  return encoded;
}

/**
 * Calculates Great Circle distance between two points using Haversine formula in meters.
 */
export function haversineDistance(origin: LatLng, destination: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
  const lat1 = (origin.latitude * Math.PI) / 180;
  const lat2 = (destination.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Fallback distance and duration estimation when Google Maps API is unavailable or fails.
 * Applies a 1.25x road winding factor and assumes an average urban speed of 30 km/h (8.33 m/s).
 */
export function haversineFallback(origin: LatLng, destination: LatLng): DistanceMatrixResult {
  const straightLineDistance = haversineDistance(origin, destination);
  // Estimate road driving distance as 1.25x straight-line
  const distanceMeters = Math.max(100, Math.round(straightLineDistance * 1.25));
  // 30 km/h = 8.33 m/s, minimum duration 60 seconds
  const durationSeconds = Math.max(60, Math.round(distanceMeters / 8.33));

  return {
    distanceMeters,
    durationSeconds,
  };
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Thread-safe in-memory LRU Cache with TTL expiration.
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxCapacity: number;
  private readonly ttlMs: number;

  constructor(maxCapacity = 1000, ttlMs = 15 * 60 * 1000) {
    this.maxCapacity = maxCapacity;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      // Evict oldest (first item in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export interface GoogleMapsServiceOptions {
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  maxCacheCapacity?: number;
}

export class GoogleMapsService implements IMapsService {
  private apiKey: string;
  private timeoutMs: number;
  private maxRetries: number;
  private distanceCache: LRUCache<DistanceMatrixResult>;
  private directionsCache: LRUCache<DirectionsResult>;
  public readonly circuitBreaker: CircuitBreaker;

  constructor(options: GoogleMapsServiceOptions = {}) {
    this.apiKey =
      options.apiKey ||
      process.env['GOOGLE_MAPS_SERVER_API_KEY'] ||
      process.env['GOOGLE_MAPS_API_KEY'] ||
      '';
    this.timeoutMs = options.timeoutMs ?? 4000;
    this.maxRetries = options.maxRetries ?? 2;
    this.distanceCache = new LRUCache<DistanceMatrixResult>(
      options.maxCacheCapacity ?? 1000,
      options.cacheTtlMs ?? 15 * 60 * 1000,
    );
    this.directionsCache = new LRUCache<DirectionsResult>(
      options.maxCacheCapacity ?? 1000,
      options.cacheTtlMs ?? 15 * 60 * 1000,
    );
    this.circuitBreaker = new CircuitBreaker({
      name: 'GoogleMapsBreaker',
      failureThreshold: 5,
      resetTimeoutMs: 30000,
    });
  }

  private makeCoordKey(origin: LatLng, destination: LatLng): string {
    const round = (n: number) => n.toFixed(4);
    return `${round(origin.latitude)},${round(origin.longitude)}->${round(destination.latitude)},${round(destination.longitude)}`;
  }

  private async fetchWithRetry(url: string, retriesLeft = this.maxRetries): Promise<Response> {
    return this.circuitBreaker.execute(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok && retriesLeft > 0 && response.status >= 500) {
          await new Promise((r) => setTimeout(r, 200 * (this.maxRetries - retriesLeft + 1)));
          return this.fetchWithRetry(url, retriesLeft - 1);
        }
        return response;
      } catch (err) {
        clearTimeout(timeout);
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, 200 * (this.maxRetries - retriesLeft + 1)));
          return this.fetchWithRetry(url, retriesLeft - 1);
        }
        throw err;
      }
    });
  }

  async getDistanceAndDuration(
    origin: LatLng,
    destination: LatLng,
  ): Promise<DistanceMatrixResult> {
    const cacheKey = this.makeCoordKey(origin, destination);
    const cached = this.distanceCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.apiKey || this.apiKey === 'mock-maps-key' || this.apiKey.startsWith('mock-')) {
      const fallback = haversineFallback(origin, destination);
      this.distanceCache.set(cacheKey, fallback);
      return fallback;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=${this.apiKey}`;
      const response = await this.fetchWithRetry(url);
      const data = (await response.json()) as {
        status: string;
        rows?: Array<{
          elements?: Array<{
            status: string;
            distance?: { value: number };
            duration?: { value: number };
          }>;
        }>;
      };

      if (
        data.status === 'OK' &&
        data.rows?.[0]?.elements?.[0]?.status === 'OK' &&
        data.rows[0].elements[0].distance &&
        data.rows[0].elements[0].duration
      ) {
        const result: DistanceMatrixResult = {
          distanceMeters: data.rows[0].elements[0].distance.value,
          durationSeconds: data.rows[0].elements[0].duration.value,
        };
        this.distanceCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      // Network failure, timeout, or Google 5xx: fall back to Haversine
    }

    const fallback = haversineFallback(origin, destination);
    this.distanceCache.set(cacheKey, fallback);
    return fallback;
  }

  async getDirections(origin: LatLng, destination: LatLng): Promise<DirectionsResult> {
    const cacheKey = this.makeCoordKey(origin, destination);
    const cached = this.directionsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.apiKey || this.apiKey === 'mock-maps-key' || this.apiKey.startsWith('mock-')) {
      const distanceFallback = haversineFallback(origin, destination);
      const fallbackPolyline = encodePolyline([origin, destination]);
      const fallback: DirectionsResult = {
        polyline: fallbackPolyline,
        distanceMeters: distanceFallback.distanceMeters,
        durationSeconds: distanceFallback.durationSeconds,
      };
      this.directionsCache.set(cacheKey, fallback);
      return fallback;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${this.apiKey}`;
      const response = await this.fetchWithRetry(url);
      const data = (await response.json()) as {
        status: string;
        routes?: Array<{
          overview_polyline?: { points: string };
          legs?: Array<{
            distance?: { value: number };
            duration?: { value: number };
          }>;
        }>;
      };

      if (
        data.status === 'OK' &&
        data.routes?.[0] &&
        data.routes[0].overview_polyline?.points
      ) {
        const leg = data.routes[0].legs?.[0];
        const result: DirectionsResult = {
          polyline: data.routes[0].overview_polyline.points,
          distanceMeters: leg?.distance?.value ?? haversineDistance(origin, destination),
          durationSeconds: leg?.duration?.value ?? 600,
        };
        this.directionsCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      // Fallback
    }

    const distanceFallback = haversineFallback(origin, destination);
    const fallbackPolyline = encodePolyline([origin, destination]);
    const fallback: DirectionsResult = {
      polyline: fallbackPolyline,
      distanceMeters: distanceFallback.distanceMeters,
      durationSeconds: distanceFallback.durationSeconds,
    };
    this.directionsCache.set(cacheKey, fallback);
    return fallback;
  }

  async reverseGeocode(location: LatLng): Promise<{ formattedAddress: string }> {
    if (!this.apiKey || this.apiKey === 'mock-maps-key' || this.apiKey.startsWith('mock-')) {
      return {
        formattedAddress: `Location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${this.apiKey}`;
      const response = await this.fetchWithRetry(url);
      const data = (await response.json()) as {
        status: string;
        results?: Array<{ formatted_address: string }>;
      };

      if (data.status === 'OK' && data.results?.[0]?.formatted_address) {
        return { formattedAddress: data.results[0].formatted_address };
      }
    } catch (error) {
      // Fallback
    }

    return {
      formattedAddress: `Location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
    };
  }
}

export const mapsService = new GoogleMapsService();
