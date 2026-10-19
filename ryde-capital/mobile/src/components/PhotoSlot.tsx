import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export interface PhotoSlotProps {
  label: string;
  uploaded?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const PhotoSlot: React.FC<PhotoSlotProps> = ({
  label,
  uploaded = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label} photo slot, ${uploaded ? 'uploaded' : 'empty'}`}
      style={[
        styles.slot,
        uploaded ? styles.slotUploaded : styles.slotEmpty,
        style,
      ]}
    >
      <Text style={[styles.text, uploaded ? styles.textUploaded : styles.textEmpty]}>
        {uploaded ? `✓ ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  slot: {
    height: 72,
    borderRadius: shape.fieldRadius,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  slotEmpty: {
    backgroundColor: colors.white,
  },
  slotUploaded: {
    backgroundColor: '#8EB5BA',
  },
  text: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  textEmpty: {
    color: colors.darkTeal,
  },
  textUploaded: {
    color: colors.darkTeal,
  },
});

export default PhotoSlot;
