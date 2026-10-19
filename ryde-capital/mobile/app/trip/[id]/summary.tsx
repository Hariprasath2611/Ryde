import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Card } from '../../../src/components/Card';
import { Row } from '../../../src/components/Row';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { formatINR } from '../../../src/utils/format';
import { useAppStore } from '../../../src/store/useAppStore';
import { mockActiveTrip } from '../../../src/services/api/mock/data';

export default function SummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const handleContinue = () => {
    router.replace(`/trip/${trip.id}/rate` as any);
  };

  return (
    <ScreenBackground deco={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Checkmark Badge */}
        <View style={styles.topArea}>
          <View style={styles.badgeCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>{en.summary.title}</Text>
          <Text style={styles.amountLarge}>{formatINR(trip.fare)}</Text>
        </View>

        {/* Breakdown Card */}
        <Card variant="card" style={styles.breakdownCard}>
          <Row
            label={en.summary.distance}
            value={`${trip.distanceKm} km`}
            showDivider={true}
          />
          <Row
            label={en.summary.duration}
            value={`${trip.durationMinutes} min`}
            showDivider={true}
          />
          <Row
            label={en.summary.vehicle}
            value="Sedan"
            showDivider={true}
          />
          <Row
            label={en.summary.platformFee}
            value={`-${formatINR(trip.platformFee)}`}
            showDivider={false}
          />
        </Card>

        {/* White You Earn Card */}
        <Card variant="white" style={styles.youEarnCard}>
          <Text style={styles.youEarnLabel}>{en.summary.youEarn}</Text>
          <Text style={styles.youEarnAmount}>
            {formatINR(trip.driverEarnings)}
          </Text>

          <View style={styles.divider} />

          <View style={styles.todaysTotalRow}>
            <Text style={styles.todaysTotalLabel}>{en.summary.todaysTotal}</Text>
            <Text style={styles.todaysTotalAmount}>{formatINR(1720)}</Text>
          </View>
        </Card>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button
            title={en.summary.continue}
            variant="amber"
            onPress={handleContinue}
            accessibilityLabel="Continue to rating"
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
    flexGrow: 1,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 8,
  },
  badgeCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 50,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
  },
  amountLarge: {
    fontSize: typography.fontSize.amountHuge,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    marginTop: 4,
  },
  breakdownCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderRadius: shape.cardRadius,
  },
  youEarnCard: {
    padding: 20,
    marginVertical: 8,
    borderRadius: shape.cardRadius,
  },
  youEarnLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  youEarnAmount: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '800',
    color: colors.darkTeal,
    marginTop: 2,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  todaysTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todaysTotalLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
  },
  todaysTotalAmount: {
    fontSize: typography.fontSize.button,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  footer: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 16,
  },
});
