import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/store/auth';

const MAX_FAILED_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone || '';

  const { verifyOtp, sendOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const isLockedOut = failedAttempts >= MAX_FAILED_ATTEMPTS;

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = async () => {
    if (isLockedOut) return;

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await verifyOtp(phone, otp);
    setIsLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= MAX_FAILED_ATTEMPTS) {
        setError('Too many failed attempts. Please request a new OTP.');
      } else {
        setError(
          result.error ||
            `Invalid code. ${MAX_FAILED_ATTEMPTS - nextFailures} attempt(s) remaining.`,
        );
      }
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setIsLoading(true);
    setError(null);

    const result = await sendOtp(phone);
    setIsLoading(false);

    if (result.success) {
      setTimer(RESEND_COOLDOWN_SECONDS);
      setFailedAttempts(0);
      setOtp('');
      setError(null);
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{' '}
          <Text style={styles.phoneHighlight}>{phone || 'your phone'}</Text>
        </Text>

        <TextInput
          testID="otp-input"
          style={styles.input}
          placeholder="000000"
          placeholderTextColor="#64748B"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            if (error) setError(null);
          }}
          editable={!isLoading && !isLockedOut}
          autoFocus
        />

        {error && (
          <Text testID="otp-error-message" style={styles.errorText}>
            {error}
          </Text>
        )}

        {isLockedOut && (
          <Text testID="lockout-message" style={styles.lockoutText}>
            Too many failed attempts. Please request a new OTP.
          </Text>
        )}

        <TouchableOpacity
          testID="verify-otp-button"
          style={[styles.button, (isLoading || isLockedOut) && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={isLoading || isLockedOut}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendLabel}>Didn't receive the code? </Text>
          <TouchableOpacity
            testID="resend-otp-button"
            onPress={handleResendOtp}
            disabled={timer > 0 || isLoading}
          >
            <Text
              style={[
                styles.resendAction,
                (timer > 0 || isLoading) && styles.resendDisabled,
              ]}
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.changePhoneButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.changePhoneText}>Change phone number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  phoneHighlight: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    height: 56,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  lockoutText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  resendLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  resendAction: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#64748B',
  },
  changePhoneButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  changePhoneText: {
    color: '#94A3B8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
