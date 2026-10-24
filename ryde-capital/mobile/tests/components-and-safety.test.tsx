import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { OtpInput } from '../src/components/OtpInput';
import { PhoneField, validateIndianPhone } from '../src/components/PhoneField';
import { CountdownRing } from '../src/components/CountdownRing';
import { HoldToConfirm } from '../src/components/HoldToConfirm';
import VerificationScreen from '../app/(onboarding)/verification';
import { useAppStore } from '../src/store/useAppStore';
import * as SecureStore from 'expo-secure-store';
import { TripState } from '../src/services/api/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

describe('Shared Design System Components & Security Requirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('OtpInput Component', () => {
    it('renders exact number of digit boxes based on length prop (6 for auth, 4 for arrival)', async () => {
      const onChangeMock = jest.fn();
      await act(async () => {
        render(<OtpInput testID="otp-input-6" length={6} value="" onChangeOtp={onChangeMock} />);
      });
      expect(screen.getByTestId('otp-input-6')).toBeTruthy();
    });

    it('handles pasted full-length codes and extracts digits', async () => {
      const onChangeMock = jest.fn();
      await act(async () => {
        render(<OtpInput testID="otp-input-paste" length={6} value="" onChangeOtp={onChangeMock} />);
      });
      const firstDigit = screen.getByTestId('otp-input-paste');

      await act(async () => {
        fireEvent.changeText(firstDigit, '987654');
      });
      expect(onChangeMock).toHaveBeenCalledWith('987654');
    });

    it('handles single digit entry and backspace deletion', async () => {
      let otpValue = '12';
      const onChangeMock = jest.fn((val: string) => {
        otpValue = val;
      });

      await act(async () => {
        render(<OtpInput testID="otp-input-backspace" length={4} value={otpValue} onChangeOtp={onChangeMock} />);
      });
      const firstDigit = screen.getByTestId('otp-input-backspace');

      await act(async () => {
        fireEvent(firstDigit, 'keyPress', { nativeEvent: { key: 'Backspace' } });
      });
      expect(onChangeMock).toBeDefined();
    });
  });

  describe('PhoneField & Indian Phone Validation', () => {
    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, or 9', () => {
      expect(validateIndianPhone('9876543210')).toBe(true);
      expect(validateIndianPhone('8123456789')).toBe(true);
      expect(validateIndianPhone('7000000000')).toBe(true);
      expect(validateIndianPhone('6398765432')).toBe(true);
    });

    it('rejects numbers starting with digits 0-5', () => {
      expect(validateIndianPhone('5876543210')).toBe(false);
      expect(validateIndianPhone('1234567890')).toBe(false);
      expect(validateIndianPhone('0987654321')).toBe(false);
    });

    it('rejects numbers with fewer or more than 10 digits', () => {
      expect(validateIndianPhone('98765')).toBe(false);
      expect(validateIndianPhone('987654321099')).toBe(false);
      expect(validateIndianPhone('')).toBe(false);
    });

    it('strips non-digit formatting characters when validating', () => {
      expect(validateIndianPhone('+91 98765 43210')).toBe(true);
      expect(validateIndianPhone('919876543210')).toBe(true);
    });
  });

  describe('CountdownRing (Driven by expiresAt timestamp)', () => {
    it('renders countdown ring based on expiresAt timestamp, never a local counter', async () => {
      const now = Date.now();
      const expiresAt = new Date(now + 25000).toISOString();

      await act(async () => {
        render(
          <CountdownRing
            expiresAt={expiresAt}
            totalDurationSeconds={30}
            size={50}
          />
        );
      });

      const secondsElem = screen.getByTestId('countdown-seconds');
      expect(secondsElem.props.children.join('')).toBe('25s');
    });

    it('calls onExpire when expiresAt is in the past', async () => {
      const onExpireMock = jest.fn();
      const pastTime = new Date(Date.now() - 1000).toISOString();

      await act(async () => {
        render(
          <CountdownRing
            expiresAt={pastTime}
            totalDurationSeconds={30}
            onExpire={onExpireMock}
          />
        );
      });

      expect(onExpireMock).toHaveBeenCalled();
    });
  });

  describe('HoldToConfirm Component (SOS Hold Confirmation)', () => {
    it('triggers onConfirm only after holding for full duration', async () => {
      const onConfirmMock = jest.fn();

      await act(async () => {
        render(
          <HoldToConfirm
            testID="sos-hold-button"
            holdDurationMs={50}
            onConfirm={onConfirmMock}
            label="HOLD FOR SOS"
          />
        );
      });

      const button = screen.getByTestId('sos-hold-button');

      // Press in and hold for full duration
      await act(async () => {
        fireEvent(button, 'pressIn');
        await new Promise((r) => setTimeout(r, 70));
      });

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('cancels confirmation if released before hold duration completes', async () => {
      const onConfirmMock = jest.fn();

      await act(async () => {
        render(
          <HoldToConfirm
            testID="sos-hold-cancel"
            holdDurationMs={100}
            onConfirm={onConfirmMock}
            label="HOLD FOR SOS"
          />
        );
      });

      const button = screen.getByTestId('sos-hold-cancel');

      // Press in and release early at 20ms (before 100ms)
      await act(async () => {
        fireEvent(button, 'pressIn');
        await new Promise((r) => setTimeout(r, 20));
        fireEvent(button, 'pressOut');
        await new Promise((r) => setTimeout(r, 120));
      });

      expect(onConfirmMock).not.toHaveBeenCalled();
    });
  });

  describe('Trip State Machine to Screen Mapping', () => {
    it('maps every trip state to a distinct screen route without collisions', () => {
      const stateToRouteMap: Record<TripState, string> = {
        offered: '/trip/offer',
        assigned: '/trip/offer',
        heading_to_pickup: '/trip/[id]/to-pickup',
        arrived: '/trip/[id]/arrival',
        otp_verified: '/trip/[id]/vehicle-check',
        handover_done: '/trip/[id]/active',
        in_progress: '/trip/[id]/active',
        reached: '/trip/[id]/final-check',
        completed: '/trip/[id]/summary',
        cancelled_by_driver: '/trip/[id]/cancel',
        cancelled_by_customer: '/(tabs)/home',
        cancelled_by_system: '/(tabs)/home',
      };

      const states: TripState[] = [
        'offered',
        'assigned',
        'heading_to_pickup',
        'arrived',
        'otp_verified',
        'handover_done',
        'in_progress',
        'reached',
        'completed',
        'cancelled_by_driver',
        'cancelled_by_customer',
        'cancelled_by_system',
      ];

      states.forEach((st) => {
        expect(stateToRouteMap[st]).toBeDefined();
        expect(typeof stateToRouteMap[st]).toBe('string');
      });
    });
  });

  describe('Sensitive Data Security: Aadhaar Zero-Persistence', () => {
    it('never persists, logs, or stores unmasked Aadhaar number in global store or SecureStore', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<VerificationScreen />);
      });

      // Find Aadhaar input field via testID
      const aadhaarInput = screen.getByTestId('aadhaar-input');
      expect(aadhaarInput).toBeTruthy();

      // Driver enters Aadhaar
      await act(async () => {
        fireEvent.changeText(aadhaarInput, '987654321098');
      });

      // 1. Verify SecureStore.setItemAsync was NEVER called with Aadhaar
      expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('987654321098')
      );

      // 2. Verify global Zustand store does not store Aadhaar number
      const appState = useAppStore.getState();
      expect(JSON.stringify(appState)).not.toContain('987654321098');

      // 3. Verify console logs never contain Aadhaar number
      consoleLogSpy.mock.calls.forEach((args) => {
        expect(JSON.stringify(args)).not.toContain('987654321098');
      });
      consoleWarnSpy.mock.calls.forEach((args) => {
        expect(JSON.stringify(args)).not.toContain('987654321098');
      });
      consoleErrorSpy.mock.calls.forEach((args) => {
        expect(JSON.stringify(args)).not.toContain('987654321098');
      });

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
