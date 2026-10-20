import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../theme/tokens';

export interface StepDotsProps {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
  style?: ViewStyle;
}

export const StepDots: React.FC<StepDotsProps> = ({
  total,
  activeIndex,
  onDotPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === activeIndex;
        const dotElement = (
          <View
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );

        if (onDotPress) {
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onDotPress(i)}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1} of ${total}`}
              accessibilityState={{ selected: isActive }}
              testID={`step-dot-${i}`}
              activeOpacity={0.7}
            >
              {dotElement}
            </TouchableOpacity>
          );
        }

        return <View key={i}>{dotElement}</View>;
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
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 30,
    backgroundColor: colors.amber,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.darkTeal,
    opacity: 0.35,
  },
});

export default StepDots;
