import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { MapViewWrapper } from '../../src/components/MapViewWrapper';
import { Card } from '../../src/components/Card';
import { Row } from '../../src/components/Row';
import { Button } from '../../src/components/Button';
import { CountdownRing } from '../../src/components/CountdownRing';
import { en } from '../../src/i18n/en';
import { formatINR } from '../../src/utils/format';
import { useAppStore } from '../../src/store/useAppStore';
import { createMockOffer } from '../../src/services/api/mock/data';

export default function OfferScreen() {
  const router = useRouter();
  const {
    currentOffer,
    setCurrentOffer,
    acceptOffer,
    rejectOffer,
  } = useAppStore();

  const offer = currentOffer || createMockOffer(25);

  const handleExpire = () => {
    rejectOffer();
    router.replace('/(tabs)/home');
  };

  const handleReject = () => {
    rejectOffer();
    router.replace('/(tabs)/home');
  };

  const handleAccept = async () => {
    const trip = await acceptOffer(offer);
    router.replace(`/trip/${trip.id}/to-pickup` as any);
  };

  const handlePreview = () => {
    router.push('/trip/offer-preview');
  };

  return (
    <ScreenBackground deco={false} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Map Header Preview */}
        <MapViewWrapper height={260} style={styles.mapPreview} />

        {/* Offer Details Card */}
        <Card variant="card" style={styles.offerCard}>
          {/* Header row with Fare & Countdown */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.newBookingLabel}>{en.offer.newBooking}</Text>
              <Text style={styles.fareAmount}>{formatINR(offer.fare)}</Text>
            </View>
            <CountdownRing
              expiresAt={offer.expiresAt}
              totalSeconds={offer.totalDurationSeconds || 30}
              onExpire={handleExpire}
              size={76}
            />
          </View>

          <View style={styles.divider} />

          {/* Details Breakdown */}
          <Row
            label={en.offer.customer}
            value={`${offer.customer.firstName} · ${offer.customer.rating} ★`}
            showDivider={true}
          />
          <Row
            label={en.offer.vehicle}
            value={offer.vehicle.label}
            showDivider={true}
          />
          <Row
            label={en.offer.pickup}
            value={`${offer.pickup.address} · ${offer.pickup.distanceKm} km`}
            showDivider={true}
          />
          <Row
            label={en.offer.drop}
            value={`${offer.drop.address} · ${offer.drop.distanceKm} km`}
            showDivider={false}
          />

          {/* Preview route link */}
          <TouchableOpacity
            onPress={handlePreview}
            activeOpacity={0.7}
            accessibilityRole="link"
            style={styles.previewLinkWrapper}
          >
            <Text style={styles.previewLinkText}>{en.offer.previewRoute}</Text>
          </TouchableOpacity>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title={en.offer.reject}
            variant="outline"
            onPress={handleReject}
            style={styles.actionBtn}
            accessibilityLabel="Reject ride offer"
          />
          <Button
            title={en.offer.accept}
            variant="amber"
            onPress={handleAccept}
            style={styles.actionBtn}
            accessibilityLabel="Accept ride offer"
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
    paddingBottom: 24,
    paddingTop: 8,
  },
  mapPreview: {
    borderRadius: shape.cardRadius,
  },
  offerCard: {
    padding: 20,
    marginVertical: 10,
    borderRadius: shape.cardRadius,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  newBookingLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  fareAmount: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '800',
    color: colors.darkTeal,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#8EB5BA',
    marginBottom: 4,
  },
  previewLinkWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewLinkText: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
});
