import { jest } from '@jest/globals';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy: 5,
      altitude: 0,
      heading: 0,
      speed: 0,
    },
  })),
  startLocationUpdatesAsync: jest.fn(async () => {}),
  stopLocationUpdatesAsync: jest.fn(async () => {}),
  hasStartedLocationUpdatesAsync: jest.fn(async () => false),
  Accuracy: { Balanced: 3, High: 4, Highest: 5 },
  ActivityType: { AutomotiveNavigation: 1 },
}), { virtual: true });

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ta', languageTag: 'ta-IN' }]),
  locale: 'ta-IN',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(async () => {}),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(async () => ({
        sound: {
          playAsync: jest.fn(async () => {}),
          stopAsync: jest.fn(async () => {}),
          unloadAsync: jest.fn(async () => {}),
          setIsLoopingAsync: jest.fn(async () => {}),
          setVolumeAsync: jest.fn(async () => {}),
        },
        status: { isLoaded: true },
      })),
    },
    setAudioModeAsync: jest.fn(async () => {}),
  },
}));

