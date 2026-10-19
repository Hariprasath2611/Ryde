import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  containerStyle,
  leftElement,
  rightElement,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
          props.editable === false ? styles.inputWrapperDisabled : null,
        ]}
      >
        {leftElement}
        <TextInput
          placeholderTextColor={colors.mutedText}
          selectionColor={colors.darkTeal}
          style={[styles.input, style]}
          {...props}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  label: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    marginBottom: 8,
  },
  inputWrapper: {
    height: shape.fieldHeight,
    borderRadius: shape.fieldRadius,
    borderWidth: shape.fieldBorderWidth,
    borderColor: shape.fieldBorderColor,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.softCard,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    height: '100%',
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

export default TextField;
