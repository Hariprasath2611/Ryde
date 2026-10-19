import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export interface PhoneFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  editable?: boolean;
  testID?: string;
  errorTestID?: string;
}

export const validateIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  onChangeText,
  error,
  helperText,
  containerStyle,
  editable = true,
  testID = 'phone-input',
  errorTestID = 'phone-error-message',
}) => {
  const handleChange = (text: string) => {
    // Only permit digits up to 10
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.row}>
        {/* Country Code Pill */}
        <View style={styles.countryCodePill}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>

        {/* Number Input Box */}
        <View
          style={[
            styles.inputWrapper,
            error ? styles.inputWrapperError : null,
            !editable ? styles.inputWrapperDisabled : null,
          ]}
        >
          <TextInput
            testID={testID}
            value={value}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="Mobile number"
            placeholderTextColor={colors.mutedText}
            selectionColor={colors.darkTeal}
            editable={editable}
            accessibilityLabel="Mobile number"
            accessibilityRole="text"
            style={styles.input}
          />
        </View>
      </View>

      {error ? (
        <Text testID={errorTestID} style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodePill: {
    height: shape.fieldHeight,
    paddingHorizontal: 14,
    borderRadius: shape.fieldRadius,
    borderWidth: shape.fieldBorderWidth,
    borderColor: shape.fieldBorderColor,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
  inputWrapper: {
    flex: 1,
    height: shape.fieldHeight,
    borderRadius: shape.fieldRadius,
    borderWidth: shape.fieldBorderWidth,
    borderColor: shape.fieldBorderColor,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.softCard,
    opacity: 0.8,
  },
  input: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink,
    padding: 0,
  },
  helperText: {
    fontSize: typography.fontSize.micro,
    color: colors.mutedText,
    marginTop: 6,
  },
  errorText: {
    fontSize: typography.fontSize.micro,
    color: colors.danger,
    fontWeight: typography.fontWeight.medium,
    marginTop: 6,
  },
});

export default PhoneField;
