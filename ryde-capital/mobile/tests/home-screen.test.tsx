import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';
import * as AuthStore from '../src/store/auth';
import * as ApiService from '../src/services/api';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
      fitToCoordinates: jest.fn(),
    }));
    return <View testID="mock-map-view" {...props} />;
  });
  const MockMarker = (props: any) => <View testID="mock-marker" {...props} />;
  const MockPolyline = (props: any) => <View testID="mock-polyline" {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 12.9716, longitude: 77.5946, heading: 90, speed: 10, accuracy: 10 },
    timestamp: Date.now(),
  })),
  watchPositionAsync: jest.fn(async (_opts, _callback: any) => {
    return { remove: jest.fn() };
  }),
  startLocationUpdatesAsync: jest.fn(async () => {}),
  stopLocationUpdatesAsync: jest.fn(async () => {}),
  Accuracy: { Balanced: 3, High: 4 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
}));

jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(() => true),
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
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

describe('Ryde Capital - Driver Live Map Home Screen (Phase 3)', () => {
  const mockDriverProfile = {
    id: 'usr-1',
    role: 'driver',
    driver: {
      id: 'drv-1',
      driver_code: 'DRV-1001',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'offline',
      rating_avg: 4.9,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(AuthStore, 'useAuth').mockReturnValue({
      session: { access_token: 'test-token' } as any,
      user: { id: 'usr-1' } as any,
      driverProfile: mockDriverProfile as any,
      isLoading: false,
      sendOtp: jest.fn() as any,
      verifyOtp: jest.fn() as any,
      signOut: jest.fn() as any,
      refreshProfile: jest.fn() as any,
    });

    jest.spyOn(ApiService, 'apiClient').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/assignments') {
        return { data: { activeOffer: null, history: [] } } as any;
      }
      if (endpoint === '/drivers/me/location') {
        return { data: { accepted: 1, dropped: 0 } } as any;
      }
      if (endpoint === '/drivers/me/availability') {
        return { data: { availabilityStatus: 'online', isAvailable: true } } as any;
      }
      return {} as any;
    });
  });

  it('renders map container, driver marker, status banner, and GO ONLINE toggle', async () => {
    await act(async () => {
      render(<HomeScreen />);
    });

    // Assert container and map
    expect(screen.getByTestId('home-screen-container')).toBeTruthy();
    expect(screen.getByTestId('mock-map-view')).toBeTruthy();

    // Assert status banner displays offline by default
    expect(screen.getByTestId('status-banner')).toBeTruthy();
    expect(screen.getByText('You are offline')).toBeTruthy();

    // Assert driver code and rating displayed
    expect(screen.getByText('DRV-1001')).toBeTruthy();
    expect(screen.getByText('⭐ 4.9')).toBeTruthy();

    // Assert Go Online toggle button
    expect(screen.getByText('GO ONLINE')).toBeTruthy();

    // Assert recenter button
    expect(screen.getByTestId('recenter-button')).toBeTruthy();
  });

  it('toggles availability from offline to online when toggle button is pressed', async () => {
    await act(async () => {
      render(<HomeScreen />);
    });

    const toggleBtn = screen.getByTestId('availability-toggle-button');
    expect(screen.getByText('GO ONLINE')).toBeTruthy();

    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(ApiService.apiClient).toHaveBeenCalledWith(
      '/drivers/me/availability',
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });
});
