import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

interface Screen3OtpVerificationProps {
  mobileNumber?: string;
  onBack: () => void;
  onProceed: () => void;
}

export const Screen3OtpVerification: React.FC<Screen3OtpVerificationProps> = ({
  mobileNumber = '9876543210',
  onBack,
  onProceed,
}) => {
  const [digits, setDigits] = useState<string[]>(['4', '4', '4', '4', '8', '9']);
  const [resendSeconds, setResendSeconds] = useState(30);
  const inputRefs = useRef<any[]>([]);


  useEffect(() => {
    if (resendSeconds > 0) {
      const timer = setTimeout(() => setResendSeconds(resendSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendSeconds]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = clean;
    setDigits(updated);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleProceed = () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits of the OTP.');
      return;
    }
    onProceed();
  };

  const handleFillDemo = () => {
    setDigits(['4', '4', '4', '4', '8', '9']);
  };

  return (
    <View style={styles.container}>
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.heading}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to +91 {mobileNumber}
          </Text>
        </View>

        {/* 6 Digit Container matching Reference Screen 3 */}
        <View style={styles.otpBox}>
          <View style={styles.slotsRow}>
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                value={digit}
                onChangeText={(val) => handleDigitChange(idx, val)}
                keyboardType="numeric"
                maxLength={1}
                style={[
                  styles.slotInput,
                  digit ? styles.slotFilled : styles.slotEmpty,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFillDemo}
            style={styles.demoFillBtn}
          >
            <Text style={styles.demoFillText}>Fill Demo OTP (444489)</Text>
          </TouchableOpacity>
        </View>

        {/* Resend Link */}
        <TouchableOpacity
          disabled={resendSeconds > 0}
          onPress={() => {
            setResendSeconds(30);
            Alert.alert('OTP Sent', 'New verification OTP sent to your phone.');
          }}
          style={styles.resendArea}
        >
          <Text
            style={[
              styles.resendText,
              resendSeconds > 0 && styles.resendDisabled,
            ]}
          >
            {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend'}
          </Text>
        </TouchableOpacity>

        {/* Proceed Button */}
        <View style={styles.btnArea}>
          <Button
            title="Proceed"
            variant="amber"
            size="lg"
            onPress={handleProceed}
          />
        </View>
      </View>

      {/* Pagination Dots (Right Active) */}
      <View style={styles.paginationRow}>
        <View style={styles.inactiveDot} />
        <View style={styles.inactiveDot} />
        <View style={styles.activePill} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF0F0',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    flex: 1,
  },
  titleSection: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#075B64',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(7, 91, 100, 0.8)',
    marginTop: 2,
  },
  otpBox: {
    backgroundColor: 'rgba(142, 183, 183, 0.35)',
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  slotInput: {
    width: 40,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#075B64',
    borderBottomWidth: 4,
  },
  slotFilled: {
    borderBottomColor: '#075B64',
  },
  slotEmpty: {
    borderBottomColor: '#6FA5A5',
  },
  demoFillBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  demoFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#075B64',
  },
  resendArea: {
    alignItems: 'center',
    marginVertical: 18,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
    textDecorationLine: 'underline',
  },
  resendDisabled: {
    color: '#718096',
    textDecorationLine: 'none',
  },
  btnArea: {
    marginTop: 6,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  activePill: {
    width: 24,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F5B83D',
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(111, 165, 165, 0.6)',
  },
});
