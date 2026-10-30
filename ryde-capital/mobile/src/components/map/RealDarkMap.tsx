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
  showDrop = false,
  theme = 'voyager',
  apiKey = DEFAULT_CARTO_KEY,
  style,
  testID = 'real-dark-map',
}) => {
  // Container dimensions
  const [dimensions, setDimensions] = useState({ width: 360, height: 390 });
  const isTest = process.env.NODE_ENV === 'test';

  // Radar Pulse Animation for Pickup
  const pulseAnim = useRef(new Animated.Value(0)).current;

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

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim, isTest]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (Math.abs(width - dimensions.width) > 2 || Math.abs(height - dimensions.height) > 2) {
        setDimensions({ width, height });
      }
    }
  };

  const { width, height } = dimensions;

  // Auto-fit center and zoom so the entire route fits neatly inside container
  const { effectiveCenter, effectiveZoom } = useMemo(() => {
    const points = (routeCoordinates && routeCoordinates.length >= 2)
      ? routeCoordinates
      : [pickup, drop].filter(Boolean);

    if (points.length < 2) {
      return { effectiveCenter: center, effectiveZoom: zoom };
    }

    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLon = points[0].longitude;
    let maxLon = points[0].longitude;

    points.forEach((pt) => {
      if (pt.latitude < minLat) minLat = pt.latitude;
      if (pt.latitude > maxLat) maxLat = pt.latitude;
      if (pt.longitude < minLon) minLon = pt.longitude;
      if (pt.longitude > maxLon) maxLon = pt.longitude;
    });

    const cLat = (minLat + maxLat) / 2;
    const cLon = (minLon + maxLon) / 2;

    const latDelta = Math.max(0.005, (maxLat - minLat) * 1.6);
    const lonDelta = Math.max(0.005, (maxLon - minLon) * 1.6);
    const maxDelta = Math.max(latDelta, lonDelta);

    const span = Math.min(width, height);
    const calculatedZoom = Math.floor(Math.log2((360 / maxDelta) * (span / TILE_SIZE)));
    const finalZoom = Math.max(10, Math.min(16, calculatedZoom));

    return {
      effectiveCenter: { latitude: cLat, longitude: cLon },
      effectiveZoom: finalZoom,
    };
  }, [routeCoordinates, pickup, drop, width, height, center, zoom]);

  // Calculate center tile coordinates
  const centerTileX = lon2tile(effectiveCenter.longitude, effectiveZoom);
  const centerTileY = lat2tile(effectiveCenter.latitude, effectiveZoom);

  // Map arbitrary LatLng to Viewport (x, y) pixels
  const toPixel = useMemo(() => {
    return (coord: LatLng) => {
      const tx = lon2tile(coord.longitude, effectiveZoom);
      const ty = lat2tile(coord.latitude, effectiveZoom);
      return {
        x: Math.round((tx - centerTileX) * TILE_SIZE + width / 2),
        y: Math.round((ty - centerTileY) * TILE_SIZE + height / 2),
      };
    };
  }, [centerTileX, centerTileY, effectiveZoom, width, height]);

  // Compute bounding box tiles needed to fill the viewport
  const tiles = useMemo(() => {
    const halfW = width / 2;
    const halfH = height / 2;

    const minTx = Math.floor(centerTileX - halfW / TILE_SIZE) - 1;
    const maxTx = Math.floor(centerTileX + halfW / TILE_SIZE) + 1;
    const minTy = Math.floor(centerTileY - halfH / TILE_SIZE) - 1;
    const maxTy = Math.floor(centerTileY + halfH / TILE_SIZE) + 1;

    const result = [];
    const maxTileIndex = Math.pow(2, effectiveZoom) - 1;

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
          ? `https://${sub}.basemaps.cartocdn.com/rastertiles/${stylePath}/${effectiveZoom}/${wrappedTx}/${ty}@2x.png?key=${apiKey}`
          : `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${effectiveZoom}/${ty}/${wrappedTx}`;

        result.push({
          key: `${effectiveZoom}-${wrappedTx}-${ty}`,
          uri,
          left,
          top,
        });
      }
    }
    return result;
  }, [centerTileX, centerTileY, effectiveZoom, width, height, theme, apiKey]);

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
  const dropPos = useMemo(() => (drop ? toPixel(drop) : null), [toPixel, drop]);

  // Interpolated animation values for radar wave
  const radarScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });

  const radarOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.8, 0.4, 0],
  });

  const isBright = theme === 'voyager';

  return (
    <View
      style={[styles.container, isBright && styles.brightContainer, style]}
      onLayout={handleLayout}
      testID={testID}
      accessible={false}
      aria-hidden={true}
    >
      {/* 1. Real Bright/Dark Navigation Street Map Tiles Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            style={[
              styles.tileImage,
              isBright && styles.brightTileImage,
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

        {/* Ambient Map Vignette */}
        <View style={isBright ? styles.brightVignette : styles.vignetteOverlay} />
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
              <Stop offset="0%" stopColor="#00E5FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity={0.25} />
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

          {/* Destination Drop Pin */}
          {showDrop && dropPos ? (
            <G transform={`translate(${dropPos.x}, ${dropPos.y})`}>
              <Circle cx={0} cy={0} r={14} fill="#EF4444" fillOpacity={0.25} />
              <Circle cx={0} cy={0} r={9} fill="#FFFFFF" />
              <Circle cx={0} cy={0} r={5} fill="#EF4444" />
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
  brightContainer: {
    backgroundColor: '#F5F3ED', // CartoDB Voyager bright base
  },
  tileImage: {
    position: 'absolute',
    backgroundColor: '#0B111E',
  },
  brightTileImage: {
    backgroundColor: '#F5F3ED',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 17, 30, 0.18)',
  },
  brightVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
});

export default RealDarkMap;
