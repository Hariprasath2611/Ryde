import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/store/auth';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { ForceUpdateModal } from '../src/components/ForceUpdateModal';
import { colors } from '../src/theme/tokens';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, driverProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Public screens accessible without auth redirection
    const currentSegment = (segments[0] as string) || '';
    const isPublicScreen =
      currentSegment === 'terms' ||
      currentSegment === 'privacy' ||
      currentSegment === 'offline' ||
      currentSegment === 'permissions';
    if (isPublicScreen) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup && currentSegment !== '') {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    // Driver is authenticated
    const isApproved =
      driverProfile?.driver?.onboarding_status === 'approved' ||
      driverProfile?.driver?.verification_status === 'approved';

    if (!isApproved) {
      // Unapproved drivers cannot access main tabs or auth screens
      if (inTabsGroup || inAuthGroup) {
        router.replace('/(onboarding)/status');
      }
    } else {
      // Approved drivers navigating to auth or onboarding are routed to dashboard tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)/home');
      }
    }
  }, [session, driverProfile, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.darkTeal} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [isOffline] = useState(false);
  const [forceUpdate] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner isOffline={isOffline} />
        <ForceUpdateModal
          visible={forceUpdate}
          minVersion="1.0.0"
          currentVersion="0.1.0"
        />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="trip" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="payout" options={{ headerShown: false }} />
            <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
            <Stack.Screen name="permissions" options={{ headerShown: false }} />
            <Stack.Screen name="offline" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
