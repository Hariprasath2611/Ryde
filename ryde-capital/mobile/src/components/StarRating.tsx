import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

export interface StarRatingProps {
  rating: number; // 1 to 5
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  style?: ViewStyle;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 36,
  readonly = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= rating;

        const starContent = (
          <Text
            style={[
              styles.star,
              { fontSize: size, color: colors.darkTeal },
            ]}
          >
            {isFilled ? '★' : '☆'}
          </Text>
        );

        if (readonly) {
          return (
            <View key={index} style={styles.starWrapper}>
              {starContent}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={() => onRatingChange?.(starNumber)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${starNumber} out of ${maxStars} stars`}
            style={styles.starWrapper}
          >
            {starContent}
          </TouchableOpacity>
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
    marginVertical: 12,
  },
  starWrapper: {
    padding: 4,
  },
  star: {
    fontWeight: '900',
  },
});

export default StarRating;
