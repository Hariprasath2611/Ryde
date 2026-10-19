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

export default function FinalCheckScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, updateTripState } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const [fuelLevel, setFuelLevel] = useState<FuelLevel>('half');
  const [odometer, setOdometer] = useState('24,579 km');

  // Initial matching 20-FinalCheck.png: 4 of 4 return photos uploaded
  const [photos, setPhotos] = useState<SlotState[]>([
    { key: 'front', label: en.vehicleCheck.photoFront, uploaded: true },
    { key: 'back', label: en.vehicleCheck.photoBack, uploaded: true },
    { key: 'left', label: en.vehicleCheck.photoLeft, uploaded: true },
    { key: 'right', label: en.vehicleCheck.photoRight, uploaded: true },
  ]);

  const toggleSlot = (key: string) => {
    setPhotos((prev) =>
      prev.map((slot) =>
        slot.key === key ? { ...slot, uploaded: !slot.uploaded } : slot
      )
    );
  };

  const uploadedCount = photos.filter((p) => p.uploaded).length;

  const handleEndTrip = async () => {
    await updateTripState('completed', {
      endOdometer: parseInt(odometer.replace(/\D/g, ''), 10) || 24579,
      endFuelLevel: fuelLevel,
    });
    router.replace(`/trip/${trip.id}/summary` as any);
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{en.finalCheck.title}</Text>
          <Text style={styles.subtitle}>{en.finalCheck.subtitle}</Text>

          {/* Fuel Level Selector */}
          <FuelSelector
            label={en.finalCheck.fuelLevel}
            value={fuelLevel}
            onChange={setFuelLevel}
          />

          {/* Odometer Field */}
          <TextField
            label={en.finalCheck.odometer}
            value={odometer}
            onChangeText={setOdometer}
            placeholder="24,579 km"
          />

          {/* Return Photos Grid (4 of 4) */}
          <View style={styles.photosSection}>
            <Text style={styles.photosHeader}>
              {en.finalCheck.returnPhotosCount(uploadedCount, photos.length)}
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

        {/* End Trip Button */}
        <View style={styles.footer}>
          <Button
            title={en.finalCheck.endTrip}
            variant="amber"
            onPress={handleEndTrip}
            accessibilityLabel="End trip"
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
    gap: 12,
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  footer: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 16,
  },
});
