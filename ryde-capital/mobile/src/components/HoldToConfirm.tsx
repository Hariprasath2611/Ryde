import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '../theme/tokens';

export interface HoldToConfirmProps {
  onConfirm: () => void;
  holdDurationMs?: number; // default 3000ms
  size?: number;
  label?: string;
  style?: ViewStyle;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const HoldToConfirm: React.FC<HoldToConfirmProps> = ({
  onConfirm,
  holdDurationMs = 3000,
  size = 200,
  label = 'SOS',
  style,
}) => {
  const [holding, setHolding] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Track progress value for strokeDashoffset
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setDashOffset(circumference * (1 - value));
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [circumference, progressAnim]);

  const handlePressIn = () => {
    setHolding(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: holdDurationMs,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setHolding(false);
      onConfirm();
    }, holdDurationMs);
  };

  const handlePressOut = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    progressAnim.stopAnimation();
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Hold for 3 seconds to trigger emergency alert.`}
      >
        <View style={[styles.buttonWrapper, { width: size, height: size }]}>
          {/* Progress Ring Svg */}
          <Svg width={size} height={size} style={styles.svg}>
            {/* Background ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#D8A5A1"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Sweeping progress ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.amber}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Inner SOS Red Circle */}
          <View
            style={[
              styles.innerCircle,
              {
                width: size - strokeWidth * 2 - 8,
                height: size - strokeWidth * 2 - 8,
                borderRadius: (size - strokeWidth * 2 - 8) / 2,
              },
            ]}
          >
            <Text style={styles.labelText}>{label}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerCircle: {
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  labelText: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: typography.fontWeight.extraBold,
    color: colors.white,
    letterSpacing: 2,
  },
});

export default HoldToConfirm;
