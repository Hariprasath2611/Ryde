import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { TextField } from '../../src/components/TextField';
import { UploadField } from '../../src/components/UploadField';
import { StepDots } from '../../src/components/StepDots';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

export default function VerificationScreen() {
  const router = useRouter();
  const { setOnboardingStep } = useAppStore();

  // Local state ONLY - never stored in global store, logs, or analytics
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [licenceUploaded, setLicenceUploaded] = useState(true); // Default true matching 08-Verify.png
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear Aadhaar state immediately on unmount (strict security rule)
  useEffect(() => {
    return () => {
      setAadhaarNumber('');
      setAadhaarOtp('');
    };
  }, []);

  const handleFormatAadhaar = (text: string) => {
    // Only digits, maximum 12 digits, formatted as XXXX XXXX XXXX
    const digits = text.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    setAadhaarNumber(parts.join(' '));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate secure verification call without persisting Aadhaar number
    setTimeout(() => {
      setAadhaarNumber('');
      setAadhaarOtp('');
      setIsSubmitting(false);
      setOnboardingStep('vehicles');
      router.push('/(onboarding)/vehicles');
    }, 600);
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
            <Text style={styles.title}>{en.verification.title}</Text>
            <Text style={styles.subtitle}>{en.verification.subtitle}</Text>

            <TextField
              label={en.verification.aadhaarLabel}
              value={aadhaarNumber}
              onChangeText={handleFormatAadhaar}
              placeholder={en.verification.aadhaarPlaceholder}
              keyboardType="number-pad"
              maxLength={14}
              helperText={en.verification.aadhaarNotice}
              accessibilityLabel="Aadhaar number"
            />

            <TextField
              label={en.verification.aadhaarOtpLabel}
              value={aadhaarOtp}
              onChangeText={(text) => setAadhaarOtp(text.replace(/\D/g, '').slice(0, 6))}
              placeholder={en.verification.aadhaarOtpPlaceholder}
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel="Aadhaar OTP"
            />

            <UploadField
              label={en.verification.drivingLicenceLabel}
              uploaded={licenceUploaded}
              hint={en.verification.licenceHint}
              onPress={() => setLicenceUploaded(!licenceUploaded)}
            />

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              onPress={() => setIsConfirmed(!isConfirmed)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isConfirmed }}
              accessibilityLabel="I confirm these details are correct"
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  isConfirmed ? styles.checkboxChecked : styles.checkboxUnchecked,
                ]}
              >
                {isConfirmed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {en.verification.confirmCheckbox}
              </Text>
            </TouchableOpacity>

            <StepDots total={4} activeIndex={2} style={styles.dots} />
          </View>

          <View style={styles.footer}>
            <Button
              title={en.verification.submit}
              variant="amber"
              onPress={handleSubmit}
              loading={isSubmitting}
              accessibilityLabel="Submit for review"
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
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.darkTeal,
  },
  checkboxUnchecked: {
    backgroundColor: colors.white,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
    flex: 1,
  },
  dots: {
    marginVertical: 16,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
