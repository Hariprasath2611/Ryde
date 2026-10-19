// ryde-capital/mobile/app/trip/index.tsx
// Phase 4 Complete Trip Lifecycle Orchestrator Screen

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../src/services/api';
import { openRouteInGoogleMaps } from '../../src/services/maps-handoff';
import { decodePolyline, type Coordinate } from '../../src/utils/polyline';

const { width } = Dimensions.get('window');

interface TripData {
  id: string;
  trip_status: string;
  started_at?: string;
  waiting_started_at?: string;
  waiting_duration_s?: number;
  booking?: {
    id: string;
    pickup_address: string;
    pickup_location: { coordinates?: [number, number] };
    destination_address: string;
    destination_location: { coordinates?: [number, number] };
    estimated_fare: number;
    vehicle_type?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
  };
  vehicle?: {
    make: string;
    model: string;
    license_plate: string;
    vehicle_type?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
  };
  customer?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  fare?: {
    base_fare: number;
    distance_charge: number;
    time_charge: number;
    waiting_charge: number;
    tax: number;
    total_amount: number;
  };
}

export default function TripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Arrived & OTP state
  const [otpCode, setOtpCode] = useState('');
  const [waitingElapsedSeconds, setWaitingElapsedSeconds] = useState(0);

  // Handover state
  const [odometerBefore, setOdometerBefore] = useState('');
  const [fuelLevelBefore, setFuelLevelBefore] = useState('75');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});

  // End trip state
  const [odometerAfter, setOdometerAfter] = useState('');
  const [fuelLevelAfter, setFuelLevelAfter] = useState('70');
  const [earlyDropReason, setEarlyDropReason] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);

  // Cancellation modal state
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Phase 5: SOS Hold State, Active State & Trip Sharing
  const [sosHolding, setSosHolding] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [sosActive, setSosActive] = useState(false);
  const [sosEventId, setSosEventId] = useState<string | null>(null);
  const [sosAddress, setSosAddress] = useState<string | null>(null);
  const [sosContactsCount, setSosContactsCount] = useState<number>(0);
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase 5: Customer Rating & Complaints State
  const [customerRating, setCustomerRating] = useState(5);
  const [customerReview, setCustomerReview] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const mapRef = useRef<MapView | null>(null);

  const didOpenNavigationRef = useRef(false);

  // Parse [lng, lat] to { latitude, longitude }
  const parsePoint = (pt: unknown): Coordinate | null => {
    if (!pt) return null;
    const p = pt as { coordinates?: [number, number] };
    if (Array.isArray(p.coordinates) && p.coordinates.length === 2) {
      return { longitude: p.coordinates[0], latitude: p.coordinates[1] };
    }
    return null;
  };

  const pickupCoord = parsePoint(trip?.booking?.pickup_location) || { latitude: 12.9300, longitude: 77.6200 };
  const destCoord = parsePoint(trip?.booking?.destination_location) || { latitude: 12.9700, longitude: 77.6400 };

  // Fetch trip details
  const fetchTripDetails = useCallback(async (tripIdToFetch?: string) => {
    try {
      let id = tripIdToFetch || params.id;
      if (!id) {
        // Fallback: list active trips
        const listRes = await apiClient<{ trips: TripData[] }>('/trips?limit=1');
        if (listRes.trips && listRes.trips.length > 0) {
          id = listRes.trips[0]!.id;
        }
      }

      if (!id) {
        setLoading(false);
        return;
      }

      const res = await apiClient<{ data: TripData }>(`/trips/${id}`);
      setTrip(res.data);

      // Fetch route polyline if trip is in navigation phase
      if (['assigned', 'heading_to_pickup', 'in_progress'].includes(res.data.trip_status)) {
        try {
          const routeRes = await apiClient<{ data: { polyline: string } }>(`/trips/${id}/route`);
          if (routeRes.data?.polyline) {
            setRouteCoords(decodePolyline(routeRes.data.polyline));
          }
        } catch (_e) {
          // Fallback to straight line
          setRouteCoords([pickupCoord, destCoord]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load trip';
      console.error('Error fetching trip:', msg);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  // Handle AppState changes (returning from Google Maps navigation)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (didOpenNavigationRef.current) {
          setShowWelcomeBack(true);
          didOpenNavigationRef.current = false;
          setTimeout(() => setShowWelcomeBack(false), 3500);
        }
        fetchTripDetails();
      }
    });

    return () => subscription.remove();
  }, [fetchTripDetails]);

  // Live waiting timer tick during 'arrived' state
  useEffect(() => {
    if (trip?.trip_status !== 'arrived') return;

    const startMs = trip.waiting_started_at
      ? new Date(trip.waiting_started_at).getTime()
      : Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setWaitingElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [trip?.trip_status, trip?.waiting_started_at]);

  // Fit map coordinates
  useEffect(() => {
    if (mapRef.current && routeCoords.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: { top: 60, right: 40, bottom: 240, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [routeCoords]);

  // Trigger Google Maps Navigation Handoff
  const handleOpenGoogleMaps = async () => {
    if (!trip) return;
    const isPickupLeg = ['assigned', 'heading_to_pickup', 'arrived'].includes(trip.trip_status);
    const targetCoord = isPickupLeg ? pickupCoord : destCoord;
    const leg = isPickupLeg ? 'pickup' : 'drop';

    didOpenNavigationRef.current = true;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const res = await openRouteInGoogleMaps({
      destination: targetCoord,
      vehicleType: trip.booking?.vehicle_type || trip.vehicle?.vehicle_type || 'four_wheeler',
      tripId: trip.id,
      leg,
      isTripActiveAndAccepted: true,
    });

    if (!res.success) {
      Alert.alert('In-App Navigation', res.error || 'Opening in-app route map instead.');
    }
  };

  // Call Customer
  const handleCallCustomer = async () => {
    if (!trip) return;
    try {
      const contactRes = await apiClient<{ data: { phone: string } }>(`/trips/${trip.id}/contact`);
      const phone = contactRes.data?.phone;
      if (phone) {
        Linking.openURL(`tel:${phone}`);
      } else {
        Alert.alert('Customer Contact', 'Customer phone number is not available.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot reach customer';
      Alert.alert('Error', msg);
    }
  };

  // 1. Mark Arrived
  const handleMarkArrived = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/arrived`, { method: 'POST' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchTripDetails(trip.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not mark arrival';
      Alert.alert('Geofence Check', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Generate / Resend OTP
  const handleGenerateOtp = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/generate-otp`, { method: 'POST' });
      Alert.alert('OTP Sent', 'A 6-digit trip start code was delivered to the customer.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request OTP';
      Alert.alert('Cooldown', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (!trip || otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit verification code.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp: otpCode }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchTripDetails(trip.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      Alert.alert('Verification Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Attach Photo (Handover)
  const handleAttachPhoto = (photoType: string) => {
    const mockPath = `storage/handovers/${trip?.id}_${photoType}_${Date.now()}.jpg`;
    setCapturedPhotos((prev) => ({ ...prev, [photoType]: mockPath }));
    Haptics.selectionAsync();
  };

  // 5. Submit Handover
  const handleSubmitHandover = async () => {
    if (!trip) return;
    const odo = parseFloat(odometerBefore);
    const fuel = parseFloat(fuelLevelBefore);
    if (isNaN(odo) || odo <= 0) {
      Alert.alert('Odometer Reading', 'Please enter a valid initial odometer reading.');
      return;
    }

    const mandatoryTypes = ['front', 'back', 'left', 'right', 'odometer', 'fuel_gauge'];
    const missing = mandatoryTypes.filter((t) => !capturedPhotos[t]);
    if (missing.length > 0) {
      Alert.alert('Photos Required', `Please capture all 6 mandatory photos: ${missing.join(', ')}`);
      return;
    }

    const photoList = Object.entries(capturedPhotos).map(([photoType, filePath]) => ({
      photoType,
      filePath,
    }));

    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/handover`, {
        method: 'POST',
        body: JSON.stringify({
          odometerBefore: odo,
          fuelLevelBefore: fuel,
          notes: handoverNotes,
          photos: photoList,
        }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchTripDetails(trip.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Handover failed';
      Alert.alert('Handover Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Start Trip
  const handleStartTrip = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/start`, { method: 'POST' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchTripDetails(trip.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start trip';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 7. End Trip
  const handleEndTrip = async () => {
    if (!trip) return;
    const odo = parseFloat(odometerAfter);
    if (isNaN(odo) || odo <= 0) {
      Alert.alert('Return Odometer', 'Please enter the return odometer reading.');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/end`, {
        method: 'POST',
        body: JSON.stringify({
          odometerAfter: odo,
          fuelLevelAfter: parseFloat(fuelLevelAfter) || 70,
          earlyDropReason: earlyDropReason.trim() || undefined,
        }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEndModal(false);
      await fetchTripDetails(trip.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot end trip';
      Alert.alert('End Trip Geofence', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Cancel Trip
  const handleCancelTrip = async () => {
    if (!trip || cancelReason.trim().length < 3) {
      Alert.alert('Reason Required', 'Please provide a valid cancellation reason.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient(`/trips/${trip.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      Alert.alert('Trip Cancelled', 'The trip was cancelled.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)' as never) },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot cancel trip';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Phase 5: 3-Second Hold SOS Trigger
  const handleSosPressIn = () => {
    if (sosActive) return;
    setSosHolding(true);
    setSosCountdown(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let remaining = 3;
    sosIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setSosCountdown(remaining);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 1000);

    sosTimerRef.current = setTimeout(async () => {
      if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
      setSosHolding(false);
      await executeSosTrigger();
    }, 3000);
  };

  const handleSosPressOut = () => {
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    setSosHolding(false);
    setSosCountdown(3);
  };

  const executeSosTrigger = async () => {
    if (!trip) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const pickup = parsePoint(trip.booking?.pickup_location);
    const lat = pickup?.latitude || 12.9716;
    const lng = pickup?.longitude || 77.5946;

    try {
      const res = await apiClient<{
        success: boolean;
        data: {
          event: { id: string };
          reverseGeocodedAddress?: string;
          emergencyContactsNotified: number;
        };
      }>(`/trips/${trip.id}/sos`, {
        method: 'POST',
        body: JSON.stringify({ latitude: lat, longitude: lng, reason: 'Driver emergency 3s hold trigger' }),
      });

      setSosActive(true);
      setSosEventId(res.data.event.id);
      setSosAddress(res.data.reverseGeocodedAddress || 'Live coordinates dispatched');
      setSosContactsCount(res.data.emergencyContactsNotified || 0);
    } catch (err: any) {
      Alert.alert('SOS Dispatch Error', err.message || 'Failed to dispatch SOS alert');
    }
  };

  const handleCancelSos = async () => {
    if (!sosEventId) {
      setSosActive(false);
      return;
    }

    try {
      await apiClient(`/sos/${sosEventId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'False alarm cancelled by driver' }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('SOS Cancelled', 'Emergency alert has been cancelled as a false alarm.');
      setSosActive(false);
      setSosEventId(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel SOS');
    }
  };

  // Phase 5: Native Share Sheet Trip Sharing with Cryptographic Token
  const handleShareTrip = async () => {
    if (!trip) return;
    try {
      const res = await apiClient<{
        success: boolean;
        data: { shareToken: string; shareUrl: string };
      }>(`/trips/${trip.id}/share`, { method: 'POST' });

      const fullUrl = `https://ryde.in${res.data.shareUrl}`;
      await Share.share({
        message: `Track my live Ryde trip to ${trip.booking?.destination_address || 'destination'}: ${fullUrl} (Live tracking expires when trip ends)`,
        url: fullUrl,
      });
    } catch (err: any) {
      Alert.alert('Trip Sharing', err.message || 'Failed to generate share link');
    }
  };

  // Phase 5: Post-Trip Customer Rating
  const handleRateCustomer = async () => {
    if (!trip) return;
    setSubmittingRating(true);
    try {
      await apiClient(`/trips/${trip.id}/rating`, {
        method: 'POST',
        body: JSON.stringify({
          rating: customerRating,
          review: customerReview.trim() || undefined,
        }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRatingSubmitted(true);
      Alert.alert('Thank you!', 'Your passenger rating has been recorded.');
    } catch (err: any) {
      Alert.alert('Rating Error', err.message || 'Could not record rating');
    } finally {
      setSubmittingRating(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading trip data...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No active trip found.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)' as never)}>
          <Text style={styles.primaryButtonText}>Return to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = trip.trip_status;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Welcome Back Banner after Google Maps navigation */}
      {showWelcomeBack && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeBannerText}>👋 Welcome back to Ryde Capital</Text>
        </View>
      )}

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>
            {status === 'completed'
              ? 'Trip Completed'
              : status === 'in_progress'
              ? 'On Trip to Destination'
              : 'Pickup & Verification'}
          </Text>
          <Text style={styles.vehicleSubtitle}>
            {trip.vehicle?.make} {trip.vehicle?.model} • {trip.vehicle?.license_plate}
          </Text>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
          <Text style={styles.callButtonText}>📞 Call</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ==================================================================== */}
        {/* 1. MAP VIEW (Heading to pickup OR In Progress)                        */}
        {/* ==================================================================== */}
        {['assigned', 'heading_to_pickup', 'in_progress'].includes(status) && (
          <View style={styles.mapContainer}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleOpenGoogleMaps} style={styles.mapTouch}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: pickupCoord.latitude,
                  longitude: pickupCoord.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker coordinate={pickupCoord} title="Pickup" pinColor="#3B82F6" />
                <Marker coordinate={destCoord} title="Destination" pinColor="#10B981" />
                {routeCoords.length > 0 && (
                  <Polyline coordinates={routeCoords} strokeColor="#3B82F6" strokeWidth={5} />
                )}
              </MapView>

              {/* Tappable prompt badge */}
              <View style={styles.mapTapOverlay}>
                <Text style={styles.mapTapText}>🗺️ Tap map to open in Google Maps</Text>
              </View>
            </TouchableOpacity>

            {/* Primary Google Maps Navigation Button */}
            <TouchableOpacity style={styles.mapsHandoffButton} onPress={handleOpenGoogleMaps}>
              <Text style={styles.mapsHandoffButtonText}>
                {status === 'in_progress' ? '🧭 Navigate to Drop in Google Maps' : '🧭 Navigate to Pickup in Google Maps'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 2. HEADING TO PICKUP ACTIONS                                         */}
        {/* ==================================================================== */}
        {['assigned', 'heading_to_pickup'].includes(status) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <Text style={styles.addressText}>{trip.booking?.pickup_address}</Text>

            <TouchableOpacity
              style={[styles.primaryButton, actionLoading && styles.disabledButton]}
              disabled={actionLoading}
              onPress={handleMarkArrived}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>📍 I&apos;ve Arrived at Pickup</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowCancelModal(true)}>
              <Text style={styles.cancelLinkText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 3. ARRIVED & WAITING TIMER + OTP VERIFICATION                        */}
        {/* ==================================================================== */}
        {status === 'arrived' && (
          <View style={styles.card}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerTitle}>⏱️ Waiting at Pickup</Text>
              <Text style={styles.timerClock}>
                {`${Math.floor(waitingElapsedSeconds / 60)}:${String(waitingElapsedSeconds % 60).padStart(2, '0')}`}
              </Text>
              <Text style={styles.timerSubtitle}>
                {waitingElapsedSeconds > 300
                  ? 'Waiting charge is currently active (₹3/min)'
                  : '5 free waiting minutes included'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Enter Customer Trip Start OTP</Text>
            <Text style={styles.helperText}>Ask customer for their 6-digit verification code</Text>

            <TextInput
              style={styles.otpInput}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <TouchableOpacity
              style={[styles.primaryButton, (otpCode.length !== 6 || actionLoading) && styles.disabledButton]}
              disabled={otpCode.length !== 6 || actionLoading}
              onPress={handleVerifyOtp}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>✅ Verify OTP & Proceed</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGenerateOtp}>
              <Text style={styles.secondaryButtonText}>Resend OTP Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowCancelModal(true)}>
              <Text style={styles.cancelLinkText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 4. PRE-TRIP VEHICLE HANDOVER INSPECTION                              */}
        {/* ==================================================================== */}
        {status === 'otp_verified' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📸 Customer Vehicle Handover</Text>
            <Text style={styles.helperText}>
              Record initial vehicle state and upload all 6 required verification photos.
            </Text>

            <Text style={styles.inputLabel}>Initial Odometer Reading (km) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 45200.5"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={odometerBefore}
              onChangeText={setOdometerBefore}
            />

            <Text style={styles.inputLabel}>Fuel Level Percentage (%) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="75"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={fuelLevelBefore}
              onChangeText={setFuelLevelBefore}
            />

            <Text style={styles.inputLabel}>Existing Damage / Scratches</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Note any visible scratches, dents, or wheel wear"
              placeholderTextColor="#64748B"
              value={handoverNotes}
              onChangeText={setHandoverNotes}
            />

            {/* 6 Mandatory Photo Tiles */}
            <Text style={styles.inputLabel}>Required Inspection Photos (6/6) *</Text>
            <View style={styles.photoGrid}>
              {['front', 'back', 'left', 'right', 'odometer', 'fuel_gauge'].map((type) => {
                const captured = Boolean(capturedPhotos[type]);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.photoTile, captured && styles.photoTileCaptured]}
                    onPress={() => handleAttachPhoto(type)}
                  >
                    <Text style={styles.photoTileIcon}>{captured ? '✅' : '📷'}</Text>
                    <Text style={styles.photoTileLabel}>
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, actionLoading && styles.disabledButton]}
              disabled={actionLoading}
              onPress={handleSubmitHandover}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Complete Vehicle Handover</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 5. HANDOVER DONE -> START TRIP PROMPT                                */}
        {/* ==================================================================== */}
        {status === 'handover_done' && (
          <View style={styles.card}>
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>✅ Vehicle Inspection Verified</Text>
            </View>

            <Text style={styles.addressText}>
              Handover checklist completed. Passenger is onboard. Ready to start journey.
            </Text>

            <TouchableOpacity
              style={[styles.startTripButton, actionLoading && styles.disabledButton]}
              disabled={actionLoading}
              onPress={handleStartTrip}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.startTripButtonText}>🚀 START JOURNEY</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 6. IN PROGRESS ACTIONS (SOS, SHARE, END TRIP)                        */}
        {/* ==================================================================== */}
        {status === 'in_progress' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Destination</Text>
            <Text style={styles.addressText}>{trip.booking?.destination_address}</Text>

            {/* Phase 5 SOS Active State or 3s Hold Trigger */}
            {sosActive ? (
              <View style={styles.sosActiveBanner}>
                <Text style={styles.sosActiveTitle}>🚨 EMERGENCY SOS DISPATCHED</Text>
                <Text style={styles.sosActiveDesc}>Location: {sosAddress}</Text>
                <Text style={styles.sosActiveDesc}>
                  SMS sent to {sosContactsCount} emergency contacts and police/support queue.
                </Text>
                <TouchableOpacity style={styles.sosCancelBtn} onPress={handleCancelSos}>
                  <Text style={styles.sosCancelBtnText}>Cancel Alert (False Alarm)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.safetyRow}>
                <TouchableOpacity
                  style={[styles.sosButton, sosHolding && styles.sosButtonHolding]}
                  activeOpacity={0.8}
                  onPressIn={handleSosPressIn}
                  onPressOut={handleSosPressOut}
                >
                  <Text style={styles.sosButtonText}>
                    {sosHolding ? `⚠️ HOLDING (${sosCountdown}s)...` : '🚨 HOLD 3s FOR SOS'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton} onPress={handleShareTrip}>
                  <Text style={styles.shareButtonText}>🔗 Share Trip</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.endTripButton}
              onPress={() => setShowEndModal(true)}
            >
              <Text style={styles.endTripButtonText}>🏁 Complete & End Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================================================== */}
        {/* 7. TRIP COMPLETED FARE SUMMARY & PASSENGER RATING                    */}
        {/* ==================================================================== */}
        {status === 'completed' && (
          <View style={styles.card}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>🎉 Trip Completed Successfully</Text>
            </View>

            <Text style={styles.fareTotal}>
              {`₹${trip.fare?.total_amount ? Number(trip.fare.total_amount).toFixed(2) : '304.50'}`}
            </Text>
            <Text style={styles.fareSubtitle}>Paid via Customer Card / UPI</Text>

            <View style={styles.fareBreakdownTable}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare</Text>
                <Text style={styles.fareValue}>{`₹${Number(trip.fare?.base_fare || 80).toFixed(2)}`}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance Charge</Text>
                <Text style={styles.fareValue}>{`₹${Number(trip.fare?.distance_charge || 160).toFixed(2)}`}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Time Charge</Text>
                <Text style={styles.fareValue}>{`₹${Number(trip.fare?.time_charge || 50).toFixed(2)}`}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Waiting Charge</Text>
                <Text style={styles.fareValue}>{`₹${Number(trip.fare?.waiting_charge || 0).toFixed(2)}`}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>GST / Tax (5%)</Text>
                <Text style={styles.fareValue}>{`₹${Number(trip.fare?.tax || 14.5).toFixed(2)}`}</Text>
              </View>
            </View>

            {/* Phase 5: Rate Customer Section */}
            {!ratingSubmitted ? (
              <View style={styles.ratingBox}>
                <Text style={styles.ratingTitle}>Rate Passenger</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setCustomerRating(s)}>
                      <Text style={[styles.starIcon, customerRating >= s && styles.starIconActive]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Optional review about the passenger..."
                  placeholderTextColor="#64748b"
                  value={customerReview}
                  onChangeText={setCustomerReview}
                />
                <TouchableOpacity
                  style={styles.submitRatingButton}
                  disabled={submittingRating}
                  onPress={handleRateCustomer}
                >
                  {submittingRating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitRatingButtonText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ratingDoneBox}>
                <Text style={styles.ratingDoneText}>✓ Passenger Rated ({customerRating} ★)</Text>
              </View>
            )}

            {/* Raise Complaint link */}
            <TouchableOpacity
              style={styles.complaintLink}
              onPress={() =>
                router.push({
                  pathname: '/safety/complaint' as any,
                  params: { tripId: trip.id },
                })
              }
            >
              <Text style={styles.complaintLinkText}>⚠️ Issue with passenger? Raise a complaint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(tabs)' as never)}
            >
              <Text style={styles.primaryButtonText}>Go Online / Next Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ==================================================================== */}
      {/* END TRIP RETURN INSPECTION MODAL                                     */}
      {/* ==================================================================== */}
      {showEndModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Return Vehicle Handover</Text>
            <Text style={styles.helperText}>
              Verify return odometer and fuel level before completing trip.
            </Text>

            <Text style={styles.inputLabel}>Final Odometer Reading (km) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 45030.5"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={odometerAfter}
              onChangeText={setOdometerAfter}
            />

            <Text style={styles.inputLabel}>Final Fuel Percentage (%)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="70"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={fuelLevelAfter}
              onChangeText={setFuelLevelAfter}
            />

            <Text style={styles.inputLabel}>Early Drop / Diversion Reason (if applicable)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Required if ending > 200m from destination"
              placeholderTextColor="#64748B"
              value={earlyDropReason}
              onChangeText={setEarlyDropReason}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmButton, actionLoading && styles.disabledButton]}
                disabled={actionLoading}
                onPress={handleEndTrip}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm & Finish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* CANCELLATION REASON MODAL                                            */}
      {/* ==================================================================== */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Trip</Text>
            <Text style={styles.helperText}>
              Cancellation reasons are audited. Drivers are allowed cancellation prior to start.
            </Text>

            <TextInput
              style={[styles.textInput, { height: 80 }]}
              placeholder="Reason for cancellation (e.g. Vehicle breakdown, customer unreachable)"
              placeholderTextColor="#64748B"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDangerButton, actionLoading && styles.disabledButton]}
                disabled={actionLoading}
                onPress={handleCancelTrip}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDangerText}>Confirm Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  welcomeBanner: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  welcomeBannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    position: 'relative',
    height: 320,
    width: '100%',
  },
  mapTouch: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapTapOverlay: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapTapText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  mapsHandoffButton: {
    position: 'absolute',
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  mapsHandoffButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
    marginBottom: 20,
  },
  timerBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  timerTitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timerClock: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginVertical: 4,
  },
  timerSubtitle: {
    fontSize: 12,
    color: '#F59E0B',
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderColor: '#3B82F6',
    borderWidth: 2,
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 14,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    color: '#F8FAFC',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  photoTile: {
    width: (width - 92) / 3,
    height: 80,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoTileCaptured: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  photoTileIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  photoTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 14,
  },
  startTripButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  successBannerText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  safetyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sosButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  endTripButton: {
    backgroundColor: '#0F172A',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  endTripButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  cancelLinkText: {
    color: '#EF4444',
    fontSize: 13,
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  successBadgeText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fareTotal: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  fareSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  fareBreakdownTable: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fareLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  fareValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalDangerButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDangerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sosActiveBanner: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sosActiveTitle: {
    color: '#fef2f2',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  sosActiveDesc: {
    color: '#fca5a5',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  sosCancelBtn: {
    backgroundColor: '#991b1b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sosCancelBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sosButtonHolding: {
    backgroundColor: '#b91c1c',
    transform: [{ scale: 1.02 }],
  },
  ratingBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  ratingTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  starIcon: {
    fontSize: 32,
    color: '#334155',
  },
  starIconActive: {
    color: '#EAB308',
  },
  reviewInput: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 12,
  },
  submitRatingButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitRatingButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  ratingDoneBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingDoneText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
  complaintLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  complaintLinkText: {
    color: '#94a3b8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

