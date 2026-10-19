import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
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

export default function ToPickupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, updateTripState } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const handleCall = () => {
    if (trip.customer.phone) {
      Linking.openURL(`tel:${trip.customer.phone}`).catch(() => {});
    }
  };

  const handleMessage = () => {
    if (trip.customer.phone) {
      Linking.openURL(`sms:${trip.customer.phone}`).catch(() => {});
    }
  };

  const handleGoogleMapsNavigation = async () => {
    await openRouteInGoogleMaps({
      destination: {
        latitude: trip.pickup.latitude,
        longitude: trip.pickup.longitude,
      },
      vehicleType: trip.vehicle.type,
      tripId: trip.id,
      leg: 'pickup',
      isTripActiveAndAccepted: true,
    });
  };

  const handleArrived = async () => {
    await updateTripState('arrived');
    router.replace(`/trip/${trip.id}/arrival` as any);
  };

  const handleCancelTrip = () => {
    router.push(`/trip/${trip.id}/cancel` as any);
  };

  return (
    <ScreenBackground deco={false} edges={['top', 'left', 'right']}>
      <Header showBack={true} />

      <View style={styles.container}>
        {/* Map View */}
        <MapViewWrapper height={260} style={styles.map} />

        {/* Pickup Card */}
        <Card variant="card" style={styles.pickupCard}>
          <Text style={styles.headingLabel}>{en.toPickup.headingToPickup}</Text>
          <Text style={styles.addressLine}>
            {`${trip.pickup.address} · 6 min · ${trip.pickup.distanceKm} km`}
          </Text>

          <View style={styles.customerRow}>
            <Text style={styles.customerName}>
              {`${trip.customer.firstName} · ${trip.customer.rating} ★`}
            </Text>
            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                onPress={handleCall}
                style={styles.pillActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Call customer"
              >
                <Text style={styles.pillActionText}>{en.toPickup.call}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleMessage}
                style={styles.pillActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Message customer"
              >
                <Text style={styles.pillActionText}>{en.toPickup.message}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title={en.toPickup.navigateInGoogleMaps}
            variant="amber"
            onPress={handleGoogleMapsNavigation}
            style={styles.mainBtn}
            accessibilityLabel="Navigate in Google Maps"
          />

          <Button
            title={en.toPickup.iveArrived}
            variant="darkTeal"
            onPress={handleArrived}
            style={styles.mainBtn}
            accessibilityLabel="I've arrived"
          />

          <TouchableOpacity
            onPress={handleCancelTrip}
            style={styles.cancelLink}
            accessibilityRole="button"
            accessibilityLabel="Cancel trip"
          >
            <Text style={styles.cancelText}>{en.toPickup.cancelTrip}</Text>
          </TouchableOpacity>
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
  pickupCard: {
    borderRadius: shape.cardRadius,
    padding: 18,
    marginVertical: 10,
  },
  headingLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  addressLine: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '800',
    color: colors.darkTeal,
    marginTop: 4,
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillActionBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pillActionText: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  bottomActions: {
    gap: 12,
    alignItems: 'center',
  },
  mainBtn: {
    width: '100%',
  },
  cancelLink: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: typography.fontSize.body,
    fontWeight: '800',
    color: colors.danger,
    textDecorationLine: 'underline',
  },
});
