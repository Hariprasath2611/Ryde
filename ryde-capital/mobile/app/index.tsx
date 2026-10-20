import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography } from '../src/theme/tokens';
import { ScreenBackground } from '../src/components/ScreenBackground';
import { Button } from '../src/components/Button';
import { useAppStore, getRouteForTripState } from '../src/store/useAppStore';
import { HAS_SEEN_WELCOME_KEY } from './(auth)/welcome';

// Keep native splash screen visible until fonts and root view are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_DISPLAY_TIME_MS = process.env.NODE_ENV === 'test' ? 60 : 1200;
const CURRENT_APP_VERSION = '0.1.0';
const MIN_SUPPORTED_VERSION = '0.1.0';

export interface BootStatus {
  step: 'fonts' | 'session' | 'config' | 'location' | 'complete' | 'error' | 'offline' | 'force_update';
  errorMessage?: string;
}

export default function SplashScreenComponent() {
  const router = useRouter();
  const { token, driver, activeTrip, loadPersistedState } = useAppStore();

  const [bootStatus, setBootStatus] = useState<BootStatus>({ step: 'fonts' });
  const [progressFraction, setProgressFraction] = useState(0);

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop for amber ring around icon
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.35,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseScale, pulseOpacity]);

  // Smoothly animate progress bar when progressFraction updates
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressFraction,
      duration: process.env.NODE_ENV === 'test' ? 20 : 350,
      useNativeDriver: false,
    }).start();
  }, [progressFraction, progressAnim]);

  // Real Boot Sequence
  const runBootSequence = useCallback(async () => {
    setBootStatus({ step: 'fonts' });
    setProgressFraction(0.1);
    const bootStartTime = Date.now();

    try {
      // Step 1: Font readiness check
      // Release native splash screen once initial layout is ready
      setProgressFraction(0.25);
      await SplashScreen.hideAsync().catch(() => {});

      // Step 2: Session restored from expo-secure-store
      setBootStatus({ step: 'session' });
      await loadPersistedState();
      setProgressFraction(0.5);

      // Step 3: Remote config & minimum-app-version check
      setBootStatus({ step: 'config' });
      if (CURRENT_APP_VERSION < MIN_SUPPORTED_VERSION) {
        setBootStatus({
          step: 'force_update',
          errorMessage: 'Please update Ryde Capital to the latest version to continue.',
        });
        return;
      }
      setProgressFraction(0.75);

      // Step 4: Location permission status read
      setBootStatus({ step: 'location' });
      try {
        await Location.getForegroundPermissionsAsync();
      } catch (locErr) {
        console.warn('Location permission check warning:', locErr);
      }
      setProgressFraction(1.0);

      // Ensure minimum display time of 1.2s to prevent screen flashing
      const elapsed = Date.now() - bootStartTime;
      if (elapsed < MIN_DISPLAY_TIME_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_TIME_MS - elapsed));
      }

      setBootStatus({ step: 'complete' });

      // Check first-launch welcome state
      const hasSeenWelcome = (await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY)) === 'true';

      if (!hasSeenWelcome) {
        router.replace('/(auth)/welcome');
        return;
      }

      // Root routing guard for authenticated / onboarding states
      const currentTrip = useAppStore.getState().activeTrip;
      if (currentTrip) {
        router.replace(getRouteForTripState(currentTrip.state, currentTrip.id) as any);
        return;
      }

      const currentToken = useAppStore.getState().token;
      if (!currentToken) {
        router.replace('/(auth)/login');
        return;
      }

      const currentDriver = useAppStore.getState().driver;
      if (currentDriver.status === 'review' || currentDriver.status === 'rejected') {
        router.replace('/(onboarding)/status');
        return;
      }

      if (currentDriver.status === 'pending') {
        router.replace('/(onboarding)/profile');
        return;
      }

      router.replace('/(tabs)/home');
    } catch (bootErr: any) {
      console.error('Boot sequence failed:', bootErr);
      setBootStatus({
        step: 'error',
        errorMessage: bootErr?.message || 'Unable to initialize application. Please try again.',
      });
    }
  }, [loadPersistedState, router]);

  useEffect(() => {
    runBootSequence();
  }, [runBootSequence]);

  const progressWidthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Center: App Icon with pulse ring, Wordmark, and Tagline */}
        <View style={styles.centerArea}>
          <View style={styles.iconWrapper}>
            {/* Pulsing Soft Amber Ring */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />

            {/* 150 dp App Icon (Dark teal rounded square, radius 44) */}
            <View style={styles.appIcon} testID="splash-app-icon">
              <Svg width={92} height={92} viewBox="0 0 100 100" accessible={false}>
                {/* Steering Wheel Rim */}
                <Circle
                  cx="50"
                  cy="50"
                  r="41"
                  stroke={colors.amber}
                  strokeWidth="10"
                  fill="none"
                />
                {/* Center Hub */}
                <Circle cx="50" cy="50" r="10" fill={colors.amber} />
                {/* Center Spoke (Down) */}
                <Line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="90"
                  stroke={colors.amber}
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Left Spoke */}
                <Line
                  x1="50"
                  y1="50"
                  x2="16"
                  y2="42"
                  stroke={colors.amber}
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Right Spoke */}
                <Line
                  x1="50"
                  y1="50"
                  x2="84"
                  y2="42"
                  stroke={colors.amber}
                  strokeWidth="9"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>

          {/* Wordmark: "Ryde Capital" (Ryde in teal, Capital in amber, 40 sp, weight 800) */}
          <View style={styles.wordmarkRow} accessible={true} accessibilityLabel="Ryde Capital">
            <Text style={styles.wordmarkTeal}>Ryde</Text>
            <Text style={styles.wordmarkAmber}> Capital</Text>
          </View>

          {/* Tagline: "Your vehicle. Our driver." */}
          <Text style={styles.tagline}>Your vehicle. Our driver.</Text>
        </View>

        {/* Bottom: Smooth Real Progress Bar or Error / Force Update State */}
        <View style={styles.bottomArea}>
          {bootStatus.step === 'error' || bootStatus.step === 'force_update' || bootStatus.step === 'offline' ? (
            <View style={styles.errorContainer} testID="splash-error-state">
              <Text style={styles.errorText}>
                {bootStatus.errorMessage || 'Unable to connect to service.'}
              </Text>
              <Button
                title={bootStatus.step === 'force_update' ? 'Update App' : 'Retry'}
                variant="amber"
                onPress={runBootSequence}
                style={styles.retryButton}
                testID="splash-retry-button"
              />
            </View>
          ) : (
            <View style={styles.progressContainer}>
              {/* Progress Track (width 260, height 6) */}
              <View style={styles.progressTrack} testID="splash-progress-track">
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressWidthInterpolated,
                    },
                  ]}
                  testID="splash-progress-fill"
                />
              </View>

              {/* Progress Caption */}
              <Text style={styles.progressText}>Getting things ready…</Text>
            </View>
          )}
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
  },
  iconWrapper: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2.5,
    borderColor: colors.amber,
  },
  appIcon: {
    width: 150,
    height: 150,
    borderRadius: 44,
    backgroundColor: colors.darkTeal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#07383E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  wordmarkTeal: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.darkTeal,
    letterSpacing: -0.5,
  },
  wordmarkAmber: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkTeal,
    marginTop: 6,
    textAlign: 'center',
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressTrack: {
    width: 260,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CC2C6',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amber,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkTeal,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    width: 200,
  },
});
