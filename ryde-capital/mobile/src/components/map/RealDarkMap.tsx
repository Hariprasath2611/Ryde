import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Platform,
  LayoutChangeEvent,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Polyline as SvgPolyline,
  Rect,
} from 'react-native-svg';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const DEFAULT_CARTO_KEY = 'cb1_4xr2_1_b81942231c0c7d3505a25c5b';

export interface RealDarkMapProps {
  center?: LatLng;
  zoom?: number;
  pickup?: LatLng;
  drop?: LatLng;
  routeCoordinates?: LatLng[];
  showRoute?: boolean;
  showPickup?: boolean;
  showDrop?: boolean;
  showDriver?: boolean;
  driverHeading?: number; // degrees (e.g. 45)
  statusText?: string;
  theme?: 'dark' | 'voyager';
  apiKey?: string;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  testID?: string;
}

/**
 * Web Mercator Projection Formulas
 * Converts (lat, lon, zoom) to tile indices and pixel positions
 */
function lon2tile(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

// Default Chennai Navigation Waypoints (Saidapet -> Anna Salai -> Nandanam -> T. Nagar)
const DEFAULT_CENTER: LatLng = { latitude: 13.0380, longitude: 80.2320 };
const DEFAULT_PICKUP: LatLng = { latitude: 13.03006, longitude: 80.22307 };
const DEFAULT_DROP: LatLng = { latitude: 13.0472, longitude: 80.24058 };
const DEFAULT_ROUTE: LatLng[] = [
  { latitude: 13.03006, longitude: 80.22307 }, // Saidapet / Anna Salai
  { latitude: 13.03591, longitude: 80.22857 }, // Nandanam Signal
  { latitude: 13.03884, longitude: 80.23543 }, // Panagal Park / T. Nagar
  { latitude: 13.04720, longitude: 80.24058 }, // GN Chetty Rd / Nungambakkam
];

const TILE_SIZE = 256;

export const RealDarkMap: React.FC<RealDarkMapProps> = ({
  center = DEFAULT_CENTER,
  zoom = 14,
  pickup = DEFAULT_PICKUP,
  drop = DEFAULT_DROP,
  routeCoordinates = DEFAULT_ROUTE,
  showRoute = true,
  showPickup = true,
  showDrop = true,
  showDriver = true,
  driverHeading = 42,
  statusText = 'GPS Live • Anna Salai, Chennai',
  theme = 'dark',
  apiKey = DEFAULT_CARTO_KEY,
  style,
  testID = 'real-dark-map',
}) => {
  // Container dimensions
  const [dimensions, setDimensions] = useState({ width: 360, height: 390 });
  const isTest = process.env.NODE_ENV === 'test';

  // Radar Pulse Animation for Pickup
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Vehicle Floating Animation
  const driverFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTest) return;

    // Animated radar ripples
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: Platform.OS !== 'web',
      })
    );

    // Subtle vehicle hover
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(driverFloatAnim, {
          toValue: -3,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(driverFloatAnim, {
          toValue: 2,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [pulseAnim, driverFloatAnim, isTest]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (Math.abs(width - dimensions.width) > 2 || Math.abs(height - dimensions.height) > 2) {
        setDimensions({ width, height });
      }
    }
  };

  const { width, height } = dimensions;

  // Calculate center tile coordinates
  const centerTileX = lon2tile(center.longitude, zoom);
  const centerTileY = lat2tile(center.latitude, zoom);

  // Map arbitrary LatLng to Viewport (x, y) pixels
  const toPixel = useMemo(() => {
    return (coord: LatLng) => {
      const tx = lon2tile(coord.longitude, zoom);
      const ty = lat2tile(coord.latitude, zoom);
      return {
        x: Math.round((tx - centerTileX) * TILE_SIZE + width / 2),
        y: Math.round((ty - centerTileY) * TILE_SIZE + height / 2),
      };
    };
  }, [centerTileX, centerTileY, zoom, width, height]);

  // Compute bounding box tiles needed to fill the viewport
  const tiles = useMemo(() => {
    const halfW = width / 2;
    const halfH = height / 2;

    const minTx = Math.floor(centerTileX - halfW / TILE_SIZE) - 1;
    const maxTx = Math.floor(centerTileX + halfW / TILE_SIZE) + 1;
    const minTy = Math.floor(centerTileY - halfH / TILE_SIZE) - 1;
    const maxTy = Math.floor(centerTileY + halfH / TILE_SIZE) + 1;

    const result = [];
    const maxTileIndex = Math.pow(2, zoom) - 1;

    for (let ty = minTy; ty <= maxTy; ty++) {
      if (ty < 0 || ty > maxTileIndex) continue;
      for (let tx = minTx; tx <= maxTx; tx++) {
        // Wrap longitude tiles across 180 meridian
        const wrappedTx = ((tx % (maxTileIndex + 1)) + (maxTileIndex + 1)) % (maxTileIndex + 1);

        const left = Math.round((tx - centerTileX) * TILE_SIZE + halfW);
        const top = Math.round((ty - centerTileY) * TILE_SIZE + halfH);

        // CartoDB High-Res Retina Tiles using user's licensed API Key
        const subdomains = ['a', 'b', 'c', 'd'];
        const sub = subdomains[(tx + ty) % 4];
        const stylePath = theme === 'voyager' ? 'voyager' : 'dark_all';
        const uri = apiKey
          ? `https://${sub}.basemaps.cartocdn.com/rastertiles/${stylePath}/${zoom}/${wrappedTx}/${ty}@2x.png?key=${apiKey}`
          : `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${ty}/${wrappedTx}`;

        result.push({
          key: `${zoom}-${wrappedTx}-${ty}`,
          uri,
          left,
          top,
        });
      }
    }
    return result;
  }, [centerTileX, centerTileY, zoom, width, height, theme, apiKey]);

  // Project route points to SVG coordinate path
  const routePoints = useMemo(() => {
    return routeCoordinates.map(toPixel);
  }, [routeCoordinates, toPixel]);

  const svgPathD = useMemo(() => {
    if (routePoints.length < 2) return '';
    return routePoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [routePoints]);

  const pickupPos = useMemo(() => toPixel(pickup), [toPixel, pickup]);
  const dropPos = useMemo(() => toPixel(drop), [toPixel, drop]);

  // Driver vehicle position: midpoint of route
  const driverPos = useMemo(() => {
    if (routePoints.length >= 3) {
      // Station on the second waypoint or midpoint
      const p1 = routePoints[1];
      const p2 = routePoints[2];
      return {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2),
      };
    }
    return {
      x: Math.round((pickupPos.x + dropPos.x) / 2),
      y: Math.round((pickupPos.y + dropPos.y) / 2),
    };
  }, [routePoints, pickupPos, dropPos]);

  // Interpolated animation values for radar wave
  const radarScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });

  const radarOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.8, 0.4, 0],
  });

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      testID={testID}
      accessible={false}
      aria-hidden={true}
    >
      {/* 1. Real Dark Navigation Street Map Tiles Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            style={[
              styles.tileImage,
              {
                left: tile.left,
                top: tile.top,
                width: TILE_SIZE,
                height: TILE_SIZE,
              },
            ]}
            resizeMode="cover"
          />
        ))}

        {/* Ambient Dark Mode Vignette & Grid Tone */}
        <View style={styles.vignetteOverlay} />
      </View>

      {/* 2. Real GPS Navigation Route & Vector Overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            {/* Glowing cyan/blue navigation gradient */}
            <LinearGradient id="routeGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#2563EB" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="haloGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.25" />
            </LinearGradient>
          </Defs>

          {/* Glowing Route Halo (Outer illumination) */}
          {showRoute && svgPathD ? (
            <>
              <Path
                d={svgPathD}
                fill="none"
                stroke="url(#haloGlow)"
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core Solid Navigation Track */}
              <Path
                d={svgPathD}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Inner High-contrast Guide Line */}
              <Path
                d={svgPathD}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeDasharray="6, 8"
                strokeOpacity={0.65}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {/* Pickup Static Base Ring */}
          {showPickup ? (
            <G transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
              <Circle cx={0} cy={0} r={14} fill="#10B981" fillOpacity={0.25} />
              <Circle cx={0} cy={0} r={9} fill="#FFFFFF" />
              <Circle cx={0} cy={0} r={5} fill="#10B981" />
            </G>
          ) : null}

          {/* Drop Destination Pin (Crimson Red with white inner core) */}
          {showDrop ? (
            <G transform={`translate(${dropPos.x}, ${dropPos.y})`}>
              {/* Drop Shadow */}
              <Circle cx={1} cy={3} r={11} fill="#000000" fillOpacity={0.5} />
              {/* Red Beacon */}
              <Circle cx={0} cy={0} r={10} fill="#EF4444" />
              <Circle cx={0} cy={0} r={4} fill="#FFFFFF" />
            </G>
          ) : null}
        </Svg>
      </View>

      {/* 3. Animated Radar Wave on Pickup (Ola / Rapido Style Pulsing Beacon) */}
      {showPickup && !isTest ? (
        <Animated.View
          style={[
            styles.radarWave,
            {
              left: pickupPos.x - 20,
              top: pickupPos.y - 20,
              transform: [{ scale: radarScale }],
              opacity: radarOpacity,
            },
          ]}
          pointerEvents="none"
        />
      ) : null}

      {/* 4. Ola / Rapido Live Driver Vehicle Marker */}
      {showDriver ? (
        <Animated.View
          style={[
            styles.driverMarkerContainer,
            {
              left: driverPos.x - 18,
              top: driverPos.y - 18,
              transform: [
                { translateY: isTest ? 0 : driverFloatAnim },
                { rotate: `${driverHeading}deg` },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {/* Driver Vehicle Aura */}
          <View style={styles.driverAura} />
          {/* Rapido / Ola Auto-Bike Icon */}
          <View style={styles.driverIconBox}>
            <Text style={styles.driverIconText}>🛺</Text>
          </View>
          {/* Directional Heading Cone */}
          <View style={styles.headingIndicator} />
        </Animated.View>
      ) : null}

      {/* 5. Live Navigation Status Badge (Top-Left) */}
      {statusText ? (
        <View style={styles.statusBadge} pointerEvents="none">
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}

      {/* 6. Compass / North Indicator (Top-Right) */}
      <View style={styles.compassBadge} pointerEvents="none">
        <Text style={styles.compassText}>🧭 N</Text>
      </View>

      {/* 7. Live Speed / Traffic Pill (Bottom-Left) */}
      <View style={styles.trafficPill} pointerEvents="none">
        <Text style={styles.trafficSpeed}>38</Text>
        <Text style={styles.trafficUnit}>km/h</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A111E', // Dark navigation base
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  tileImage: {
    position: 'absolute',
    backgroundColor: '#0B111E',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 17, 30, 0.18)',
  },
  radarWave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  driverMarkerContainer: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAura: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  driverIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverIconText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  headingIndicator: {
    position: 'absolute',
    top: -3,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F59E0B',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(8px)' as any,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  compassBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compassText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  trafficPill: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  trafficSpeed: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
  },
  trafficUnit: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
  },
});

export default RealDarkMap;
