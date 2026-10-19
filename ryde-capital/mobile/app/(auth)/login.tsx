import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (input: string): boolean => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return false;
    }
    if (!/^[6-9]/.test(cleaned)) {
      setError('Indian mobile numbers must start with 6, 7, 8, or 9');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) return;

    setIsLoading(true);
    setError(null);

    const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
    const result = await sendOtp(formattedPhone);
    setIsLoading(false);

    if (result.success) {
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: formattedPhone },
      });
    } else {
      setError(result.error || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Ryde Capital</Text>
        <Text style={styles.subtitle}>Driver Partner Sign-In</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            testID="phone-input"
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (error) setError(null);
            }}
            editable={!isLoading}
          />
        </View>

        {error && (
          <Text testID="phone-error-message" style={styles.errorText}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          testID="send-otp-button"
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
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
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 52,
  },
  countryCode: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
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
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
