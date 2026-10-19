import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

export interface StepDotsProps {
  total: number;
  activeIndex: number;
  style?: ViewStyle;
}

export const StepDots: React.FC<StepDotsProps> = ({
  total,
  activeIndex,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 14,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.amber,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.darkTeal,
    opacity: 0.8,
  },
});

export default StepDots;
