import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GoogleMapsService,
  haversineDistance,
  haversineFallback,
  encodePolyline,
  LRUCache,
} from '../src/services/maps.js';

describe('Maps Service', () => {
  const origin = { latitude: 12.9716, longitude: 77.5946 }; // Bangalore
  const destination = { latitude: 12.2958, longitude: 76.6394 }; // Mysore (~128-140 km)

  describe('haversineDistance and haversineFallback', () => {
    it('calculates great circle distance accurately within expected range', () => {
      const distance = haversineDistance(origin, destination);
      // Straight line Bangalore to Mysore is approx 128 km (125,000 - 135,000 m)
      expect(distance).toBeGreaterThan(120000);
      expect(distance).toBeLessThan(140000);
    });

    it('returns zero for identical coordinates', () => {
      expect(haversineDistance(origin, origin)).toBe(0);
    });

    it('haversineFallback provides realistic road estimate and duration', () => {
      const fallback = haversineFallback(origin, destination);
      expect(fallback.distanceMeters).toBeGreaterThan(120000 * 1.2);
      expect(fallback.durationSeconds).toBeGreaterThan(3600); // More than 1 hour driving
    });
  });

  describe('encodePolyline', () => {
    it('encodes points into standard non-empty polyline string', () => {
      const polyline = encodePolyline([origin, destination]);
      expect(typeof polyline).toBe('string');
      expect(polyline.length).toBeGreaterThan(5);
    });
  });

  describe('LRUCache', () => {
    it('stores and retrieves cached values', () => {
      const cache = new LRUCache<string>(2, 1000);
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');

      expect(cache.get('k1')).toBe('v1');
      expect(cache.get('k2')).toBe('v2');
    });

    it('evicts oldest when capacity is reached', () => {
      const cache = new LRUCache<string>(2, 10000);
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      cache.get('k1'); // Refresh k1 so k2 becomes least recently used
      cache.set('k3', 'v3'); // Should evict k2

      expect(cache.get('k1')).toBe('v1');
      expect(cache.get('k2')).toBeUndefined();
      expect(cache.get('k3')).toBe('v3');
    });

    it('expires items after TTL', async () => {
      const cache = new LRUCache<string>(10, 20); // 20ms TTL
      cache.set('k1', 'v1');
      expect(cache.get('k1')).toBe('v1');

      await new Promise((r) => setTimeout(r, 30));
      expect(cache.get('k1')).toBeUndefined();
    });
  });

  describe('GoogleMapsService fallback mode', () => {
    it('falls back to haversine when API key is missing or mock', async () => {
      const service = new GoogleMapsService({ apiKey: 'mock-key' });
      const result = await service.getDistanceAndDuration(origin, destination);

      expect(result.distanceMeters).toBeGreaterThan(100000);
      expect(result.durationSeconds).toBeGreaterThan(1000);
    });

    it('caches distance and duration results', async () => {
      const service = new GoogleMapsService({ apiKey: 'mock-key' });
      const r1 = await service.getDistanceAndDuration(origin, destination);
      const r2 = await service.getDistanceAndDuration(origin, destination);

      expect(r1).toEqual(r2);
    });

    it('returns polyline in directions fallback', async () => {
      const service = new GoogleMapsService({ apiKey: 'mock-key' });
      const result = await service.getDirections(origin, destination);

      expect(result.polyline).toBeDefined();
      expect(result.polyline.length).toBeGreaterThan(0);
      expect(result.distanceMeters).toBeGreaterThan(100000);
    });

    it('handles reverse geocoding fallback gracefully', async () => {
      const service = new GoogleMapsService({ apiKey: 'mock-key' });
      const result = await service.reverseGeocode(origin);

      expect(result.formattedAddress).toContain('12.9716');
      expect(result.formattedAddress).toContain('77.5946');
    });
  });
});
