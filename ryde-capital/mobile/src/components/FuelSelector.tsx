import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'full';

export interface FuelSelectorProps {
  label?: string;
  value: FuelLevel;
  onChange: (level: FuelLevel) => void;
  style?: ViewStyle;
}

const FUEL_OPTIONS: Array<{ key: FuelLevel; label: string }> = [
  { key: 'empty', label: 'Empty' },
  { key: 'quarter', label: '¼' },
  { key: 'half', label: 'Half' },
  { key: 'full', label: 'Full' },
];

export const FuelSelector: React.FC<FuelSelectorProps> = ({
  label = 'Fuel level',
  value,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {FUEL_OPTIONS.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label} fuel level`}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  pill: {
    flex: 1,
    height: 52,
    borderRadius: shape.fieldRadius,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillUnselected: {
    backgroundColor: colors.white,
  },
  pillSelected: {
    backgroundColor: colors.darkTeal,
  },
  pillText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  pillTextUnselected: {
    color: colors.darkTeal,
  },
  pillTextSelected: {
    color: colors.white,
  },
});

export default FuelSelector;
