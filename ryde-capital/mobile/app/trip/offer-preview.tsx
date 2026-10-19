import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { MapViewWrapper } from '../../src/components/MapViewWrapper';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';
import { createMockOffer } from '../../src/services/api/mock/data';

export default function OfferPreviewScreen() {
  const router = useRouter();
  const { currentOffer, rejectOffer } = useAppStore();

  const offer = currentOffer || createMockOffer(25);

  const getRemainingSeconds = () => {
    const expiresMs = new Date(offer.expiresAt).getTime();
    return Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(getRemainingSeconds());

  useEffect(() => {
    const interval = setInterval(() => {
      const rem = getRemainingSeconds();
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        rejectOffer();
        router.replace('/(tabs)/home');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScreenBackground deco={false} edges={['top', 'left', 'right']}>
      <Header showBack={true} />

      <View style={styles.container}>
        {/* Full-screen map */}
        <MapViewWrapper fullScreen style={styles.mapContainer} />

        {/* Floating Bottom Card */}
        <View style={styles.bottomOverlay}>
          <Card variant="card" style={styles.infoCard}>
            <View style={styles.cardRow}>
              <Text style={styles.distanceText}>
                {`${offer.drop.distanceKm} km · ${offer.drop.durationMinutes} min`}
              </Text>
              <Text style={styles.endsInText}>
                {en.offer.offerEndsIn(remaining)}
              </Text>
            </View>
          </Card>

          <Button
            title={en.offer.backToOffer}
            variant="darkTeal"
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Back to offer"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 12,
  },
  infoCard: {
    borderRadius: shape.cardRadius,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 0,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  endsInText: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  backButton: {
    width: '100%',
  },
});
