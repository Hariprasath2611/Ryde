import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { Card } from '../../../src/components/Card';
import { OtpInput } from '../../../src/components/OtpInput';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { useAppStore } from '../../../src/store/useAppStore';
import { mockActiveTrip } from '../../../src/services/api/mock/data';

export default function ArrivalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, updateTripState } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const [otp, setOtp] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [waitingSeconds, setWaitingSeconds] = useState(130); // 02:10
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWaitingTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleConfirmArrival = async () => {
    if (otp.length !== 4) {
      setError(true);
      return;
    }

    await updateTripState('otp_verified');
    router.replace(`/trip/${trip.id}/vehicle-check` as any);
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{en.arrivalOtp.title}</Text>
          <Text style={styles.subtitle}>
            {en.arrivalOtp.subtitle(trip.customer.firstName)}
          </Text>

          {/* Customer Card */}
          <Card variant="card" style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Text style={styles.customerName}>
                {`${trip.customer.firstName} · ${trip.customer.rating} ★`}
              </Text>
              <Text style={styles.pickupLocation}>{trip.pickup.address}</Text>
            </View>
          </Card>

          {/* 4-digit OTP Input */}
          <View style={styles.otpSection}>
            <OtpInput
              length={4}
              value={otp}
              onChangeOtp={(val) => {
                setOtp(val);
                if (error) setError(false);
              }}
              error={error}
            />
            <Text style={styles.attemptsText}>
              {en.arrivalOtp.attemptsLeft(attemptsLeft)}
            </Text>
          </View>

          {/* Waiting Time Card */}
          <Card variant="card" style={styles.waitingCard}>
            <View style={styles.waitingRow}>
              <Text style={styles.waitingLabel}>{en.arrivalOtp.waitingTime}</Text>
              <Text style={styles.waitingTime}>
                {formatWaitingTimer(waitingSeconds)}
              </Text>
            </View>
            <Text style={styles.freeNotice}>{en.arrivalOtp.waitingFreeNotice}</Text>
          </Card>
        </View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <Button
            title={en.arrivalOtp.confirmArrival}
            variant="amber"
            onPress={handleConfirmArrival}
            disabled={otp.length < 4}
            accessibilityLabel="Confirm arrival"
          />

          <TouchableOpacity
            onPress={() => {}}
            style={styles.helpLink}
            accessibilityRole="link"
          >
            <Text style={styles.helpText}>{en.arrivalOtp.didntGetCode}</Text>
          </TouchableOpacity>
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
  content: {
    paddingTop: 16,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: 16,
  },
  customerCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 4,
    borderRadius: shape.cardRadius,
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
  pickupLocation: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  otpSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  attemptsText: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
    marginTop: 4,
  },
  waitingCard: {
    padding: 18,
    marginVertical: 12,
    borderRadius: shape.cardRadius,
  },
  waitingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waitingLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
  },
  waitingTime: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  freeNotice: {
    fontSize: typography.fontSize.micro,
    color: colors.mutedText,
    marginTop: 4,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  helpLink: {
    paddingVertical: 8,
  },
  helpText: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
    textDecorationLine: 'underline',
  },
});
