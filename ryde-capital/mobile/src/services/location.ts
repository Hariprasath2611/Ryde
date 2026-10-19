// ryde-capital/mobile/src/services/location.ts
// Background and foreground location streaming service with adaptive intervals and offline queue

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiClient } from './api';

export const LOCATION_TASK_NAME = 'RYDE_CAPITAL_LOCATION_TASK';

export interface LocationBreadcrumb {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  recordedAt: string;
}

// In-memory queue for offline buffering up to 20 points
let offlineQueue: LocationBreadcrumb[] = [];
let isTrackingActive = false;
let currentTrackingMode: 'idle' | 'trip' = 'idle';

export function getOfflineQueue(): LocationBreadcrumb[] {
  return [...offlineQueue];
}

export function clearOfflineQueue(): void {
  offlineQueue = [];
}

/**
 * Enqueues a location breadcrumb into the offline buffer (capped at 20 points).
 */
export function enqueueOfflineLocation(point: LocationBreadcrumb): void {
  if (offlineQueue.length >= 20) {
    offlineQueue.shift(); // Evict oldest to respect 20-point limit
  }
  offlineQueue.push(point);
}

/**
 * Attempts to flush the offline queue as a batch update.
 */
export async function flushOfflineQueue(): Promise<boolean> {
  if (offlineQueue.length === 0) return true;

  try {
    const pointsToSend = [...offlineQueue];
    await apiClient('/drivers/me/location/batch', {
      method: 'POST',
      body: JSON.stringify({ locations: pointsToSend }),
    });
    // Successfully flushed
    offlineQueue = [];
    return true;
  } catch (err) {
    console.warn('Failed to flush offline location queue:', err);
    return false;
  }
}

/**
 * Transmits a location point to the backend, buffering offline if request fails.
 */
export async function sendLocationUpdate(point: LocationBreadcrumb): Promise<void> {
  // If there are pending points, try flushing them first
  if (offlineQueue.length > 0) {
    const flushed = await flushOfflineQueue();
    if (!flushed) {
      enqueueOfflineLocation(point);
      return;
    }
  }

  try {
    await apiClient('/drivers/me/location', {
      method: 'POST',
      body: JSON.stringify(point),
    });
  } catch (_err) {
    // Network failed or offline: buffer point
    enqueueOfflineLocation(point);
  }
}

interface TaskManagerLocationData {
  locations?: Array<{
    coords: {
      latitude: number;
      longitude: number;
      heading: number | null;
      speed: number | null;
      accuracy: number | null;
    };
    timestamp: number;
  }>;
}

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(
    LOCATION_TASK_NAME,
    async ({ data, error }: TaskManager.TaskManagerTaskBody<TaskManagerLocationData>) => {
      if (error) {
        console.error('Location background task error:', error);
        return;
      }
      if (data && data.locations && data.locations.length > 0) {
        for (const loc of data.locations) {
          const point: LocationBreadcrumb = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed ? Math.max(0, loc.coords.speed * 3.6) : null, // Convert m/s to km/h
            accuracy: loc.coords.accuracy,
            recordedAt: new Date(loc.timestamp).toISOString(),
          };
          await sendLocationUpdate(point);
        }
      }
    },
  );
}

/**
 * Requests foreground and background permissions in two-step rationale flow.
 */
export async function requestLocationPermissions(): Promise<{
  foregroundGranted: boolean;
  backgroundGranted: boolean;
}> {
  // 1. Foreground permission
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    return { foregroundGranted: false, backgroundGranted: false };
  }

  // 2. Background permission
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    return {
      foregroundGranted: true,
      backgroundGranted: bg.status === Location.PermissionStatus.GRANTED,
    };
  } catch (_e) {
    return { foregroundGranted: true, backgroundGranted: false };
  }
}

/**
 * Starts background location tracking with adaptive intervals.
 */
export async function startLocationTracking(mode: 'idle' | 'trip' = 'idle'): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    currentTrackingMode = mode;
    const isTrip = mode === 'trip';

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: isTrip ? 5000 : 25000, // 5s on trip, 25s idle online
      distanceInterval: isTrip ? 5 : 20, // 5m on trip, 20m idle
      foregroundService: {
        notificationTitle: 'Ryde Capital Active',
        notificationBody: isTrip
          ? 'Navigating active customer trip'
          : 'Streaming location to find rides near you',
        notificationColor: '#3B82F6',
      },
      showsBackgroundLocationIndicator: true,
    });

    isTrackingActive = true;
    return true;
  } catch (err) {
    console.error('Failed to start location updates:', err);
    isTrackingActive = false;
    return false;
  }
}

/**
 * Stops background location updates.
 */
export async function stopLocationTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (_e) {
    // Ignore error
  } finally {
    isTrackingActive = false;
  }
}

export function isTracking(): boolean {
  return isTrackingActive;
}

export function getTrackingMode(): 'idle' | 'trip' {
  return currentTrackingMode;
}
