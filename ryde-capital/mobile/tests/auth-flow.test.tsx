import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
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
    jest.restoreAllMocks();
  });

  describe('LoginScreen (Phone Validation & Dispatch)', () => {
    it('shows error when phone number has fewer than 10 digits', async () => {
      const screen = await render(<LoginScreen />);

      const phoneInput = await screen.findByTestId('phone-input');
      const sendButton = await screen.findByTestId('send-otp-button');

      fireEvent.changeText(phoneInput, '98765');
      fireEvent.press(sendButton);

      const errorMessage = await screen.findByTestId('phone-error-message');
      expect(errorMessage).toBeTruthy();
      expect(screen.getByText('Mobile number must be exactly 10 digits')).toBeTruthy();
      expect(mockSendOtp).not.toHaveBeenCalled();
    });

    it('shows error when phone number does not start with 6, 7, 8, or 9', async () => {
      const screen = await render(<LoginScreen />);

      const phoneInput = await screen.findByTestId('phone-input');
      const sendButton = await screen.findByTestId('send-otp-button');

      fireEvent.changeText(phoneInput, '1234567890');
      fireEvent.press(sendButton);

      const errorMessage = await screen.findByTestId('phone-error-message');
      expect(errorMessage).toBeTruthy();
      expect(
        screen.getByText('Indian mobile numbers must start with 6, 7, 8, or 9'),
      ).toBeTruthy();
      expect(mockSendOtp).not.toHaveBeenCalled();
    });

    it('successfully calls sendOtp and navigates to OTP screen for valid 10-digit number', async () => {
      mockSendOtp.mockResolvedValueOnce({ success: true });

      const screen = await render(<LoginScreen />);

      const phoneInput = await screen.findByTestId('phone-input');
      const sendButton = await screen.findByTestId('send-otp-button');

      fireEvent.changeText(phoneInput, '9876543210');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith('+919876543210');
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(auth)/otp',
          params: { phone: '+919876543210' },
        });
      });
    });
  });

  describe('OtpScreen (6-Digit OTP, Validation & Resend Timer)', () => {
    it('shows error when verifying with fewer than 6 digits', async () => {
      const screen = await render(<OtpScreen />);

      const otpInput = await screen.findByTestId('otp-input');
      const verifyButton = await screen.findByTestId('verify-otp-button');

      fireEvent.changeText(otpInput, '1234');
      fireEvent.press(verifyButton);

      const errorMessage = await screen.findByTestId('otp-error-message');
      expect(errorMessage).toBeTruthy();
      expect(
        screen.getByText('Please enter all 6 digits of the verification code'),
      ).toBeTruthy();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('calls verifyOtp and navigates to home on successful 6-digit OTP verification', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ success: true });

      const screen = await render(<OtpScreen />);

      const otpInput = await screen.findByTestId('otp-input');
      const verifyButton = await screen.findByTestId('verify-otp-button');

      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith('+919876543210', '123456');
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('locks out after 3 consecutive failed OTP attempts', async () => {
      mockVerifyOtp.mockResolvedValue({ success: false, error: 'Invalid code' });

      const screen = await render(<OtpScreen />);

      const otpInput = await screen.findByTestId('otp-input');
      const verifyButton = await screen.findByTestId('verify-otp-button');

      // Attempt 1
      fireEvent.changeText(otpInput, '000001');
      fireEvent.press(verifyButton);
      await screen.findByTestId('otp-error-message');

      // Attempt 2
      fireEvent.changeText(otpInput, '000002');
      fireEvent.press(verifyButton);
      await screen.findByTestId('otp-error-message');

      // Attempt 3
      fireEvent.changeText(otpInput, '000003');
      fireEvent.press(verifyButton);

      const lockout = await screen.findByTestId('lockout-message');
      expect(lockout).toBeTruthy();
      expect(
        screen.getByText('Too many failed attempts. Please request a new OTP.'),
      ).toBeTruthy();
    });

    it('displays 30-second countdown resend timer initially', async () => {
      const screen = await render(<OtpScreen />);

      const resendText = await screen.findByText(/Resend OTP in/);
      expect(resendText).toBeTruthy();
    });
  });
});
