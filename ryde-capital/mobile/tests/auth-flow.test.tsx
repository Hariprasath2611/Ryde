import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import OtpScreen from '../app/(auth)/otp';
import * as AuthStore from '../src/store/auth';
import * as ExpoRouter from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  useSegments: jest.fn(() => ['(auth)', 'login']),
  Redirect: () => null,
}));

describe('Mobile Auth Flow (Login & OTP Screens)', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockSendOtp = jest.fn();
  const mockVerifyOtp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    });
    (ExpoRouter.useLocalSearchParams as jest.Mock).mockReturnValue({
      phone: '+919876543210',
    });

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: null,
      user: null,
      driverProfile: null,
      isLoading: false,
      sendOtp: mockSendOtp,
      verifyOtp: mockVerifyOtp,
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
  });

  describe('LoginScreen (Phone Validation & Dispatch)', () => {
    it('shows error when phone number has fewer than 10 digits', async () => {
      const screen = await render(<LoginScreen />);
      const phoneInput = screen.getByTestId('phone-input');
      const sendButton = screen.getByTestId('send-otp-button');

      await act(async () => {
        fireEvent.changeText(phoneInput, '98765');
      });

      await act(async () => {
        fireEvent.press(sendButton);
      });

      expect(screen.getByTestId('phone-error-message')).toBeTruthy();
      expect(screen.getByText('Mobile number must be exactly 10 digits')).toBeTruthy();
      expect(mockSendOtp).not.toHaveBeenCalled();
    });

    it('shows error when phone number does not start with 6, 7, 8, or 9', async () => {
      const screen = await render(<LoginScreen />);
      const phoneInput = screen.getByTestId('phone-input');
      const sendButton = screen.getByTestId('send-otp-button');

      await act(async () => {
        fireEvent.changeText(phoneInput, '1234567890');
      });

      await act(async () => {
        fireEvent.press(sendButton);
      });

      expect(screen.getByTestId('phone-error-message')).toBeTruthy();
      expect(
        screen.getByText('Indian mobile numbers must start with 6, 7, 8, or 9'),
      ).toBeTruthy();
      expect(mockSendOtp).not.toHaveBeenCalled();
    });

    it('successfully calls sendOtp and navigates to OTP screen for valid 10-digit number', async () => {
      mockSendOtp.mockResolvedValueOnce({ success: true });

      const screen = await render(<LoginScreen />);
      const phoneInput = screen.getByTestId('phone-input');
      const sendButton = screen.getByTestId('send-otp-button');

      await act(async () => {
        fireEvent.changeText(phoneInput, '9876543210');
      });

      await act(async () => {
        fireEvent.press(sendButton);
      });

      expect(mockSendOtp).toHaveBeenCalledWith('+919876543210');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/otp',
        params: { phone: '+919876543210' },
      });
    });
  });

  describe('OtpScreen (6-Digit OTP, Validation & Resend Timer)', () => {
    it('shows error when verifying with fewer than 6 digits', async () => {
      const screen = await render(<OtpScreen />);
      const otpInput = screen.getByTestId('otp-input');
      const verifyButton = screen.getByTestId('verify-otp-button');

      await act(async () => {
        fireEvent.changeText(otpInput, '1234');
      });

      await act(async () => {
        fireEvent.press(verifyButton);
      });

      expect(screen.getByTestId('otp-error-message')).toBeTruthy();
      expect(
        screen.getByText('Please enter all 6 digits of the verification code'),
      ).toBeTruthy();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('calls verifyOtp and navigates to home on successful 6-digit OTP verification', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ success: true });

      const screen = await render(<OtpScreen />);
      const otpInput = screen.getByTestId('otp-input');
      const verifyButton = screen.getByTestId('verify-otp-button');

      await act(async () => {
        fireEvent.changeText(otpInput, '123456');
      });

      await act(async () => {
        fireEvent.press(verifyButton);
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith('+919876543210', '123456');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('locks out after 3 consecutive failed OTP attempts', async () => {
      mockVerifyOtp.mockResolvedValue({ success: false, error: 'Invalid code' });

      const screen = await render(<OtpScreen />);
      const otpInput = screen.getByTestId('otp-input');
      const verifyButton = screen.getByTestId('verify-otp-button');

      // Attempt 1
      await act(async () => {
        fireEvent.changeText(otpInput, '000001');
      });
      await act(async () => {
        fireEvent.press(verifyButton);
      });

      // Attempt 2
      await act(async () => {
        fireEvent.changeText(otpInput, '000002');
      });
      await act(async () => {
        fireEvent.press(verifyButton);
      });

      // Attempt 3
      await act(async () => {
        fireEvent.changeText(otpInput, '000003');
      });
      await act(async () => {
        fireEvent.press(verifyButton);
      });

      expect(screen.getByTestId('lockout-message')).toBeTruthy();
      expect(
        screen.getByText('Too many failed attempts. Please request a new OTP.'),
      ).toBeTruthy();
    });

    it('displays 30-second countdown resend timer initially', async () => {
      const screen = await render(<OtpScreen />);
      expect(screen.getByText(/Resend OTP in 30s/)).toBeTruthy();
    });
  });
});
