import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { StepDots } from '../../src/components/StepDots';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

type VehicleKey = 'two_wheeler' | 'three_wheeler' | 'four_wheeler';

interface VehicleOption {
  key: VehicleKey;
  title: string;
  subtitle: string;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    key: 'two_wheeler',
    title: en.vehicles.twoWheeler.title,
    subtitle: en.vehicles.twoWheeler.subtitle,
  },
  {
    key: 'three_wheeler',
    title: en.vehicles.threeWheeler.title,
    subtitle: en.vehicles.threeWheeler.subtitle,
  },
  {
    key: 'four_wheeler',
    title: en.vehicles.fourWheeler.title,
    subtitle: en.vehicles.fourWheeler.subtitle,
  },
];

export default function VehiclesScreen() {
  const router = useRouter();
  const { driver, setDriver, setOnboardingStep } = useAppStore();

  // Initial selection matching 09-Vehicles.png: Two-wheeler and Four-wheeler selected
  const [selectedTypes, setSelectedTypes] = useState<VehicleKey[]>(
    driver.vehicleTypes || ['two_wheeler', 'four_wheeler']
  );

  const toggleOption = (key: VehicleKey) => {
    if (selectedTypes.includes(key)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((k) => k !== key));
      }
    } else {
      setSelectedTypes([...selectedTypes, key]);
    }
  };

  const handleContinue = () => {
    setDriver({ vehicleTypes: selectedTypes, status: 'review' });
    setOnboardingStep('status');
    router.push('/(onboarding)/status');
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.title}>{en.vehicles.title}</Text>
          <Text style={styles.subtitle}>{en.vehicles.subtitle}</Text>

          <View style={styles.tileList}>
            {VEHICLE_OPTIONS.map((item) => {
              const isSelected = selectedTypes.includes(item.key);
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => toggleOption(item.key)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${item.title}, ${isSelected ? 'selected' : 'not selected'}`}
                  style={[
                    styles.tile,
                    isSelected ? styles.tileSelected : styles.tileUnselected,
                  ]}
                >
                  <View style={styles.tileTextContainer}>
                    <Text style={styles.tileTitle}>{item.title}</Text>
                    <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <StepDots total={4} activeIndex={3} style={styles.dots} />
        </View>

        <View style={styles.footer}>
          <Button
            title={en.vehicles.continue}
            variant="amber"
            onPress={handleContinue}
            accessibilityLabel="Continue to status review"
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
  topSection: {
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
  tileList: {
    gap: 14,
  },
  tile: {
    borderRadius: shape.cardRadius,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileSelected: {
    backgroundColor: '#9CC2C6',
  },
  tileUnselected: {
    backgroundColor: colors.softCard,
  },
  tileTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  tileTitle: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  tileSubtitle: {
    fontSize: typography.fontSize.micro,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.darkTeal,
  },
  checkboxUnselected: {
    backgroundColor: colors.white,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  dots: {
    marginVertical: 20,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
