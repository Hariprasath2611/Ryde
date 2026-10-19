import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  enqueueOfflineLocation,
  getOfflineQueue,
  clearOfflineQueue,
  flushOfflineQueue,
  sendLocationUpdate,
} from '../src/services/location';
import * as ApiService from '../src/services/api';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  startLocationUpdatesAsync: jest.fn(async () => {}),
  stopLocationUpdatesAsync: jest.fn(async () => {}),
  Accuracy: { Balanced: 3 },
  PermissionStatus: { GRANTED: 'granted' },
}));

jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(() => true),
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false),
}));

describe('Location Service - Offline Buffering and Batch Flushing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearOfflineQueue();
  });

  it('enqueues location points into the offline queue', () => {
    enqueueOfflineLocation({
      latitude: 12.9716,
      longitude: 77.5946,
      recordedAt: new Date().toISOString(),
    });

    const queue = getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.latitude).toBe(12.9716);
  });

  it('caps the offline queue at 20 points and evicts oldest', () => {
    for (let i = 0; i < 25; i++) {
      enqueueOfflineLocation({
        latitude: 12.0 + i * 0.01,
        longitude: 77.0 + i * 0.01,
        recordedAt: new Date().toISOString(),
      });
    }

    const queue = getOfflineQueue();
    expect(queue).toHaveLength(20);
    // Oldest 5 (i = 0..4) should have been shifted out; first item should be i = 5
    expect(queue[0]?.latitude).toBeCloseTo(12.05, 2);
  });

  it('flushes offline queue via batch endpoint', async () => {
    enqueueOfflineLocation({
      latitude: 12.9716,
      longitude: 77.5946,
      recordedAt: new Date().toISOString(),
    });
    enqueueOfflineLocation({
      latitude: 12.9720,
      longitude: 77.5950,
      recordedAt: new Date().toISOString(),
    });

    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({ data: { accepted: 2 } });

    const success = await flushOfflineQueue();
    expect(success).toBe(true);
    expect(ApiService.apiClient).toHaveBeenCalledWith(
      '/drivers/me/location/batch',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(getOfflineQueue()).toHaveLength(0);
  });

  it('automatically buffers location in offline queue when network request fails', async () => {
    jest.spyOn(ApiService, 'apiClient').mockRejectedValue(new Error('Network request failed'));

    await sendLocationUpdate({
      latitude: 12.9716,
      longitude: 77.5946,
      recordedAt: new Date().toISOString(),
    });

    expect(getOfflineQueue()).toHaveLength(1);
  });
});
