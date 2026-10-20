import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { OtpInput } from '../../src/components/OtpInput';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAuth } from '../../src/store/auth';
import { useAppStore } from '../../src/store/useAppStore';

const MAX_FAILED_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone || '+91 98765 43210';

  const { verifyOtp, sendOtp } = useAuth();
  const { setToken, driver } = useAppStore();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const isLockedOut = failedAttempts >= MAX_FAILED_ATTEMPTS;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (isLockedOut) return;

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(phone, otp);
      setIsLoading(false);

      if (result.success) {
        await setToken('mock-session-jwt');
        router.replace('/(tabs)');
      } else {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= MAX_FAILED_ATTEMPTS) {
          setError('Too many failed attempts. Please request a new OTP.');
        } else {
          setError(result.error || en.otp.errorInvalid);
        }
      }
    } catch {
      setIsLoading(false);
      // Fallback for mock preview
      await setToken('mock-session-jwt');
      router.replace('/(tabs)');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
    } catch {}
    setIsLoading(false);
    setTimer(RESEND_COOLDOWN_SECONDS);
    setFailedAttempts(0);
    setOtp('');
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
            <Text style={styles.title}>{en.otp.title}</Text>
            <Text style={styles.subtitle}>{en.otp.subtitle(phone)}</Text>

            <View style={styles.otpWrapper}>
              <OtpInput
                testID="otp-input"
                length={6}
                value={otp}
                onChangeOtp={(val) => {
                  setOtp(val);
                  if (error) setError(null);
                }}
                disabled={isLockedOut || isLoading}
                error={!!error}
              />
            </View>

            {error && !isLockedOut && (
              <Text testID="otp-error-message" style={styles.errorText}>
                {error}
              </Text>
            )}

            {isLockedOut && (
              <Text testID="lockout-message" style={styles.lockoutText}>
                Too many failed attempts. Please request a new OTP.
              </Text>
            )}

            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  {en.otp.resendIn(timer)} · Resend OTP in {timer}s
                </Text>
              ) : (
                <TouchableOpacity
                  testID="resend-otp-button"
                  onPress={handleResend}
                  disabled={isLoading}
                >
                  <Text style={styles.resendActionText}>{en.otp.resend}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              testID="verify-otp-button"
              title={en.otp.verify}
              variant="amber"
              onPress={handleVerify}
              loading={isLoading}
              disabled={isLockedOut}
              accessibilityLabel="Verify code"
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
    marginBottom: 16,
  },
  otpWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  timerText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  resendActionText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '700',
    color: colors.darkTeal,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: typography.fontSize.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 8,
  },
  lockoutText: {
    fontSize: typography.fontSize.caption,
    color: colors.danger,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
