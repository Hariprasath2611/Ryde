import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleAllow = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      await Location.requestBackgroundPermissionsAsync();
    } catch {}
    router.replace('/(tabs)/home');
  };

  const handleNotNow = () => {
    router.back();
  };

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Top Location Icon Badge */}
        <View style={styles.topArea}>
          <View style={styles.badgeCircle}>
            <View style={styles.outerTargetRing}>
              <View style={styles.innerTargetDot} />
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.middleArea}>
          <Text style={styles.title}>{en.locationPermission.title}</Text>
          <Text style={styles.subtitle}>{en.locationPermission.subtitle}</Text>

          {/* Bullet Points Card */}
          <Card variant="card" style={styles.bulletsCard}>
            <Text style={styles.bulletItem}>
              • {en.locationPermission.bullet1}
            </Text>
            <Text style={styles.bulletItem}>
              • {en.locationPermission.bullet2}
            </Text>
            <Text style={styles.bulletItem}>
              • {en.locationPermission.bullet3}
            </Text>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            title={en.locationPermission.allowAllTheTime}
            variant="amber"
            onPress={handleAllow}
            accessibilityLabel="Allow location access all the time"
          />
          <Button
            title={en.locationPermission.notNow}
            variant="text"
            onPress={handleNotNow}
            accessibilityLabel="Not now"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 80,
  },
  badgeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerTargetRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 6,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerTargetDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.darkTeal,
  },
  middleArea: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bulletsCard: {
    width: '100%',
    padding: 24,
    borderRadius: shape.cardRadius,
    gap: 16,
  },
  bulletItem: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
});
