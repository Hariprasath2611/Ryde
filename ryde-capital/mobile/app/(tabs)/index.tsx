// ryde-capital/mobile/app/(tabs)/index.tsx
// Home screen: Full-screen Google Map with driver marker, online/offline toggle, GPS status banner, and realtime offer listener

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../src/store/auth';
import { apiClient } from '../../src/services/api';
import { supabase } from '../../src/services/supabase';
import {
  startLocationTracking,
  stopLocationTracking,
  requestLocationPermissions,
  sendLocationUpdate,
} from '../../src/services/location';
import { OfferModal, type OfferAssignment } from '../../src/components/OfferModal';

const BANGALORE_DEFAULT = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export default function HomeScreen() {
  const { driverProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    heading: number;
  }>({
    latitude: BANGALORE_DEFAULT.latitude,
    longitude: BANGALORE_DEFAULT.longitude,
    heading: 0,
  });

  const [isOnline, setIsOnline] = useState<boolean>(
    driverProfile?.driver?.availability_status === 'online',
  );
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<'accurate' | 'weak' | 'none'>('none');
  const [currentOffer, setCurrentOffer] = useState<OfferAssignment | null>(null);

  const driverId = driverProfile?.driver?.id;

  // Poll current active offer
  const fetchActiveOffer = useCallback(async () => {
    try {
      const res = await apiClient<{ data: { activeOffer: OfferAssignment | null } }>(
        '/assignments',
      );
      if (res.data?.activeOffer) {
        setCurrentOffer(res.data.activeOffer);
      }
    } catch (_err) {
      // Ignore polling errors
    }
  }, []);

  // 1. Initial GPS positioning & continuous foreground watch
  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function initLocation() {
      const { foregroundGranted } = await requestLocationPermissions();
      if (!foregroundGranted) {
        setGpsAccuracy('none');
        return;
      }

      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!isMounted) return;

        const coords = {
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          heading: initial.coords.heading ?? 0,
        };
        setCurrentCoords(coords);
        setGpsAccuracy(initial.coords.accuracy && initial.coords.accuracy > 40 ? 'weak' : 'accurate');

        // Animate map to initial position
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });

        // Send initial telemetry ping so driver can toggle online immediately
        await sendLocationUpdate({
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading,
          speed: initial.coords.speed,
          accuracy: initial.coords.accuracy,
          recordedAt: new Date(initial.timestamp).toISOString(),
        });

        // Watch foreground location
        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (loc) => {
            if (!isMounted) return;
            setCurrentCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading ?? 0,
            });
            setGpsAccuracy(
              loc.coords.accuracy && loc.coords.accuracy > 40 ? 'weak' : 'accurate',
            );
          },
        );
      } catch (err) {
        console.warn('Location initialization notice:', err);
        if (isMounted) setGpsAccuracy('weak');
      }
    }

    initLocation();

    return () => {
      isMounted = false;
      watchSubscription?.remove();
    };
  }, []);

  // 2. Realtime CDC subscription for incoming driver assignments
  useEffect(() => {
    if (!driverId) return;

    fetchActiveOffer();

    const channel = supabase
      .channel(`driver_offers:${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_assignments',
          filter: `driver_id=eq.${driverId}`,
        },
        async (payload: { new?: { assignment_status?: string } }) => {
          if (payload.new && payload.new.assignment_status === 'offered') {
            await fetchActiveOffer();
          } else if (payload.new && payload.new.assignment_status !== 'offered') {
            setCurrentOffer(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchActiveOffer]);

  // Handle Online / Offline toggle
  const toggleAvailability = async () => {
    if (isTogglingAvailability) return;
    setIsTogglingAvailability(true);

    const nextState = !isOnline;

    try {
      // Send location update before going online to ensure freshness
      if (nextState) {
        await sendLocationUpdate({
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          heading: currentCoords.heading,
          accuracy: 10,
          recordedAt: new Date().toISOString(),
        });
      }

      const res = await apiClient<{ data: { availabilityStatus: string; isAvailable: boolean } }>(
        '/drivers/me/availability',
        {
          method: 'PUT',
          body: JSON.stringify({ isAvailable: nextState }),
        },
      );

      setIsOnline(res.data.isAvailable);

      if (res.data.isAvailable) {
        await startLocationTracking('idle');
      } else {
        await stopLocationTracking();
      }

      await refreshProfile();
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to update availability status';
      Alert.alert('Status Change Failed', msg);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const recenterMap = () => {
    mapRef.current?.animateToRegion({
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  return (
    <View style={styles.container} testID="home-screen-container">
      {/* Full Screen Google Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={BANGALORE_DEFAULT}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        <Marker
          coordinate={{
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
          }}
          title="Your Vehicle"
          anchor={{ x: 0.5, y: 0.5 }}
          testID="driver-marker"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerHalo, isOnline && styles.markerHaloOnline]} />
            <View style={[styles.markerDot, isOnline && styles.markerDotOnline]}>
              <Text style={styles.markerArrow}>▲</Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Top Status Banner */}
      <View style={styles.topOverlay}>
        <View
          style={[
            styles.statusBanner,
            isOnline ? styles.statusBannerOnline : styles.statusBannerOffline,
          ]}
          testID="status-banner"
        >
          <View style={[styles.statusDot, isOnline && styles.statusDotActive]} />
          <Text style={styles.statusText} testID="status-text">
            {isOnline ? 'Online & Searching for rides...' : 'You are offline'}
          </Text>
        </View>

        {gpsAccuracy === 'weak' && (
          <View style={styles.weakGpsBanner} testID="weak-gps-banner">
            <Text style={styles.weakGpsText}>⚠️ Weak GPS signal - Move to open area</Text>
          </View>
        )}
      </View>

      {/* Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenterMap}
        testID="recenter-button"
      >
        <Text style={styles.recenterText}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom Floating Control Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.driverInfoBox}>
          <Text style={styles.driverCode} testID="driver-code">
            {driverProfile?.driver?.driver_code || 'Ryde Partner'}
          </Text>
          <Text style={styles.ratingText}>
            ⭐ {driverProfile?.driver?.rating_avg?.toFixed(1) || '5.0'}
          </Text>
        </View>

        {/* Online / Offline Slide Toggle Button */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isOnline ? styles.toggleButtonOnline : styles.toggleButtonOffline,
          ]}
          onPress={toggleAvailability}
          disabled={isTogglingAvailability}
          testID="availability-toggle-button"
        >
          {isTogglingAvailability ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.toggleText}>
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Incoming Ride Offer Modal */}
      <OfferModal
        visible={currentOffer !== null}
        offer={currentOffer}
        onAcceptSuccess={(_tripId) => {
          setCurrentOffer(null);
          // Navigate to active trip screen
          router.push('/trip');
        }}
        onDismiss={() => setCurrentOffer(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBannerOffline: {
    backgroundColor: '#334155EE',
  },
  statusBannerOnline: {
    backgroundColor: '#065F46EE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  weakGpsBanner: {
    backgroundColor: '#78350FEE',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  weakGpsText: {
    color: '#FDE68A',
    fontWeight: '600',
    fontSize: 12,
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterText: {
    fontSize: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  driverInfoBox: {
    justifyContent: 'center',
  },
  driverCode: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 16,
  },
  ratingText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  toggleButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  toggleButtonOnline: {
    backgroundColor: '#EF4444',
  },
  toggleButtonOffline: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  markerHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F644',
  },
  markerHaloOnline: {
    backgroundColor: '#10B98144',
  },
  markerDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  markerDotOnline: {
    backgroundColor: '#10B981',
  },
  markerArrow: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
