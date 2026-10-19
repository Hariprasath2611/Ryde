import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { useAppStore } from '../../../src/store/useAppStore';

const CANCEL_REASONS = [
  en.cancel.reasons.customerNotResponding,
  en.cancel.reasons.vehicleProblem,
  en.cancel.reasons.dontFeelSafe,
  en.cancel.reasons.other,
];

export default function CancelTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateTripState } = useAppStore();

  const [selectedReason, setSelectedReason] = useState<string>(
    en.cancel.reasons.customerNotResponding
  );

  const handleConfirmCancel = async () => {
    await updateTripState('cancelled_by_driver');
    router.replace('/(tabs)/home');
  };

  const handleKeepTrip = () => {
    router.back();
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{en.cancel.title}</Text>
          <Text style={styles.subtitle}>{en.cancel.subtitle}</Text>

          {/* Reason Radio Cards */}
          <View style={styles.reasonList}>
            {CANCEL_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={reason}
                  style={[
                    styles.reasonCard,
                    isSelected
                      ? styles.reasonCardSelected
                      : styles.reasonCardUnselected,
                  ]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioSelected : styles.radioUnselected,
                    ]}
                  >
                    {isSelected && <View style={styles.innerDot} />}
                  </View>
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            title={en.cancel.confirm}
            variant="danger"
            onPress={handleConfirmCancel}
            style={styles.fullBtn}
            accessibilityLabel="Confirm cancellation"
          />
          <Button
            title={en.cancel.keep}
            variant="darkTeal"
            onPress={handleKeepTrip}
            style={styles.fullBtn}
            accessibilityLabel="Keep trip"
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
    marginBottom: 20,
  },
  reasonList: {
    gap: 12,
  },
  reasonCard: {
    borderRadius: shape.cardRadius,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reasonCardSelected: {
    backgroundColor: '#8EB5BA',
  },
  reasonCardUnselected: {
    backgroundColor: colors.softCard,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.darkTeal,
  },
  radioUnselected: {
    backgroundColor: 'transparent',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.darkTeal,
  },
  reasonText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
    flex: 1,
  },
  footer: {
    width: '100%',
    gap: 12,
    paddingBottom: 16,
  },
  fullBtn: {
    width: '100%',
  },
});
