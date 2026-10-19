import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../theme/tokens';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon = '📋',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#9CC2C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default EmptyState;
