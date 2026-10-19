import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { FuelSelector, FuelLevel } from '../../../src/components/FuelSelector';
import { TextField } from '../../../src/components/TextField';
import { PhotoSlot } from '../../../src/components/PhotoSlot';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { useAppStore } from '../../../src/store/useAppStore';
import { mockActiveTrip } from '../../../src/services/api/mock/data';

interface SlotState {
  key: string;
  label: string;
  uploaded: boolean;
}

export default function VehicleCheckScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, updateTripState } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const [fuelLevel, setFuelLevel] = useState<FuelLevel>('half');
  const [odometer, setOdometer] = useState('24,560 km');

  // Initial matching 18-VehicleCheck.png: Front & Back uploaded (2 of 6)
  const [photos, setPhotos] = useState<SlotState[]>([
    { key: 'front', label: en.vehicleCheck.photoFront, uploaded: true },
    { key: 'back', label: en.vehicleCheck.photoBack, uploaded: true },
    { key: 'left', label: en.vehicleCheck.photoLeft, uploaded: false },
    { key: 'right', label: en.vehicleCheck.photoRight, uploaded: false },
    { key: 'odometer', label: en.vehicleCheck.photoOdometer, uploaded: false },
    { key: 'fuel', label: en.vehicleCheck.photoFuel, uploaded: false },
  ]);

  const toggleSlot = (key: string) => {
    setPhotos((prev) =>
      prev.map((slot) =>
        slot.key === key ? { ...slot, uploaded: !slot.uploaded } : slot
      )
    );
  };

  const uploadedCount = photos.filter((p) => p.uploaded).length;

  const handleStartTrip = async () => {
    await updateTripState('in_progress', {
      startOdometer: parseInt(odometer.replace(/\D/g, ''), 10) || 24560,
      startFuelLevel: fuelLevel,
    });
    router.replace(`/trip/${trip.id}/active` as any);
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{en.vehicleCheck.title}</Text>
          <Text style={styles.subtitle}>{en.vehicleCheck.subtitle}</Text>

          {/* Fuel Level Selector */}
          <FuelSelector
            label={en.vehicleCheck.fuelLevel}
            value={fuelLevel}
            onChange={setFuelLevel}
          />

          {/* Odometer Field */}
          <TextField
            label={en.vehicleCheck.odometer}
            value={odometer}
            onChangeText={setOdometer}
            placeholder={en.vehicleCheck.odometerPlaceholder}
          />

          {/* Photo Slots Grid */}
          <View style={styles.photosSection}>
            <Text style={styles.photosHeader}>
              {en.vehicleCheck.photosCount(uploadedCount, photos.length)}
            </Text>

            <View style={styles.grid}>
              {photos.map((slot) => (
                <View key={slot.key} style={styles.gridCol}>
                  <PhotoSlot
                    label={slot.label}
                    uploaded={slot.uploaded}
                    onPress={() => toggleSlot(slot.key)}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Start Trip Button */}
        <View style={styles.footer}>
          <Button
            title={en.vehicleCheck.startTrip}
            variant="amber"
            onPress={handleStartTrip}
            accessibilityLabel="Start trip"
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
  photosSection: {
    marginTop: 12,
  },
  photosHeader: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '31%',
  },
  footer: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 16,
  },
});
