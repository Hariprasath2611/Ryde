// ryde-capital/mobile/src/services/maps-handoff.ts
// Secure External Google Maps Handoff Service with platform fallbacks and privacy guards

import { Linking, Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OpenRouteInGoogleMapsParams {
  destination: Coordinates;
  vehicleType?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
  tripId: string;
  leg: 'pickup' | 'drop';
  isTripActiveAndAccepted: boolean;
  onAnalyticsEvent?: (eventName: string, params: { tripId: string; leg: 'pickup' | 'drop' }) => void;
}

export interface MapUrls {
  universalUrl: string;
  nativeUrl: string;
}

/**
 * Maps vehicle type to Google Maps navigation mode.
 * In India, two-wheeler mode is supported via travelmode=two-wheeler on universal URLs
 * and mode=2 (or mode=l) on Android Google Navigation intents.
 */
export function getTravelModeForVehicle(vehicleType?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler'): {
  universalMode: string;
  androidMode: string;
  iosMode: string;
} {
  if (vehicleType === 'two_wheeler') {
    return {
      universalMode: 'two-wheeler',
      androidMode: '2', // Android intent code for two-wheeler in India
      iosMode: 'two-wheeler',
    };
  }

  return {
    universalMode: 'driving',
    androidMode: 'd', // Driving
    iosMode: 'driving',
  };
}

/**
 * Builds universal and native map URLs for given destination and vehicle type.
 * Origin is intentionally omitted so Google Maps uses the driver's live GPS location.
 */
export function buildMapUrls(
  destination: Coordinates,
  vehicleType?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler',
): MapUrls {
  const { latitude, longitude } = destination;
  const modes = getTravelModeForVehicle(vehicleType);

  // Universal link (free, works on Web, Android, iOS browser / Google Maps)
  const universalUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}&travelmode=${encodeURIComponent(modes.universalMode)}&dir_action=navigate`;

  // Platform-native intent URLs
  let nativeUrl = universalUrl;
  if (Platform.OS === 'android') {
    nativeUrl = `google.navigation:q=${latitude},${longitude}&mode=${modes.androidMode}`;
  } else if (Platform.OS === 'ios') {
    nativeUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=${modes.iosMode}`;
  }

  return { universalUrl, nativeUrl };
}

/**
 * Safely opens Google Maps navigation for an active trip leg.
 * Enforces strict security & privacy constraints:
 * 1. Blocked if trip is not accepted or inactive.
 * 2. Origin omitted (driver live GPS used).
 * 3. Never sends passenger names or phone numbers to Google.
 * 4. Never logs coordinates in analytics (only tripId and leg).
 */
export async function openRouteInGoogleMaps(
  params: OpenRouteInGoogleMapsParams,
): Promise<{ success: boolean; openedUrl?: string; fallbackUsed: boolean; error?: string }> {
  const { destination, vehicleType, tripId, leg, isTripActiveAndAccepted, onAnalyticsEvent } = params;

  // Security guard: Handoff is strictly prohibited before trip acceptance
  if (!isTripActiveAndAccepted) {
    console.warn(`[MapsHandoff] Blocked navigation handoff for trip ${tripId}: trip is not active or accepted.`);
    return {
      success: false,
      fallbackUsed: false,
      error: 'Navigation handoff is only permitted for active, accepted trips.',
    };
  }

  // Validate destination coordinates
  if (
    typeof destination.latitude !== 'number' ||
    typeof destination.longitude !== 'number' ||
    isNaN(destination.latitude) ||
    isNaN(destination.longitude)
  ) {
    return {
      success: false,
      fallbackUsed: false,
      error: 'Invalid destination coordinates provided from server.',
    };
  }

  const { universalUrl, nativeUrl } = buildMapUrls(destination, vehicleType);

  // Log privacy-safe telemetry (strictly tripId and leg, NEVER coordinates)
  if (onAnalyticsEvent) {
    onAnalyticsEvent('maps_handoff_opened', { tripId, leg });
  } else {
    console.log(`[MapsHandoff] Opened navigation handoff for trip=${tripId}, leg=${leg}`);
  }

  try {
    if (Platform.OS === 'android') {
      // 1. Android: Try native Google Navigation intent first
      const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpenNative) {
        await Linking.openURL(nativeUrl);
        return { success: true, openedUrl: nativeUrl, fallbackUsed: false };
      }

      // 2. Fallback to universal URL
      const canOpenUniversal = await Linking.canOpenURL(universalUrl).catch(() => false);
      if (canOpenUniversal) {
        await Linking.openURL(universalUrl);
        return { success: true, openedUrl: universalUrl, fallbackUsed: true };
      }
    } else if (Platform.OS === 'ios') {
      // 1. iOS: Check if Google Maps app is installed
      const canOpenGoogleMaps = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpenGoogleMaps) {
        await Linking.openURL(nativeUrl);
        return { success: true, openedUrl: nativeUrl, fallbackUsed: false };
      }

      // 2. Fallback to universal URL (which opens Safari or Apple Maps)
      const canOpenUniversal = await Linking.canOpenURL(universalUrl).catch(() => false);
      if (canOpenUniversal) {
        await Linking.openURL(universalUrl);
        return { success: true, openedUrl: universalUrl, fallbackUsed: true };
      }
    } else {
      // Web / other platforms
      await Linking.openURL(universalUrl);
      return { success: true, openedUrl: universalUrl, fallbackUsed: false };
    }
  } catch (err) {
    console.error('[MapsHandoff] Error launching navigation URL:', err);
  }

  // If external apps failed to open, stay in-app
  return {
    success: false,
    fallbackUsed: true,
    error: 'No navigation app or browser could be launched.',
  };
}
