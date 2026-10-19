import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { PhoneField, validateIndianPhone } from '../../src/components/PhoneField';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAuth } from '../../src/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    if (!/^[6-9]/.test(cleaned)) {
      setError('Indian mobile numbers must start with 6, 7, 8, or 9');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formattedPhone = `+91${cleaned}`;
    try {
      const result = await sendOtp(formattedPhone);
      setIsLoading(false);

      if (result.success) {
        router.push({
          pathname: '/(auth)/otp',
          params: { phone: formattedPhone },
        });
      } else {
        setError(result.error || 'Failed to send verification code.');
      }
    } catch {
      setIsLoading(false);
      // Fallback for mock preview flow
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: formattedPhone },
      });
    }
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{en.login.title}</Text>
            <Text style={styles.subtitle}>{en.login.subtitle}</Text>

            <View style={styles.fieldSection}>
              <PhoneField
                testID="phone-input"
                errorTestID="phone-error-message"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (error) setError(null);
                }}
                error={error || undefined}
              />
              <Text style={styles.caption}>{en.login.caption}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              testID="send-otp-button"
              title={en.login.sendCode}
              variant="amber"
              onPress={handleSendCode}
              loading={isLoading}
              disabled={phone.length === 0}
              accessibilityLabel="Send code"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
    marginBottom: 24,
  },
  fieldSection: {
    width: '100%',
  },
  caption: {
    fontSize: typography.fontSize.micro,
    color: colors.darkTeal,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
