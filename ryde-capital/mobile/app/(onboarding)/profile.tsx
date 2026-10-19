import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { TextField } from '../../src/components/TextField';
import { UploadField } from '../../src/components/UploadField';
import { StepDots } from '../../src/components/StepDots';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { driver, setDriver, setOnboardingStep } = useAppStore();

  const [fullName, setFullName] = useState(driver.fullName || 'Arun Kumar');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        setTimeout(() => {
          setUploading(false);
          setPhotoUploaded(true);
          setDriver({ avatarUrl: result.assets[0].uri });
        }, 600);
      }
    } catch {
      // In simulator/mock mode, toggle photo uploaded
      setPhotoUploaded(true);
    }
  };

  const handleContinue = () => {
    setDriver({ fullName });
    setOnboardingStep('verification');
    router.push('/(onboarding)/verification');
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <Text style={styles.title}>{en.profile.title}</Text>
            <Text style={styles.subtitle}>{en.profile.subtitle}</Text>

            <TextField
              label={en.profile.fullName}
              value={fullName}
              onChangeText={setFullName}
              placeholder={en.profile.fullNamePlaceholder}
            />

            <TextField
              label={en.profile.mobileNumber}
              value={driver.phone || '+91 98765 43210'}
              editable={false}
            />

            <UploadField
              label={en.profile.profilePhoto}
              uploaded={photoUploaded}
              uploading={uploading}
              hint={en.profile.photoHint}
              onPress={handlePickPhoto}
            />

            <StepDots total={4} activeIndex={1} style={styles.dots} />
          </View>

          <View style={styles.footer}>
            <Button
              title={en.profile.continue}
              variant="amber"
              onPress={handleContinue}
              disabled={!fullName.trim()}
              accessibilityLabel="Continue to verification"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  dots: {
    marginVertical: 20,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
