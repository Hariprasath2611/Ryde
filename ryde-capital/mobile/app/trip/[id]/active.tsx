import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { MapViewWrapper } from '../../../src/components/MapViewWrapper';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { useAppStore } from '../../../src/store/useAppStore';
import { openRouteInGoogleMaps } from '../../../src/services/maps-handoff';
import { mockActiveTrip } from '../../../src/services/api/mock/data';

export default function ActiveTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, updateTripState } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const [elapsedSeconds, setElapsedSeconds] = useState(754); // 12:34

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGoogleMapsHandoff = async () => {
    await openRouteInGoogleMaps({
      destination: {
        latitude: trip.drop.latitude,
        longitude: trip.drop.longitude,
      },
      vehicleType: trip.vehicle.type,
      tripId: trip.id,
      leg: 'drop',
      isTripActiveAndAccepted: true,
    });
  };

  const handleSos = () => {
    router.push(`/trip/${trip.id}/sos` as any);
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: `I'm on a Ryde Capital trip to ${trip.drop.address}. Tracking live: https://rydecapital.in/track/${trip.id}`,
      });
    } catch {}
  };

  const handleReached = async () => {
    await updateTripState('reached');
    router.replace(`/trip/${trip.id}/final-check` as any);
  };

  return (
    <ScreenBackground deco={false} edges={['top', 'left', 'right']}>
      <Header showBack={true} />

      <View style={styles.container}>
        {/* Map View */}
        <MapViewWrapper height={260} style={styles.map} />

        {/* Heading to Card */}
        <Card variant="card" style={styles.headingCard}>
          <Text style={styles.headingLabel}>{en.activeTrip.headingTo}</Text>
          <Text style={styles.destinationTitle}>{trip.drop.address}</Text>
          <Text style={styles.statsSubtitle}>
            {en.activeTrip.remaining(20, '5.6', formatElapsed(elapsedSeconds))}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title={en.activeTrip.navigateInGoogleMaps}
            variant="amber"
            onPress={handleGoogleMapsHandoff}
            style={styles.fullBtn}
            accessibilityLabel="Navigate to drop in Google Maps"
          />

          <View style={styles.middleRow}>
            <Button
              title={en.activeTrip.sos}
              variant="danger"
              onPress={handleSos}
              style={styles.halfBtn}
              accessibilityLabel="Emergency SOS"
            />
            <Button
              title={en.activeTrip.shareTrip}
              variant="outline"
              onPress={handleShareTrip}
              style={styles.halfBtn}
              accessibilityLabel="Share live trip"
            />
          </View>

          <Button
            title={en.activeTrip.iveReached}
            variant="darkTeal"
            onPress={handleReached}
            style={styles.fullBtn}
            accessibilityLabel="I've reached destination"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 8,
  },
  map: {
    borderRadius: shape.cardRadius,
  },
  headingCard: {
    borderRadius: shape.cardRadius,
    padding: 18,
    marginVertical: 10,
  },
  headingLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  destinationTitle: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '800',
    color: colors.darkTeal,
    marginTop: 4,
  },
  statsSubtitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 6,
  },
  actionSection: {
    gap: 12,
  },
  fullBtn: {
    width: '100%',
  },
  middleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
});
