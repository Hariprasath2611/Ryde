import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export type ButtonVariant = 'amber' | 'darkTeal' | 'outline' | 'danger' | 'text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'amber',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  testID,
}) => {
  const isInteractive = !disabled && !loading;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'amber':
        return styles.amberContainer;
      case 'darkTeal':
        return styles.darkTealContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'text':
        return styles.textContainer;
      default:
        return styles.amberContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'amber':
        return styles.amberText;
      case 'darkTeal':
        return styles.darkTealText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'text':
        return styles.textLinkText;
      default:
        return styles.amberText;
    }
  };

  const getIndicatorColor = (): string => {
    switch (variant) {
      case 'amber':
      case 'outline':
      case 'text':
        return colors.darkTeal;
      case 'darkTeal':
      case 'danger':
        return colors.white;
      default:
        return colors.darkTeal;
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: shape.buttonHeight,
    borderRadius: shape.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  baseText: {
    fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  amberContainer: {
    backgroundColor: colors.amber,
  },
  amberText: {
    color: colors.darkTeal,
  },
  darkTealContainer: {
    backgroundColor: colors.darkTeal,
  },
  darkTealText: {
    color: colors.white,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.darkTeal,
  },
  outlineText: {
    color: colors.darkTeal,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.white,
  },
  textContainer: {
    backgroundColor: 'transparent',
    height: 'auto',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  textLinkText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
});

export default Button;
