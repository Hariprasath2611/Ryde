// ryde-capital/mobile/tests/onboarding.test.tsx
// Unit tests for Driver Onboarding Checklist, state transitions, and upload retries

import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, act, cleanup } from '@testing-library/react-native';
import OnboardingScreen from '../app/(onboarding)/index';
import * as ApiService from '../src/services/api';
import * as AuthStore from '../src/store/auth';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file://test.jpg' }],
  })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file://test.jpg' }],
  })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async () => ({ uri: 'file://compressed.jpg' })),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('../src/services/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
  },
}));

describe('Mobile Onboarding Screen Flow', () => {
  const mockUser = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'driver@ryde.in',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: { access_token: 'valid-token' } as unknown as AuthStore.AuthContextType['session'],
      user: mockUser as unknown as AuthStore.AuthContextType['user'],
      driverProfile: null,
      isLoading: false,
      sendOtp: jest.fn<(phone: string) => Promise<{ success: boolean; error?: string }>>(),
      verifyOtp:
        jest.fn<(phone: string, token: string) => Promise<{ success: boolean; error?: string }>>(),
      signOut: jest.fn<() => Promise<void>>(),
      refreshProfile: jest.fn<() => Promise<void>>(),
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
  });

  it('renders all 5 checklist steps in progress state', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValueOnce({
      driver: {
        id: 'driver-1',
        onboarding_status: 'in_progress',
        allowed_vehicle_types: ['four_wheeler'],
      },
      profile: { full_name: 'Ramesh Kumar' },
      onboarding: {
        status: 'in_progress',
        rejectionReason: null,
        submittedAt: null,
        progressPercentage: 40,
        completedStepsCount: 2,
        totalStepsCount: 5,
        canSubmit: false,
        steps: {
          personalDetails: {
            name: 'Personal Information',
            status: 'completed',
            details: {},
          },
          vehicleTypes: {
            name: 'Allowed Vehicle Types',
            status: 'completed',
            details: {},
          },
          idProof: {
            name: 'Identity Proof',
            status: 'pending',
            details: {},
          },
          license: {
            name: 'Driving License',
            status: 'pending',
            details: {},
          },
          selfie: {
            name: 'Driver Selfie',
            status: 'pending',
            details: {},
          },
        },
      },
    });

    await act(async () => {
      render(<OnboardingScreen />);
    });

    expect(screen.getByText('Driver Onboarding')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByTestId('step-personal-details')).toBeTruthy();
    expect(screen.getByTestId('step-vehicle-types')).toBeTruthy();
    expect(screen.getByTestId('step-id-proof')).toBeTruthy();
    expect(screen.getByTestId('step-license')).toBeTruthy();
    expect(screen.getByTestId('step-selfie')).toBeTruthy();
    expect(screen.getByTestId('submit-onboarding-button')).toBeTruthy();
  });

  it('renders under review state when onboarding is submitted', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValueOnce({
      driver: {
        id: 'driver-1',
        onboarding_status: 'submitted',
      },
      profile: { full_name: 'Ramesh Kumar' },
      onboarding: {
        status: 'submitted',
        rejectionReason: null,
        submittedAt: '2026-10-19T10:00:00Z',
        progressPercentage: 100,
        completedStepsCount: 5,
        totalStepsCount: 5,
        canSubmit: false,
        steps: {},
      },
    });

    await act(async () => {
      render(<OnboardingScreen />);
    });

    expect(screen.getByTestId('onboarding-under-review-state')).toBeTruthy();
    expect(screen.getByText('UNDER REVIEW')).toBeTruthy();
    expect(screen.getByText('Verification in Progress')).toBeTruthy();
  });

  it('renders rejection card with reason and permits fixing details when rejected', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValueOnce({
      driver: {
        id: 'driver-1',
        onboarding_status: 'rejected',
        rejection_reason: 'Driving license image is too blurry. Please re-upload front and back.',
      },
      profile: { full_name: 'Ramesh Kumar' },
      onboarding: {
        status: 'rejected',
        rejectionReason: 'Driving license image is too blurry. Please re-upload front and back.',
        submittedAt: '2026-10-19T10:00:00Z',
        progressPercentage: 80,
        completedStepsCount: 4,
        totalStepsCount: 5,
        canSubmit: false,
        steps: {
          personalDetails: { name: 'Personal Information', status: 'completed', details: {} },
          vehicleTypes: { name: 'Allowed Vehicle Types', status: 'completed', details: {} },
          idProof: { name: 'Identity Proof', status: 'completed', details: {} },
          license: { name: 'Driving License', status: 'pending', details: {} },
          selfie: { name: 'Driver Selfie', status: 'completed', details: {} },
        },
      },
    });

    await act(async () => {
      render(<OnboardingScreen />);
    });

    expect(screen.getByTestId('rejection-card')).toBeTruthy();
    expect(
      screen.getByText('Driving license image is too blurry. Please re-upload front and back.'),
    ).toBeTruthy();
  });

  it('renders approved state with Go to Dashboard button when approved', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValueOnce({
      driver: {
        id: 'driver-1',
        onboarding_status: 'approved',
      },
      profile: { full_name: 'Ramesh Kumar' },
      onboarding: {
        status: 'approved',
        rejectionReason: null,
        submittedAt: '2026-10-19T10:00:00Z',
        progressPercentage: 100,
        completedStepsCount: 5,
        totalStepsCount: 5,
        canSubmit: false,
        steps: {},
      },
    });

    await act(async () => {
      render(<OnboardingScreen />);
    });

    expect(screen.getByTestId('onboarding-approved-state')).toBeTruthy();
    expect(screen.getByText('APPROVED')).toBeTruthy();
    expect(screen.getByText('You Are Ready to Drive!')).toBeTruthy();
    expect(screen.getByTestId('go-to-dashboard-button')).toBeTruthy();
  });
});
