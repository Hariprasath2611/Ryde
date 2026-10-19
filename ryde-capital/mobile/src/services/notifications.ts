// ryde-capital/mobile/src/services/notifications.ts
// Phase 5: Mobile Push & In-App Notification Service with Deep Linking

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { apiClient } from './api';

// Configure how foreground notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to obtain push notification permission');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env['EXPO_PUBLIC_PROJECT_ID'] || 'ryde-capital-driver',
    }).catch(() => null);

    const token = tokenData?.data || null;

    if (token) {
      await apiClient('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        }),
      }).catch((err) => {
        console.warn('Failed to register device token with backend:', err);
      });
    }

    return token;
  } catch (error) {
    console.warn('Error during push notification registration:', error);
    return null;
  }
}

export function setupNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (!data) return;

    // Handle deep links from push payload
    if (data['type'] === 'OFFER' && data['assignmentId']) {
      // Deep link to assignment offer on home tab
      router.push('/(tabs)');
    } else if (data['type'] === 'TRIP' && data['tripId']) {
      // Deep link directly to active trip screen
      router.push({ pathname: '/trip', params: { id: String(data['tripId']) } });
    } else if (data['type'] === 'EARNINGS') {
      // Deep link to earnings summary tab
      router.push('/(tabs)/earnings' as any);
    } else if (data['type'] === 'PROFILE') {
      // Deep link to driver profile tab
      router.push('/(tabs)/profile' as any);
    }
  });

  return () => {
    subscription.remove();
  };
}
