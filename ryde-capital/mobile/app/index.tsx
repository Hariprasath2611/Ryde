import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../src/theme/tokens';
import { ScreenBackground } from '../src/components/ScreenBackground';
import { StepDots } from '../src/components/StepDots';
import { BRAND } from '../src/config/brand';
import { useAppStore, getRouteForTripState } from '../src/store/useAppStore';

export default function SplashScreen() {
  const router = useRouter();
  const { token, driver, activeTrip, loadPersistedState } = useAppStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Settle animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth and route after settle
    const timer = setTimeout(async () => {
      await loadPersistedState();

      if (activeTrip) {
        router.replace(getRouteForTripState(activeTrip.state, activeTrip.id) as any);
        return;
      }

      if (!token) {
        router.replace('/(auth)/welcome');
        return;
      }

      if (driver.status === 'review' || driver.status === 'rejected') {
        router.replace('/(onboarding)/status');
        return;
      }

      if (driver.status === 'pending') {
        router.replace('/(onboarding)/profile');
        return;
      }

      router.replace('/(tabs)/home');
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenBackground deco={true}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.brandCenter,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandTeal}>{BRAND.tealPart}</Text>
            <Text style={styles.brandAmber}> {BRAND.amberPart}</Text>
          </View>
          <Text style={styles.tagline}>{BRAND.tagline}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <StepDots total={3} activeIndex={0} />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTeal: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.darkTeal,
    letterSpacing: -0.5,
  },
  brandAmber: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '700',
    color: colors.darkTeal,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
  },
});
