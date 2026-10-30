import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shape } from '../theme/tokens';
import { RealDarkMap } from './map/RealDarkMap';

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
  const center = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
  };

  const routeCoords = [
    origin,
    {
      latitude: (origin.latitude * 2 + destination.latitude) / 3,
      longitude: origin.longitude + 0.003,
    },
    {
      latitude: (origin.latitude + destination.latitude * 2) / 3,
      longitude: destination.longitude - 0.003,
    },
    destination,
  ];

  return (
    <View
      style={[
        styles.container,
        fullScreen ? styles.fullScreen : { height },
        style,
      ]}
    >
      <RealDarkMap
        center={center}
        pickup={origin}
        drop={destination}
        routeCoordinates={routeCoords}
        showRoute={true}
        showPickup={true}
        theme="voyager"
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: shape.cardRadius,
    overflow: 'hidden',
    backgroundColor: '#F5F3ED',
  },
  fullScreen: {
    flex: 1,
    height: '100%',
    borderRadius: 0,
  },
});

export default MapViewWrapper;
