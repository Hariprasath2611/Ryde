import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { orderSoundService } from '../src/services/orderSound';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

describe('OrderSoundService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await orderSoundService.stopOrderAlert();
  });

  it('starts audio playback and triggers haptic warning on startOrderAlert', async () => {
    await orderSoundService.startOrderAlert();

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning,
    );
  });

  it('stops audio playback cleanly on stopOrderAlert', async () => {
    await orderSoundService.startOrderAlert();
    await orderSoundService.stopOrderAlert();
    // Subsequent stop should be safe and idempotent
    await orderSoundService.stopOrderAlert();
  });
});

