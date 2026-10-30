// ryde-capital/mobile/src/components/OfferModal.tsx
// Ride offer bottom sheet modal with synchronized server countdown, sound/haptics, route preview, and atomic accept

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiClient } from '../services/api';
import { RoutePreviewModal } from './RoutePreviewModal';
import { orderSoundService } from '../services/orderSound';

export interface OfferAssignment {
  id: string;
  booking_id: string;
  distance_to_customer_m: number | null;
  estimated_arrival_s: number | null;
  expires_at: string;
  booking?: {
    id: string;
    pickup_address: string;
    pickup_location: unknown;
    destination_address: string;
    destination_location: unknown;
    estimated_fare: number;
    vehicle_type?: string;
  } | null;
}

interface OfferModalProps {
  visible: boolean;
  offer: OfferAssignment | null;
  onAcceptSuccess: (tripId: string) => void;
  onDismiss: () => void;
}

export function OfferModal({
  visible,
  offer,
  onAcceptSuccess,
  onDismiss,
}: OfferModalProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  // Play sound & trigger haptic vibration on offer arrival
  useEffect(() => {
    if (visible && offer) {
      orderSoundService.startOrderAlert().catch(() => {});
    } else {
      orderSoundService.stopOrderAlert().catch(() => {});
    }

    return () => {
      orderSoundService.stopOrderAlert().catch(() => {});
    };
  }, [visible, offer?.id]);

  // Synchronize countdown with server expires_at
  useEffect(() => {
    if (!visible || !offer?.expires_at) return;

    const calculateRemaining = () => {
      const diff = Math.floor((new Date(offer.expires_at).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, offer?.expires_at, onDismiss]);

  if (!visible || !offer) return null;

  const distanceKm = offer.distance_to_customer_m
    ? (offer.distance_to_customer_m / 1000).toFixed(1)
    : '--';
  const etaMins = offer.estimated_arrival_s
    ? Math.max(1, Math.round(offer.estimated_arrival_s / 60))
    : '--';
  const fare = offer.booking?.estimated_fare ?? 0;
  const vehicleType = (offer.booking?.vehicle_type || 'four_wheeler').replace('_', ' ');

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    orderSoundService.stopOrderAlert().catch(() => {});

    try {
      const res = await apiClient<{ data: { status: string; tripId: string } }>(
        `/assignments/${offer.id}/accept`,
        { method: 'POST' },
      );

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_e) {
        // Haptics may be unsupported on simulators or web
      }

      onAcceptSuccess(res.data.tripId);
    } catch (err: unknown) {
      const message = (err as Error).message || '';
      if (message.includes('already assigned') || message.includes('expired')) {
        Alert.alert('Offer Unavailable', 'This ride was already assigned to another driver or has expired.');
      } else {
        Alert.alert('Error Accepting Ride', message || 'Failed to accept assignment.');
      }
      onDismiss();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason = 'Driver declined') => {
    if (submitting) return;
    setSubmitting(true);
    orderSoundService.stopOrderAlert().catch(() => {});

    try {
      await apiClient(`/assignments/${offer.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (_err) {
      // Dismiss regardless of network outcome
    } finally {
      setSubmitting(false);
      onDismiss();
    }
  };

  const pickup = offer.booking?.pickup_location as
    | { latitude?: number; longitude?: number }
    | undefined;
  const pickupLat = pickup?.latitude ?? 12.9716;
  const pickupLng = pickup?.longitude ?? 77.5946;

  return (
    <>
      <Modal visible={visible && !previewVisible} animationType="slide" transparent onRequestClose={onDismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalCard} testID="offer-modal-container">
            {/* Header with countdown bar */}
            <View style={styles.header}>
              <View style={styles.badgeRow}>
                <View style={styles.vehicleBadge}>
                  <Text style={styles.vehicleText}>{vehicleType.toUpperCase()}</Text>
                </View>
                <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerDanger]} testID="countdown-badge">
                  <Text style={styles.timerText}>⏱ {timeLeft}s</Text>
                </View>
              </View>

              <Text style={styles.fareText} testID="offer-fare">₹{fare}</Text>
              <Text style={styles.fareSubtext}>Estimated Earnings</Text>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Distance to Pickup</Text>
                <Text style={styles.metricValue}>{distanceKm} km</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Estimated ETA</Text>
                <Text style={styles.metricValue}>{etaMins} mins</Text>
              </View>
            </View>

            {/* Mini Map */}
            <View style={styles.miniMapBox}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                initialRegion={{
                  latitude: pickupLat,
                  longitude: pickupLng,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} pinColor="#10B981" />
              </MapView>
            </View>

            {/* Pickup / Drop Addresses */}
            <View style={styles.addressBox}>
              <View style={styles.addressRow}>
                <Text style={styles.pointIndicatorGreen}>●</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {offer.booking?.pickup_address || 'Pickup Location'}
                </Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={styles.pointIndicatorRed}>●</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {offer.booking?.destination_address || 'Dropoff Location'}
                </Text>
              </View>
            </View>

            {/* Preview Full Route Action */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setPreviewVisible(true)}
              testID="preview-route-button"
            >
              <Text style={styles.previewText}>🗺 Preview Full Route on Map</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject()}
                disabled={submitting}
                testID="reject-offer-button"
              >
                <Text style={styles.rejectText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
                disabled={submitting}
                testID="accept-offer-button"
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.acceptText}>Accept Ride</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-app Full Route Preview Modal */}
      <RoutePreviewModal
        visible={visible && previewVisible}
        assignmentId={offer.id}
        expiresAt={offer.expires_at}
        onClose={() => setPreviewVisible(false)}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleBadge: {
    backgroundColor: '#334155',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  vehicleText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 11,
  },
  timerBadge: {
    backgroundColor: '#3B82F6',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  timerDanger: {
    backgroundColor: '#EF4444',
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  fareText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#10B981',
  },
  fareSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  miniMapBox: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  addressBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pointIndicatorGreen: {
    color: '#10B981',
    fontSize: 14,
    marginRight: 8,
  },
  pointIndicatorRed: {
    color: '#EF4444',
    fontSize: 14,
    marginRight: 8,
  },
  addressText: {
    color: '#F8FAFC',
    fontSize: 13,
    flex: 1,
  },
  previewButton: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  previewText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
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
