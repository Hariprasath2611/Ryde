const React = require('react');
const { View, Text, StyleSheet } = require('react-native');

// Mock MapView component for Web
const MapView = React.forwardRef(function MapView(props, ref) {
  const {
    style,
    children,
    initialRegion,
    region,
    testID = 'web-map-view',
    ...rest
  } = props;

  React.useImperativeHandle(ref, () => ({
    animateToRegion: (r, duration) => {},
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

  return React.createElement(
    View,
    {
      style: [styles.mapContainer, style],
      testID: testID,
      ...rest,
    },
    // Stylized Dark Map Grid Background
    React.createElement(
      View,
      { style: styles.gridOverlay, pointerEvents: 'none' },
      React.createElement(View, { style: [styles.roadLine, styles.roadH1] }),
      React.createElement(View, { style: [styles.roadLine, styles.roadH2] }),
      React.createElement(View, { style: [styles.roadLine, styles.roadH3] }),
      React.createElement(View, { style: [styles.roadLine, styles.roadV1] }),
      React.createElement(View, { style: [styles.roadLine, styles.roadV2] }),
      React.createElement(View, { style: [styles.roadLine, styles.roadV3] }),
      React.createElement(
        View,
        { style: styles.mapBadge },
        React.createElement(
          Text,
          { style: styles.mapBadgeText },
          '🗺️ Bengaluru Central • GPS Live'
        )
      )
    ),
    // Map Children (Markers, Polylines, etc.)
    React.createElement(
      View,
      { style: styles.childrenContainer },
      children
    )
  );
});

// Mock Marker component
function Marker(props) {
  const { children, coordinate, title, description, testID = 'web-map-marker', ...rest } = props;

  if (children) {
    return React.createElement(
      View,
      { style: styles.markerWrapper, testID: testID, ...rest },
      children
    );
  }

  return React.createElement(
    View,
    { style: styles.defaultMarkerPin, testID: testID, ...rest },
    React.createElement(Text, { style: styles.defaultMarkerIcon }, '📍'),
    title ? React.createElement(Text, { style: styles.markerTitleText }, title) : null
  );
}

// Mock Polyline component
function Polyline(props) {
  const { strokeColor = '#10B981', strokeWidth = 3, testID = 'web-map-polyline' } = props;
  return React.createElement(
    View,
    { style: styles.polylineContainer, testID: testID },
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
    backgroundColor: '#0A111E',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  roadLine: {
    position: 'absolute',
    backgroundColor: '#1E293B',
  },
  roadH1: {
    left: 0,
    right: 0,
    top: '25%',
    height: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  roadH2: {
    left: 0,
    right: 0,
    top: '55%',
    height: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  roadH3: {
    left: 0,
    right: 0,
    top: '80%',
    height: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  roadV1: {
    top: 0,
    bottom: 0,
    left: '20%',
    width: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  roadV2: {
    top: 0,
    bottom: 0,
    left: '50%',
    width: 14,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  roadV3: {
    top: 0,
    bottom: 0,
    left: '75%',
    width: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  mapBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#00000088',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  mapBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultMarkerPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultMarkerIcon: {
    fontSize: 24,
  },
  markerTitleText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#0F172AEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  polylineContainer: {
    position: 'absolute',
    width: '60%',
    alignItems: 'center',
  },
  routeLineIndicator: {
    width: '100%',
    borderRadius: 2,
    opacity: 0.8,
  },
  calloutBox: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
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
