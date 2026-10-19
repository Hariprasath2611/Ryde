import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { colors, shape } from '../theme/tokens';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapViewWrapperProps {
  origin?: MapCoordinates;
  destination?: MapCoordinates;
  style?: ViewStyle;
  height?: number;
  fullScreen?: boolean;
}

export const MapViewWrapper: React.FC<MapViewWrapperProps> = memo(({
  origin = { latitude: 13.0418, longitude: 80.2341 }, // T. Nagar, Chennai
  destination = { latitude: 13.1537, longitude: 80.1989 }, // Puzhal, Chennai
  style,
  height = 300,
  fullScreen = false,
}) => {
  // Ultra-crisp, high-performance mock/fallback vector map matching 13, 14, 15, 16, 19
  // Dark grid with route blue (#3B82F6) polyline and pickup/drop markers
  return (
    <View
      style={[
        styles.container,
        fullScreen ? styles.fullScreen : { height },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
        {/* Dark map background */}
        <Path d="M0,0 L400,0 L400,300 L0,300 Z" fill={colors.map} />

        {/* Subtle grid roads */}
        <Line x1="0" y1="80" x2="400" y2="80" stroke="#233142" strokeWidth="6" />
        <Line x1="0" y1="160" x2="400" y2="160" stroke="#233142" strokeWidth="6" />
        <Line x1="0" y1="240" x2="400" y2="240" stroke="#233142" strokeWidth="6" />
        <Line x1="100" y1="0" x2="100" y2="300" stroke="#233142" strokeWidth="6" />
        <Line x1="200" y1="0" x2="200" y2="300" stroke="#233142" strokeWidth="6" />
        <Line x1="300" y1="0" x2="300" y2="300" stroke="#233142" strokeWidth="6" />

        {/* Diagonal route polyline matching the design reference PNGs */}
        <Path
          d="M 90,240 L 160,150 L 250,130 L 310,50"
          fill="none"
          stroke={colors.routeBlue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pickup marker (Blue ring with white fill) */}
        <Circle cx="90" cy="240" r="10" fill={colors.white} stroke={colors.routeBlue} strokeWidth="4" />

        {/* Drop marker (Red/Amber pin dot) */}
        <Circle cx="310" cy="50" r="8" fill={colors.danger} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: shape.cardRadius,
    overflow: 'hidden',
    backgroundColor: colors.map,
  },
  fullScreen: {
    flex: 1,
    height: '100%',
    borderRadius: 0,
  },
});

export default MapViewWrapper;
