import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

export interface PanelProps {
  height: number;
  reduceMotion?: boolean;
}

/**
 * Hook for smooth 3-second floating loop animation
 */
function useFloatingOffset(reduceMotion: boolean, phaseDelayMs: number = 0) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(0);
      return;
    }

    let isCancelled = false;
    let loopAnim: Animated.CompositeAnimation | null = null;

    const timeout = setTimeout(() => {
      if (isCancelled) return;
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );
      loopAnim.start();
    }, phaseDelayMs);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      loopAnim?.stop();
    };
  }, [reduceMotion, phaseDelayMs]);

  return anim;
}

/**
 * Slide 1: Car illustration with "Your vehicle", "Our driver", "Bike · Auto · Car" chips
 */
export const Slide1Panel: React.FC<PanelProps> = ({ height, reduceMotion = false }) => {
  const float1 = useFloatingOffset(reduceMotion, 0);
  const float2 = useFloatingOffset(reduceMotion, 600);
  const float3 = useFloatingOffset(reduceMotion, 1200);

  return (
    <View style={[styles.panelBase, styles.lightPanel, { height }]}>
      {/* Decorative SVG Illustration (Hidden from screen reader) */}
      <View style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 360 390" preserveAspectRatio="xMidYMid meet">
          {/* Concentric Circle */}
          <Circle cx="180" cy="195" r="130" fill="#BBD8DB" fillOpacity={0.65} />
          {/* Outer Amber Ring */}
          <Circle cx="180" cy="195" r="145" stroke={colors.amber} strokeWidth="3" fill="none" />
          {/* Road Line */}
          <Line x1="25" y1="260" x2="335" y2="260" stroke="#8EB5BA" strokeWidth="6" strokeLinecap="round" />
          {/* Flat Car Body */}
          <Path
            d="M 72 260 L 72 232 C 72 216 82 206 98 206 L 126 206 L 148 162 C 153 152 163 146 175 146 L 235 146 C 247 146 257 152 262 162 L 284 206 L 302 206 C 316 206 324 216 324 232 L 324 260 Z"
            fill={colors.darkTeal}
          />
          {/* Windows */}
          <Path d="M 152 164 L 134 200 L 195 200 L 195 164 Z" fill="#D8EDEF" />
          <Path d="M 205 164 L 205 200 L 276 200 L 258 164 Z" fill="#D8EDEF" />
          {/* Wheels */}
          <Circle cx="125" cy="260" r="26" fill={colors.ink} />
          <Circle cx="125" cy="260" r="11" fill="#D8EDEF" />
          <Circle cx="265" cy="260" r="26" fill={colors.ink} />
          <Circle cx="265" cy="260" r="11" fill="#D8EDEF" />
          {/* Amber Headlight */}
          <Rect x="296" y="216" width="18" height="10" rx="5" fill={colors.amber} />
        </Svg>
      </View>

      {/* Accessible Real Text Chips */}
      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipTopLeft, { transform: [{ translateY: float1 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Your vehicle"
      >
        <Text style={styles.chipTextDark}>Your vehicle</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.amberChip, styles.chipMidRight, { transform: [{ translateY: float2 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Our driver"
      >
        <Text style={styles.chipTextDark}>Our driver</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipBottomCenter, { transform: [{ translateY: float3 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Bike, Auto, Car"
      >
        <Text style={styles.chipTextDark}>Bike · Auto · Car</Text>
      </Animated.View>
    </View>
  );
};

/**
 * Slide 2: Map with pickup, drop and route line
 */
export const Slide2Panel: React.FC<PanelProps> = ({ height, reduceMotion = false }) => {
  const float1 = useFloatingOffset(reduceMotion, 0);
  const float2 = useFloatingOffset(reduceMotion, 600);
  const float3 = useFloatingOffset(reduceMotion, 1200);

  return (
    <View style={[styles.panelBase, styles.darkMapPanel, { height }]}>
      {/* Map Graphics */}
      <View style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 360 390" preserveAspectRatio="xMidYMid meet">
          {/* Grid Road Lines */}
          <Line x1="100" y1="0" x2="100" y2="390" stroke="#253548" strokeWidth="12" />
          <Line x1="260" y1="0" x2="260" y2="390" stroke="#253548" strokeWidth="16" />
          <Line x1="0" y1="120" x2="360" y2="120" stroke="#253548" strokeWidth="14" />
          <Line x1="0" y1="280" x2="360" y2="280" stroke="#253548" strokeWidth="12" />
          {/* Blue Route */}
          <Path
            d="M 80 295 L 140 225 L 218 190 L 278 88"
            fill="none"
            stroke={colors.routeBlue}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Start Point */}
          <Circle cx="80" cy="295" r="14" fill={colors.white} />
          <Circle cx="80" cy="295" r="8" fill={colors.routeBlue} />
          {/* End Point */}
          <Circle cx="278" cy="88" r="12" fill={colors.danger} />
        </Svg>
      </View>

      {/* Accessible Floating Chips */}
      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipPickup, { transform: [{ translateY: float1 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Pickup in 6 minutes"
      >
        <Text style={styles.chipTextDark}>Pickup · 6 min</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipDrop, { transform: [{ translateY: float2 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Drop in 12.4 kilometers"
      >
        <Text style={styles.chipTextDark}>Drop · 12.4 km</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.amberChip, styles.chipNavigate, { transform: [{ translateY: float3 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Navigate"
      >
        <Text style={styles.chipTextDark}>Navigate ↗</Text>
      </Animated.View>
    </View>
  );
};

/**
 * Slide 3: Shield, checkmark and security chips
 */
export const Slide3Panel: React.FC<PanelProps> = ({ height, reduceMotion = false }) => {
  const float1 = useFloatingOffset(reduceMotion, 0);
  const float2 = useFloatingOffset(reduceMotion, 0);
  const float3 = useFloatingOffset(reduceMotion, 800);

  return (
    <View style={[styles.panelBase, styles.lightPanel, { height }]}>
      {/* Shield and Rings */}
      <View style={StyleSheet.absoluteFill} accessible={false} importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 360 390" preserveAspectRatio="xMidYMid meet">
          <Circle cx="180" cy="195" r="130" fill="#BBD8DB" fillOpacity={0.65} />
          <Circle cx="180" cy="195" r="145" stroke={colors.amber} strokeWidth="3" fill="none" />
          {/* Shield */}
          <Path
            d="M 180 95 C 235 95 245 125 245 170 C 245 235 180 270 180 270 C 180 270 115 235 115 170 C 115 125 125 95 180 95 Z"
            fill={colors.darkTeal}
          />
          {/* Amber Checkmark */}
          <Path
            d="M 148 180 L 172 205 L 218 152"
            fill="none"
            stroke={colors.amber}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* Accessible Security Chips */}
      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipTopLeft, { transform: [{ translateY: float1 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Start code verified"
      >
        <Text style={styles.chipTextDark}>Start code ✓</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.whiteChip, styles.chipShieldRight, { transform: [{ translateY: float2 }] }]}
        accessibilityRole="text"
        accessibilityLabel="Vehicle check completed"
      >
        <Text style={styles.chipTextDark}>Vehicle check ✓</Text>
      </Animated.View>

      <Animated.View
        style={[styles.chip, styles.dangerChip, styles.chipSos, { transform: [{ translateY: float3 }] }]}
        accessibilityRole="text"
        accessibilityLabel="SOS 1 tap"
      >
        <Text style={styles.chipTextWhite}>SOS · 1 tap</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelBase: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPanel: {
    backgroundColor: '#ACCDD1',
  },
  darkMapPanel: {
    backgroundColor: '#1A2532',
  },
  chip: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#07383E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  whiteChip: {
    backgroundColor: colors.white,
  },
  amberChip: {
    backgroundColor: colors.amber,
  },
  dangerChip: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.35,
  },
  chipTextDark: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chipTextWhite: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  // Slide 1 Positions
  chipTopLeft: {
    top: 28,
    left: 18,
  },
  chipMidRight: {
    top: 96,
    right: 20,
  },
  chipBottomCenter: {
    bottom: 24,
  },
  // Slide 2 Positions
  chipPickup: {
    bottom: 84,
    left: 20,
  },
  chipDrop: {
    top: 28,
    right: 20,
  },
  chipNavigate: {
    bottom: 24,
    left: 88,
  },
  // Slide 3 Positions
  chipShieldRight: {
    top: 130,
    right: 18,
  },
  chipSos: {
    bottom: 24,
    left: 36,
  },
});
