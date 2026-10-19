import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography } from '../theme/tokens';

export interface RowProps {
  label: string;
  value?: string | React.ReactNode;
  showDivider?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  valueColor?: string;
}

export const Row: React.FC<RowProps> = ({
  label,
  value,
  showDivider = true,
  onPress,
  style,
  valueColor = colors.ink,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {typeof value === 'string' ? (
          <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        ) : (
          value
        )}
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  label: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.mutedText,
  },
  value: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#8EB5BA',
  },
});

export default Row;
