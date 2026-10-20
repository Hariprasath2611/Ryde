import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CornerDecorationsProps {
  showTopLeft?: boolean;
  showBottomRight?: boolean;
}

export const CornerDecorations: React.FC<CornerDecorationsProps> = ({
  showTopLeft = true,
  showBottomRight = true,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Left Decorative Shape */}
      {showTopLeft && (
        <View style={styles.topLeft}>
          <Svg width={180} height={180} viewBox="0 0 160 160">
            {/* Outer concentric amber outline arc */}
            <Circle
              cx="40"
              cy="40"
              r="105"
              stroke="#F5B83D"
              strokeWidth="3.5"
              fill="none"
              opacity="0.85"
            />
            {/* Inner solid teal filled circle */}
            <Circle
              cx="40"
              cy="40"
              r="82"
              fill="#6FA5A5"
            />
          </Svg>
        </View>
      )}

      {/* Bottom Right Decorative Shape */}
      {showBottomRight && (
        <View style={styles.bottomRight}>
          <Svg width={200} height={200} viewBox="0 0 180 180">
            {/* Outer concentric amber outline arc */}
            <Circle
              cx="140"
              cy="140"
              r="120"
              stroke="#F5B83D"
              strokeWidth="3.5"
              fill="none"
              opacity="0.85"
            />
            {/* Inner solid teal filled circle */}
            <Circle
              cx="140"
              cy="140"
              r="95"
              fill="#6FA5A5"
            />
          </Svg>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
  },
  bottomRight: {
    position: 'absolute',
    bottom: -45,
    right: -45,
  },
});
