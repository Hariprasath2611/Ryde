import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shape } from '../theme/tokens';

export type CardVariant = 'card' | 'white' | 'secondary' | 'soft';

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'card',
  style,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'card':
        return colors.card;
      case 'white':
        return colors.white;
      case 'secondary':
        return colors.secondaryPanel;
      case 'soft':
        return colors.softCard;
      default:
        return colors.card;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: getBackgroundColor() },
        variant === 'white' && styles.whiteCardShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: shape.cardRadius,
    padding: 20,
    marginVertical: 8,
  },
  whiteCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default Card;
