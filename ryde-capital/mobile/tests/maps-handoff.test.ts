import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Linking, Platform } from 'react-native';
import {
  buildMapUrls,
  getTravelModeForVehicle,
  openRouteInGoogleMaps,
} from '../src/services/maps-handoff';

describe('Maps Handoff Service (Task 4b)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildMapUrls', () => {
    it('generates universal URL without origin and with driving mode for four_wheeler', () => {
      const urls = buildMapUrls({ latitude: 12.9716, longitude: 77.5946 }, 'four_wheeler');

      expect(urls.universalUrl).toContain('destination=12.9716%2C77.5946');
      expect(urls.universalUrl).toContain('travelmode=driving');
      expect(urls.universalUrl).toContain('dir_action=navigate');
      // Origin should NOT be specified
      expect(urls.universalUrl).not.toContain('origin=');
    });

    it('generates two-wheeler mode for two_wheeler', () => {
      const mode = getTravelModeForVehicle('two_wheeler');
      expect(mode.universalMode).toBe('two-wheeler');
      expect(mode.androidMode).toBe('2');

      const urls = buildMapUrls({ latitude: 12.9300, longitude: 77.6200 }, 'two_wheeler');
      expect(urls.universalUrl).toContain('travelmode=two-wheeler');
    });

    it('generates driving mode for three_wheeler', () => {
      const mode = getTravelModeForVehicle('three_wheeler');
      expect(mode.universalMode).toBe('driving');
      expect(mode.androidMode).toBe('d');
    });
  });

  describe('openRouteInGoogleMaps security and flow guards', () => {
    it('blocks navigation handoff if trip is not active and accepted', async () => {
      const analyticsSpy = jest.fn();
      const res = await openRouteInGoogleMaps({
        destination: { latitude: 12.9716, longitude: 77.5946 },
        tripId: 'trip-unaccepted',
        leg: 'pickup',
        isTripActiveAndAccepted: false, // Blocked!
        onAnalyticsEvent: analyticsSpy,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('only permitted for active, accepted trips');
      expect(analyticsSpy).not.toHaveBeenCalled();
    });

    it('logs only privacy-safe analytics without coordinates', async () => {
      Platform.OS = 'android';
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true as never);
      jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

      const analyticsSpy = jest.fn();
      const res = await openRouteInGoogleMaps({
        destination: { latitude: 12.9716, longitude: 77.5946 },
        tripId: 'trip-active-123',
        leg: 'pickup',
        isTripActiveAndAccepted: true,
        onAnalyticsEvent: analyticsSpy,
      });

      expect(res.success).toBe(true);
      expect(analyticsSpy).toHaveBeenCalledWith('maps_handoff_opened', {
        tripId: 'trip-active-123',
        leg: 'pickup',
      });
      // Coordinates should NEVER be in analytics payload
      const loggedParams = analyticsSpy.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(loggedParams['latitude']).toBeUndefined();
      expect(loggedParams['longitude']).toBeUndefined();
    });

    it('tries native intent on Android first, falling back to universal link', async () => {
      Platform.OS = 'android';

      // Native fails, universal succeeds
      jest.spyOn(Linking, 'canOpenURL').mockImplementation(async (url: string) => {
        if (url.startsWith('google.navigation:')) return false as never;
        if (url.startsWith('https://www.google.com/maps')) return true as never;
        return false as never;
      });

      const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

      const res = await openRouteInGoogleMaps({
        destination: { latitude: 12.9716, longitude: 77.5946 },
        tripId: 'trip-123',
        leg: 'drop',
        isTripActiveAndAccepted: true,
      });

      expect(res.success).toBe(true);
      expect(res.fallbackUsed).toBe(true);
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('https://www.google.com/maps'));
    });

    it('checks comgooglemaps:// on iOS first, falling back to universal link', async () => {
      Platform.OS = 'ios';

      jest.spyOn(Linking, 'canOpenURL').mockImplementation(async (url: string) => {
        if (url.startsWith('comgooglemaps://')) return true as never;
        return true as never;
      });

      const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

      const res = await openRouteInGoogleMaps({
        destination: { latitude: 12.9716, longitude: 77.5946 },
        tripId: 'trip-ios',
        leg: 'drop',
        isTripActiveAndAccepted: true,
      });

      expect(res.success).toBe(true);
      expect(res.fallbackUsed).toBe(false);
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('comgooglemaps://'));
    });
  });
});
