import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'amber' | 'teal' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  withArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'amber',
  size = 'md',
  withArrow = false,
  loading = false,
  disabled = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#A0B8B8';
    if (variant === 'amber') return '#F5B83D';
    if (variant === 'teal') return '#075B64';
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'outline') return '#075B64';
    return '#FFFFFF';
  };

  const getPadding = () => {
    if (size === 'sm') return { paddingVertical: 8, paddingHorizontal: 16 };
    if (size === 'lg') return { paddingVertical: 15, paddingHorizontal: 28 };
    return { paddingVertical: 12, paddingHorizontal: 22 };
  };

  const getFontSize = () => {
    if (size === 'sm') return 12;
    if (size === 'lg') return 16;
    return 14;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: '#075B64',
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
              },
            ]}
          >
            {title}
          </Text>
          {withArrow && (
            <Feather
              name="arrow-right"
              size={getFontSize() + 2}
              color={getTextColor()}
              style={styles.arrow}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  arrow: {
    marginLeft: 8,
  },
});
