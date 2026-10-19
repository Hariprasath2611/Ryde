import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export type BannerType = 'warning' | 'danger' | 'info' | 'success';

export interface BannerProps {
  message: string;
  type?: BannerType;
  style?: ViewStyle;
}

export const Banner: React.FC<BannerProps> = ({
  message,
  type = 'warning',
  style,
}) => {
  const getBannerColor = () => {
    switch (type) {
      case 'warning':
        return colors.amber;
      case 'danger':
        return colors.danger;
      case 'success':
        return colors.success;
      case 'info':
      default:
        return colors.darkTeal;
    }
  };

  const getTextColor = () => {
    return type === 'warning' ? colors.darkTeal : colors.white;
  };

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: getBannerColor() },
        style,
      ]}
      accessibilityRole="alert"
    >
      <Text style={[styles.text, { color: getTextColor() }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: shape.fieldRadius,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
});

export default Banner;
