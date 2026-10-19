import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChangeOtp: (otp: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  testID?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChangeOtp,
  autoFocus = true,
  disabled = false,
  error = false,
  testID = 'otp-input',
}) => {
  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.split('');

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

    // Handle paste: if multiple characters pasted
    const cleanNumbers = text.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const pasted = cleanNumbers.slice(0, length);
      onChangeOtp(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigit = cleanNumbers.slice(-1);
    const newDigits = [...digits];
    // Fill gaps if needed
    for (let i = 0; i < length; i++) {
      if (newDigits[i] === undefined) newDigits[i] = '';
    }
    newDigits[index] = newDigit;
    const result = newDigits.join('').slice(0, length);
    onChangeOtp(result);

    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChangeOtp(newDigits.join(''));
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] || '';
        return (
          <View
            key={index}
            style={[
              styles.box,
              length === 4 ? styles.boxFour : styles.boxSix,
              char ? styles.boxFilled : null,
              error ? styles.boxError : null,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={char}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus
              editable={!disabled}
              selectionColor={colors.darkTeal}
              style={styles.input}
              accessibilityLabel={`OTP digit ${index + 1}`}
              accessibilityRole="text"
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
    width: '100%',
  },
  box: {
    height: 54,
    borderRadius: shape.fieldRadius,
    borderWidth: shape.fieldBorderWidth,
    borderColor: shape.fieldBorderColor,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxSix: {
    width: 48,
  },
  boxFour: {
    width: 60,
  },
  boxFilled: {
    borderColor: colors.darkTeal,
  },
  boxError: {
    borderColor: colors.danger,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: typography.fontSize.titleMedium,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    padding: 0,
  },
});

export default OtpInput;
