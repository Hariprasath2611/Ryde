import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';

export interface ScreenBackgroundProps {
  children?: ReactNode;
  deco?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  children,
  deco = true,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {deco && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Top-Left Decorative Motif */}
          <View style={styles.topLeftDeco}>
            <Svg width={240} height={240} viewBox="0 0 240 240">
              {/* Mid-teal filled circle */}
              <Circle cx="50" cy="50" r="95" fill={colors.midTeal} />
              {/* Outer amber ring */}
              <Circle
                cx="50"
                cy="50"
                r="115"
                fill="none"
                stroke={colors.amber}
                strokeWidth={3}
              />
            </Svg>
          </View>

          {/* Bottom-Right Decorative Motif */}
          <View style={styles.bottomRightDeco}>
            <Svg width={240} height={240} viewBox="0 0 240 240">
              {/* Mid-teal filled circle */}
              <Circle cx="190" cy="190" r="95" fill={colors.midTeal} />
              {/* Outer amber ring */}
              <Circle
                cx="190"
                cy="190"
                r="115"
                fill="none"
                stroke={colors.amber}
                strokeWidth={3}
              />
            </Svg>
          </View>
        </View>
      )}

      <SafeAreaView edges={edges} style={[styles.safeArea, contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  topLeftDeco: {
    position: 'absolute',
    top: -50,
    left: -50,
  },
  bottomRightDeco: {
    position: 'absolute',
    bottom: -50,
    right: -50,
  },
});

export default ScreenBackground;
