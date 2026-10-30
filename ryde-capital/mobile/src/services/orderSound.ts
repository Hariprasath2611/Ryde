// ryde-capital/mobile/src/services/orderSound.ts
// Audio & Haptic alert service for incoming ride orders

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Static sound asset generated for driver alerts
const ORDER_ALERT_SOUND = require('../../assets/sounds/incoming_order.wav');

class OrderSoundService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private webAudioInterval: any = null;
  private hapticInterval: any = null;
  private audioContext: any = null;

  /**
   * Start looping the attention-grabbing alert sound & haptic vibration
   * for an incoming booking / ride offer.
   */
  async startOrderAlert(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // 1. Trigger immediate haptic pulse
    this.triggerHaptic();

    // Setup periodic haptic pulse every 1.5 seconds while alert is active
    if (!this.hapticInterval && Platform.OS !== 'web') {
      this.hapticInterval = setInterval(() => {
        if (!this.isPlaying) return;
        this.triggerHaptic();
      }, 1500);
    }

    // 2. Play Audio depending on Platform
    if (Platform.OS === 'web') {
      this.playWebAlert();
    } else {
      await this.playNativeAlert();
    }
  }

  /**
   * Stop the alert sound and clean up all playing audio/intervals
   */
  async stopOrderAlert(): Promise<void> {
    this.isPlaying = false;

    // Clear intervals
    if (this.hapticInterval) {
      clearInterval(this.hapticInterval);
      this.hapticInterval = null;
    }

    if (this.webAudioInterval) {
      clearInterval(this.webAudioInterval);
      this.webAudioInterval = null;
    }

    // Stop Native Sound
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (_e) {
        // Ignore unloading errors
      } finally {
        this.sound = null;
      }
    }

    // Suspend Web Audio Context if open
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      try {
        if (this.audioContext.state === 'running') {
          this.audioContext.suspend?.().catch(() => {});
        }
      } catch (_e) {}
    }
  }

  /**
   * Native audio playback via expo-av with background/silent mode support
   */
  private async playNativeAlert(): Promise<void> {
    try {
      // Configure audio session so alert sounds play even in silent mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        ORDER_ALERT_SOUND,
        {
          isLooping: true,
          volume: 1.0,
          shouldPlay: true,
        },
      );

      this.sound = sound;
      if (!this.isPlaying) {
        // Stop if stopOrderAlert was called during async initialization
        await sound.stopAsync();
        await sound.unloadAsync();
        this.sound = null;
      }
    } catch (err) {
      console.warn('[OrderSound] Native audio playback warning:', err);
    }
  }

  /**
   * Web Audio API synthesized alert chime (Ascending 3-tone chime: 784Hz -> 1046Hz -> 1318Hz)
   * Guaranteed zero latency and no CORS/network issues in browser environments.
   */
  private playWebAlert(): void {
    try {
      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const playChimeSequence = () => {
        if (!this.isPlaying || !this.audioContext) return;
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const tones = [
          { freq: 784, time: now, dur: 0.14 },
          { freq: 1046.5, time: now + 0.16, dur: 0.18 },
          { freq: 1318.5, time: now + 0.38, dur: 0.28 },
        ];

        tones.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          // Envelope: rapid attack & gentle decay
          gain.gain.setValueAtTime(0.001, time);
          gain.gain.exponentialRampToValueAtTime(0.35, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + dur);
        });
      };

      // Play first sequence immediately
      playChimeSequence();

      // Repeat chime every 1.5 seconds while waiting for driver action
      this.webAudioInterval = setInterval(() => {
        if (!this.isPlaying) return;
        playChimeSequence();
      }, 1500);
    } catch (err) {
      console.warn('[OrderSound] Web Audio alert warning:', err);
    }
  }

  private triggerHaptic(): void {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (_e) {
      // Ignore haptics errors in simulator/web/jest
    }
  }
}

export const orderSoundService = new OrderSoundService();

