import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme/tokens';

export interface CountdownRingProps {
  expiresAt: string | number; // ISO string or timestamp in ms
  totalSeconds?: number;
  totalDurationSeconds?: number;
  onExpire?: () => void;
  size?: number;
  strokeWidth?: number;
  testID?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = React.memo(({
  expiresAt,
  totalSeconds = 30,
  totalDurationSeconds,
  onExpire,
  size = 72,
  strokeWidth = 6,
  testID = 'countdown-ring',
}) => {
  const duration = totalDurationSeconds || totalSeconds || 30;
  const getRemainingSeconds = () => {
    const targetMs = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt;
    const now = Date.now();
    return Math.max(0, Math.ceil((targetMs - now) / 1000));
  };

  const [remaining, setRemaining] = useState<number>(getRemainingSeconds());

  useEffect(() => {
    // Initial check
    const initialRem = getRemainingSeconds();
    setRemaining(initialRem);
    if (initialRem <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const rem = getRemainingSeconds();
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, remaining / duration));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View testID={testID} style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#C8E2E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated active amber ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.amber}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.textWrapper}>
          <Text testID="countdown-seconds" style={styles.secondsText}>
            {remaining}s
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondsText: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
});

export default CountdownRing;
