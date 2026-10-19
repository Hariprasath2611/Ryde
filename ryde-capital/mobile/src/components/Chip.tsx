import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography } from '../theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
  icon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
  },
  chipSelected: {
    backgroundColor: colors.darkTeal,
    borderColor: colors.darkTeal,
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderColor: colors.darkTeal,
  },
  text: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  textSelected: {
    color: colors.white,
  },
  textUnselected: {
    color: colors.darkTeal,
  },
});

export default Chip;
