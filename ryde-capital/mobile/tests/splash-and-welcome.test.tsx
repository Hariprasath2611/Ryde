import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import { BackHandler, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoRouter from 'expo-router';
import * as Location from 'expo-location';
import SplashScreenComponent from '../app/index';
import WelcomeScreen, { HAS_SEEN_WELCOME_KEY } from '../app/(auth)/welcome';
import { useAppStore } from '../src/store/useAppStore';
import { mockDriverProfile, mockActiveTrip } from '../src/services/api/mock/data';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(() => []),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}), { virtual: true });

describe('Ryde Capital — Splash/Loading & Welcome Landing Slides', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(ExpoRouter.useRouter).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    } as any);
    useAppStore.setState({
      token: null,
      driver: {
        ...mockDriverProfile,
        id: 'driver-1',
        fullName: 'Arun Kumar',
      },
      activeTrip: null,
    });
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    cleanup();
    jest.clearAllTimers();
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  describe('WelcomeScreen (3-Slide Landing Carousel)', () => {
    it('renders Slide 1 copy, chips, and Next button', async () => {
      await act(async () => {
        render(<WelcomeScreen />);
      });

      expect(screen.getByTestId('slide-title-slide-1')).toBeTruthy();
      expect(screen.getByText('Your vehicle.\nOur driver.')).toBeTruthy();
      expect(
        screen.getByText(
          'Get booked by owners who need a trusted professional to drive their own bike, auto or car.',
        ),
      ).toBeTruthy();
      expect(screen.getByText('Your vehicle')).toBeTruthy();
      expect(screen.getByText('Our driver')).toBeTruthy();
      expect(screen.getByText('Bike · Auto · Car')).toBeTruthy();
      expect(screen.getByTestId('welcome-next-button')).toBeTruthy();
      expect(screen.getByText('Next →')).toBeTruthy();
    });

    it('advances between slides on Next press and changes button to "Get started" on slide 3', async () => {
      await act(async () => {
        render(<WelcomeScreen />);
      });

      const nextButton = screen.getByTestId('welcome-next-button');

      // Slide 1 -> Slide 2
      await act(async () => {
        fireEvent.press(nextButton);
      });
      expect(screen.getByText('Next →')).toBeTruthy();

      // Slide 2 -> Slide 3
      await act(async () => {
        fireEvent.press(nextButton);
      });
      expect(screen.getByText('Get started')).toBeTruthy();

      // Slide 3 -> Complete and navigate to Login
      await act(async () => {
        fireEvent.press(nextButton);
      });

      const hasSeen = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
      expect(hasSeen).toBe('true');
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/language');
    });

    it('saves hasSeenWelcome and navigates to language selection when Skip is pressed', async () => {
      await act(async () => {
        render(<WelcomeScreen />);
      });

      const skipButton = screen.getByTestId('welcome-skip-button');
      await act(async () => {
        fireEvent.press(skipButton);
      });

      const hasSeen = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
      expect(hasSeen).toBe('true');
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/language');
    });

    it('switches slides when step dots are tapped', async () => {
      await act(async () => {
        render(<WelcomeScreen />);
      });

      // Tap dot 2 (index 1)
      const dot2 = screen.getByTestId('step-dot-1');
      await act(async () => {
        fireEvent.press(dot2);
      });

      expect(screen.getByTestId('slide-title-slide-2')).toBeTruthy();
    });

    it('handles Android hardware back press: exits app on slide 1, goes back on slide 2', async () => {
      const exitSpy = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});

      let backPressHandler: (() => boolean) | null = null;
      const addListenerSpy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        backPressHandler = handler as () => boolean;
        return { remove: jest.fn() };
      });

      await act(async () => {
        render(<WelcomeScreen />);
      });

      // On Slide 1: BackHandler exits app
      expect(backPressHandler).not.toBeNull();
      await act(async () => {
        backPressHandler!();
      });
      expect(exitSpy).toHaveBeenCalled();

      // Navigate to Slide 2
      const nextButton = screen.getByTestId('welcome-next-button');
      await act(async () => {
        fireEvent.press(nextButton);
      });

      // On Slide 2: BackHandler decrements slide instead of exiting
      exitSpy.mockClear();
      await act(async () => {
        backPressHandler!();
      });
      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
      addListenerSpy.mockRestore();
    });

    it('respects reduce motion accessibility setting', async () => {
      const reduceMotionSpy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

      await act(async () => {
        render(<WelcomeScreen />);
      });

      expect(screen.getByTestId('slide-title-slide-1')).toBeTruthy();
      reduceMotionSpy.mockRestore();
    });
  });

  describe('SplashScreenComponent (Real Boot Sequence & Routing Guard)', () => {
    it('completes boot steps and routes to /(auth)/welcome on first launch', async () => {
      await AsyncStorage.removeItem(HAS_SEEN_WELCOME_KEY);

      await act(async () => {
        render(<SplashScreenComponent />);
      });

      // Initial progress track and icon
      expect(screen.getByTestId('splash-app-icon')).toBeTruthy();
      expect(screen.getByTestId('splash-progress-track')).toBeTruthy();
      expect(screen.getByText('Getting things ready…')).toBeTruthy();

      // Wait for boot sequence completion
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
    });

    it('routes to /(auth)/welcome (landing page) when no active session exists', async () => {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      useAppStore.setState({ token: null, activeTrip: null });

      await act(async () => {
        render(<SplashScreenComponent />);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
    });

    it('routes to active trip when driver has an ongoing trip state', async () => {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      useAppStore.setState({
        token: 'valid-driver-token',
        activeTrip: {
          ...mockActiveTrip,
          id: 'trip-boot-1',
          state: 'heading_to_pickup',
        },
      });

      await act(async () => {
        render(<SplashScreenComponent />);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      expect(mockReplace).toHaveBeenCalledWith('/trip/trip-boot-1/to-pickup');
    });

    it('routes approved drivers with no active trip to /(tabs)/home', async () => {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      useAppStore.setState({
        token: 'valid-approved-token',
        activeTrip: null,
        driver: {
          ...mockDriverProfile,
          id: 'driver-approved-1',
          fullName: 'Arun Kumar',
          status: 'approved',
        },
      });

      await act(async () => {
        render(<SplashScreenComponent />);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });
});
