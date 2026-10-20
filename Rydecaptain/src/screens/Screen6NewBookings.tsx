import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { BookingRequest, BottomNavTab } from '../types';

interface Screen6NewBookingsProps {
  bookings: BookingRequest[];
  unreadNotifications: number;
  avatarUrl: string;
  onAccept: (booking: BookingRequest) => void;
  onReject: (bookingId: string) => void;
  onNavigateToHome: () => void;
  onNavigateToTrips: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
}

export const Screen6NewBookings: React.FC<Screen6NewBookingsProps> = ({
  bookings,
  unreadNotifications,
  avatarUrl,
  onAccept,
  onReject,
  onNavigateToHome,
  onNavigateToTrips,
  onNotificationsClick,
  onProfileClick,
  onBack,
}) => {
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'home') onNavigateToHome();
    if (tab === 'trips') onNavigateToTrips();
  };

  return (
    <View style={styles.container}>
      <CornerDecorations />

      <Header
        showBack
        onBack={onBack || onNavigateToHome}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.heading}>NEW BOOKING</Text>
          <Text style={styles.subtitle}>
            {pendingBookings.length} booking request{pendingBookings.length === 1 ? '' : 's'} waiting
          </Text>
        </View>

        {/* Empty State or Booking Cards */}
        {pendingBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={30} color="#075B64" />
            </View>
            <Text style={styles.emptyTitle}>No Pending Bookings</Text>
            <Text style={styles.emptySub}>
              You're all caught up! Stay online to receive incoming customer trips.
            </Text>
            <View style={styles.returnBtnArea}>
              <Button
                title="Return to Dashboard"
                variant="amber"
                size="md"
                onPress={onNavigateToHome}
              />
            </View>
          </View>
        ) : (
          pendingBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.tripIdText}>✨ Trip ID: {booking.id}</Text>
                <View style={styles.distanceFareBadge}>
                  <Text style={styles.distanceFareText}>
                    {booking.distance} • ₹{booking.estimatedFare}
                  </Text>
                </View>
              </View>

              {/* 2-Column Info Layout matching Reference Screen 6 */}
              <View style={styles.infoGrid}>
                {/* Left Column: Customer & Pick Up */}
                <View style={styles.infoCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.fieldHeading}>CUSTOMER</Text>
                    <View style={styles.valueRow}>
                      <Ionicons name="person" size={14} color="#FFFFFF" style={styles.valIcon} />
                      <Text style={styles.valText}>{booking.customerName}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.fieldHeading}>PICK UP</Text>
                    <View style={styles.valueRow}>
                      <Ionicons name="location" size={14} color="#F5B83D" style={styles.valIcon} />
                      <Text style={styles.valText}>{booking.pickupLocation}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Column: Vehicle & Drop */}
                <View style={styles.infoCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.fieldHeading}>VEHICLE</Text>
                    <View style={styles.valueRow}>
                      <Ionicons name="car" size={14} color="#FFFFFF" style={styles.valIcon} />
                      <Text style={styles.valText}>{booking.vehicleType}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.fieldHeading}>DROP</Text>
                    <View style={styles.valueRow}>
                      <Ionicons name="flag" size={14} color="#FFFFFF" style={styles.valIcon} />
                      <Text style={styles.valText}>{booking.destination}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons: Amber ACCEPT & Dark Teal REJECT */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onAccept(booking)}
                  style={styles.acceptButton}
                >
                  <Text style={styles.actionBtnText}>ACCEPT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onReject(booking.id)}
                  style={styles.rejectButton}
                >
                  <Text style={styles.actionBtnText}>REJECT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Pinned Bottom Navigation */}
      <BottomNav
        activeTab="bookings"
        onTabChange={handleTabChange}
        pendingBookingsCount={pendingBookings.length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF0F0',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 25,
  },
  titleSection: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#075B64',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(7, 91, 100, 0.7)',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.4)',
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#075B64',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 220,
    lineHeight: 16,
  },
  returnBtnArea: {
    marginTop: 18,
    width: 180,
  },
  bookingCard: {
    backgroundColor: '#7EAFA8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6FA5A5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  tripIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  distanceFareBadge: {
    backgroundColor: 'rgba(7, 91, 100, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  distanceFareText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    marginBottom: 12,
  },
  fieldHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valIcon: {
    marginRight: 4,
  },
  valText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#F5B83D',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#075B64',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
