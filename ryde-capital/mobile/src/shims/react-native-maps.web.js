const React = require('react');
const { View, Text, StyleSheet, Image } = require('react-native');

const TILE_SIZE = 256;
const CARTO_API_KEY = 'cb1_4xr2_1_b81942231c0c7d3505a25c5b';

function lon2tile(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

const MapContext = React.createContext({
  center: { latitude: 13.0418, longitude: 80.2341 },
  zoom: 14,
  dimensions: { width: 360, height: 390 },
});

// Real Bright MapView component for Web (CartoDB Voyager bright style)
const MapView = React.forwardRef(function MapView(props, ref) {
  const {
    style,
    children,
    initialRegion,
    region,
    testID = 'web-map-view',
    ...rest
  } = props;

  const [activeRegion, setActiveRegion] = React.useState(
    region || initialRegion || {
      latitude: 13.0418,
      longitude: 80.2341,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }
  );

  const [dimensions, setDimensions] = React.useState({ width: 360, height: 390 });

  // Sync region prop when it changes
  React.useEffect(() => {
    if (region && (region.latitude !== activeRegion.latitude || region.longitude !== activeRegion.longitude)) {
      setActiveRegion(region);
    }
  }, [region?.latitude, region?.longitude]);

  const handleLayout = (e) => {
    if (e && e.nativeEvent && e.nativeEvent.layout) {
      const { width, height } = e.nativeEvent.layout;
      if (width > 0 && height > 0) {
        if (Math.abs(width - dimensions.width) > 2 || Math.abs(height - dimensions.height) > 2) {
          setDimensions({ width, height });
        }
      }
    }
  };

  React.useImperativeHandle(ref, () => ({
    animateToRegion: (r, duration) => {
      if (r && r.latitude && r.longitude) {
        setActiveRegion((prev) => ({
          ...prev,
          latitude: r.latitude,
          longitude: r.longitude,
          latitudeDelta: r.latitudeDelta || prev.latitudeDelta || 0.015,
          longitudeDelta: r.longitudeDelta || prev.longitudeDelta || 0.015,
        }));
      }
    },
    animateCamera: (camera, options) => {},
    fitToElements: (options) => {},
    fitToSuppliedMarkers: (markers, options) => {},
    fitToCoordinates: (coordinates, options) => {},
    setMapBoundaries: (northEast, southWest) => {},
    setCamera: (camera) => {},
    getCamera: async () => ({}),
    getMapBoundaries: async () => ({
      northEast: { latitude: 0, longitude: 0 },
      southWest: { latitude: 0, longitude: 0 },
    }),
    pointForCoordinate: async (coord) => ({ x: 0, y: 0 }),
    coordinateForPoint: async (point) => ({ latitude: 0, longitude: 0 }),
  }));

  const zoom = 14;
  const { width, height } = dimensions;
  const centerTileX = lon2tile(activeRegion.longitude, zoom);
  const centerTileY = lat2tile(activeRegion.latitude, zoom);

  const halfW = width / 2;
  const halfH = height / 2;

  const minTx = Math.floor(centerTileX - halfW / TILE_SIZE) - 1;
  const maxTx = Math.floor(centerTileX + halfW / TILE_SIZE) + 1;
  const minTy = Math.floor(centerTileY - halfH / TILE_SIZE) - 1;
  const maxTy = Math.floor(centerTileY + halfH / TILE_SIZE) + 1;

  const tiles = [];
  const maxTileIndex = Math.pow(2, zoom) - 1;

  for (let ty = minTy; ty <= maxTy; ty++) {
    if (ty < 0 || ty > maxTileIndex) continue;
    for (let tx = minTx; tx <= maxTx; tx++) {
      const wrappedTx = ((tx % (maxTileIndex + 1)) + (maxTileIndex + 1)) % (maxTileIndex + 1);
      const sub = ['a', 'b', 'c', 'd'][(tx + ty) % 4];
      // CartoDB Voyager Bright Tiles
      const uri = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrappedTx}/${ty}@2x.png?key=${CARTO_API_KEY}`;
      const left = Math.round((tx - centerTileX) * TILE_SIZE + halfW);
      const top = Math.round((ty - centerTileY) * TILE_SIZE + halfH);
      tiles.push({ key: `${zoom}-${wrappedTx}-${ty}`, uri, left, top });
    }
  }

  return React.createElement(
    View,
    {
      style: [styles.mapContainer, style],
      onLayout: handleLayout,
      testID: testID,
      ...rest,
    },
    // Real Bright Street Tiles Layer
    React.createElement(
      View,
      { style: styles.tilesLayer, pointerEvents: 'none' },
      tiles.map((tile) =>
        React.createElement(Image, {
          key: tile.key,
          source: { uri: tile.uri },
          style: [
            styles.tileImage,
            { left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE },
          ],
          resizeMode: 'cover',
        })
      ),
      // Subtle ambient overlay
      React.createElement(View, { style: styles.vignetteOverlay }),
      // Live GPS Badge
      React.createElement(
        View,
        { style: styles.mapBadge },
        React.createElement(View, { style: styles.statusDot }),
        React.createElement(
          Text,
          { style: styles.mapBadgeText },
          `GPS Live • ${activeRegion.latitude.toFixed(4)}, ${activeRegion.longitude.toFixed(4)}`
        )
      )
    ),
    // Map Context Provider for Children (Markers, Polylines)
    React.createElement(
      MapContext.Provider,
      { value: { center: activeRegion, zoom, dimensions } },
      React.createElement(
        View,
        { style: styles.childrenContainer, pointerEvents: 'box-none' },
        children
      )
    )
  );
});

// Accurate Marker component
function Marker(props) {
  const { children, coordinate, title, description, testID = 'web-map-marker', ...rest } = props;
  const context = React.useContext(MapContext);

  let markerStyle = styles.markerWrapper;

  if (coordinate && context && context.center) {
    const { center, zoom, dimensions } = context;
    const centerTx = lon2tile(center.longitude, zoom);
    const centerTy = lat2tile(center.latitude, zoom);
    const coordTx = lon2tile(coordinate.longitude, zoom);
    const coordTy = lat2tile(coordinate.latitude, zoom);

    const x = Math.round((coordTx - centerTx) * TILE_SIZE + dimensions.width / 2);
    const y = Math.round((coordTy - centerTy) * TILE_SIZE + dimensions.height / 2);

    markerStyle = [
      styles.markerWrapper,
      {
        position: 'absolute',
        left: x,
        top: y,
        transform: [{ translateX: -18 }, { translateY: -18 }],
      },
    ];
  }

  if (children) {
    return React.createElement(
      View,
      { style: markerStyle, testID: testID, ...rest },
      children
    );
  }

  return React.createElement(
    View,
    { style: [styles.defaultMarkerPin, markerStyle], testID: testID, ...rest },
    React.createElement(Text, { style: styles.defaultMarkerIcon }, '📍'),
    title ? React.createElement(Text, { style: styles.markerTitleText }, title) : null
  );
}

// Mock Polyline component
function Polyline(props) {
  const { strokeColor = '#2563EB', strokeWidth = 4, testID = 'web-map-polyline' } = props;
  return React.createElement(
    View,
    { style: styles.polylineContainer, testID: testID, pointerEvents: 'none' },
    React.createElement(View, {
      style: [styles.routeLineIndicator, { backgroundColor: strokeColor, height: strokeWidth }]
    })
  );
}

// Mock Circle
function Circle() {
  return null;
}

// Mock Polygon
function Polygon() {
  return null;
}

// Mock Callout
function Callout(props) {
  return React.createElement(View, { style: styles.calloutBox }, props.children);
}

// Mock Overlay
function Overlay() {
  return null;
}

// Mock AnimatedRegion
class AnimatedRegion {
  constructor(value) {
    this.latitude = value?.latitude || 0;
    this.longitude = value?.longitude || 0;
    this.latitudeDelta = value?.latitudeDelta || 0;
    this.longitudeDelta = value?.longitudeDelta || 0;
  }
  setValue(val) {
    Object.assign(this, val);
  }
  timing() {
    return {
      start: (cb) => {
        if (cb) cb({ finished: true });
      },
    };
  }
}

const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = 'default';

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#F5F3ED', // CartoDB Voyager bright base
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  tilesLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F3ED',
    overflow: 'hidden',
  },
  tileImage: {
    position: 'absolute',
    backgroundColor: '#F5F3ED',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  mapBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  mapBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  defaultMarkerPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultMarkerIcon: {
    fontSize: 24,
  },
  markerTitleText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#FFFFFFEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  polylineContainer: {
    position: 'absolute',
    width: '60%',
    alignItems: 'center',
    zIndex: 5,
  },
  routeLineIndicator: {
    width: '100%',
    borderRadius: 2,
    opacity: 0.9,
  },
  calloutBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

module.exports = MapView;
module.exports.default = MapView;
module.exports.MapView = MapView;
module.exports.Marker = Marker;
module.exports.MapMarker = Marker;
module.exports.Polyline = Polyline;
module.exports.MapPolyline = Polyline;
module.exports.Circle = Circle;
module.exports.MapCircle = Circle;
module.exports.Polygon = Polygon;
module.exports.MapPolygon = Polygon;
module.exports.Callout = Callout;
module.exports.MapCallout = Callout;
module.exports.Overlay = Overlay;
module.exports.MapOverlay = Overlay;
module.exports.AnimatedRegion = AnimatedRegion;
module.exports.PROVIDER_GOOGLE = PROVIDER_GOOGLE;
module.exports.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
Object.defineProperty(module.exports, '__esModule', { value: true });
