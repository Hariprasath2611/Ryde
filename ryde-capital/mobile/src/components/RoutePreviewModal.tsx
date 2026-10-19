// ryde-capital/mobile/src/components/RoutePreviewModal.tsx
// Full-screen in-app route preview modal with MapView, route polyline, and live countdown

import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiClient } from '../services/api';
import { decodePolyline, type Coordinate } from '../utils/polyline';

interface RoutePreviewModalProps {
  visible: boolean;
  assignmentId: string;
  expiresAt: string;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

interface RouteDetails {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  pickupAddress: string;
  destinationAddress: string;
  pickupCoords: Coordinate;
  destinationCoords: Coordinate;
}

export function RoutePreviewModal({
  visible,
  assignmentId,
  expiresAt,
  onClose,
  onAccept,
  onReject,
}: RoutePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteDetails | null>(null);

  const [coords, setCoords] = useState<Coordinate[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  });

  const mapRef = useRef<MapView>(null);

  // Sync live countdown to expires_at
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt, onClose]);

  // Fetch route details on open
  useEffect(() => {
    if (!visible || !assignmentId) return;

    let isMounted = true;
    setLoading(true);

    apiClient<{ data: RouteDetails }>(`/assignments/${assignmentId}/route`)
      .then((res) => {
        if (!isMounted) return;
        setRouteData(res.data);
        const decoded = decodePolyline(res.data.polyline);
        setCoords(decoded);
        setLoading(false);

        // Fit map bounds to show route
        if (decoded.length > 0 && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [res.data.pickupCoords, res.data.destinationCoords],
              {
                edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
                animated: true,
              },
            );
          }, 300);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch route preview:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, assignmentId]);

  if (!visible) return null;

  const distanceKm = routeData ? (routeData.distanceMeters / 1000).toFixed(1) : '--';
  const durationMins = routeData ? Math.round(routeData.durationSeconds / 60) : '--';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="close-route-preview"
          >
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>

          <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerDanger]}>
            <Text style={styles.timerText}>⏳ {timeLeft}s remaining</Text>
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Fetching route polyline...</Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: routeData?.pickupCoords.latitude ?? 12.9716,
                longitude: routeData?.pickupCoords.longitude ?? 77.5946,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
            >
              {routeData && (
                <>
                  <Marker
                    coordinate={routeData.pickupCoords}
                    title="Pickup"
                    description={routeData.pickupAddress}
                    pinColor="#10B981"
                  />
                  <Marker
                    coordinate={routeData.destinationCoords}
                    title="Destination"
                    description={routeData.destinationAddress}
                    pinColor="#EF4444"
                  />
                  {coords.length > 0 && (
                    <Polyline
                      coordinates={coords}
                      strokeColor="#3B82F6"
                      strokeWidth={5}
                      lineDashPattern={[0]}
                    />
                  )}
                </>
              )}
            </MapView>
          )}
        </View>

        {/* Bottom Details Card */}
        <View style={styles.bottomCard}>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Trip Distance</Text>
              <Text style={styles.statValue}>{distanceKm} km</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Est. Duration</Text>
              <Text style={styles.statValue}>{durationMins} mins</Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>🟢 Pickup:</Text>
            <Text style={styles.addressValue} numberOfLines={1}>
              {routeData?.pickupAddress || 'Locating pickup...'}
            </Text>
            <Text style={styles.addressLabel}>🔴 Dropoff:</Text>
            <Text style={styles.addressValue} numberOfLines={1}>
              {routeData?.destinationAddress || 'Locating dropoff...'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => {
                onClose();
                onReject();
              }}
              testID="preview-reject-button"
            >
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                onClose();
                onAccept();
              }}
              testID="preview-accept-button"
            >
              <Text style={styles.acceptText}>Accept Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    zIndex: 10,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  closeText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  timerBadge: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  timerDanger: {
    backgroundColor: '#EF4444',
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  bottomCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  addressLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  addressValue: {
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF444422',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
