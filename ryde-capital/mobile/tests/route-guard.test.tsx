import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, act, cleanup } from '@testing-library/react-native';
import RootLayout from '../app/_layout';
import * as AuthStore from '../src/store/auth';
import * as ExpoRouter from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
  Stack: Object.assign(({ children }: { children?: React.ReactNode }) => <>{children}</>, {
    Screen: () => null,
  }),
}));

describe('RootLayout AuthGuard & Onboarding Protection', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoRouter.useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
  });

  it('redirects unauthenticated users to /(auth)/login', async () => {
    (ExpoRouter.useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: null,
      user: null,
      driverProfile: null,
      isLoading: false,
      sendOtp: jest.fn<(phone: string) => Promise<{ success: boolean; error?: string }>>(),
      verifyOtp:
        jest.fn<(phone: string, token: string) => Promise<{ success: boolean; error?: string }>>(),
      signOut: jest.fn<() => Promise<void>>(),
      refreshProfile: jest.fn<() => Promise<void>>(),
    });

    await act(async () => {
      render(<RootLayout />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('redirects unapproved drivers attempting to access main tabs to /(onboarding)', async () => {
    (ExpoRouter.useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: {
        access_token: 'valid-driver-token',
      } as unknown as AuthStore.AuthContextType['session'],
      user: { id: 'driver-1' } as unknown as AuthStore.AuthContextType['user'],
      driverProfile: {
        id: 'driver-1',
        role: 'driver',
        driver: {
          id: 'drv-row-1',
          driver_code: 'DRV-1001',
          verification_status: 'pending',
          onboarding_status: 'in_progress',
          availability_status: 'offline',
        },
      },
      isLoading: false,
      sendOtp: jest.fn<(phone: string) => Promise<{ success: boolean; error?: string }>>(),
      verifyOtp:
        jest.fn<(phone: string, token: string) => Promise<{ success: boolean; error?: string }>>(),
      signOut: jest.fn<() => Promise<void>>(),
      refreshProfile: jest.fn<() => Promise<void>>(),
    });

    await act(async () => {
      render(<RootLayout />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(onboarding)');
  });

  it('redirects approved drivers visiting onboarding or auth to /(tabs)', async () => {
    (ExpoRouter.useSegments as jest.Mock).mockReturnValue(['(onboarding)']);

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: {
        access_token: 'valid-driver-token',
      } as unknown as AuthStore.AuthContextType['session'],
      user: { id: 'driver-1' } as unknown as AuthStore.AuthContextType['user'],
      driverProfile: {
        id: 'driver-1',
        role: 'driver',
        driver: {
          id: 'drv-row-1',
          driver_code: 'DRV-1001',
          verification_status: 'approved',
          onboarding_status: 'approved',
          availability_status: 'offline',
        },
      },
      isLoading: false,
      sendOtp: jest.fn<(phone: string) => Promise<{ success: boolean; error?: string }>>(),
      verifyOtp:
        jest.fn<(phone: string, token: string) => Promise<{ success: boolean; error?: string }>>(),
      signOut: jest.fn<() => Promise<void>>(),
      refreshProfile: jest.fn<() => Promise<void>>(),
    });

    await act(async () => {
      render(<RootLayout />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
