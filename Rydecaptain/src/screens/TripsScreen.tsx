import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { RecentTrip, BottomNavTab } from '../types';

interface TripsScreenProps {
  recentTrips: RecentTrip[];
  unreadNotifications: number;
  avatarUrl: string;
  pendingBookingsCount: number;
  onNavigateToHome: () => void;
  onNavigateToBookings: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
}

export const TripsScreen: React.FC<TripsScreenProps> = ({
  recentTrips,
  unreadNotifications,
  avatarUrl,
  pendingBookingsCount,
  onNavigateToHome,
  onNavigateToBookings,
  onNotificationsClick,
  onProfileClick,
}) => {
  const totalEarned = recentTrips.reduce((acc, t) => acc + t.fare, 0);

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'home') onNavigateToHome();
    if (tab === 'bookings') onNavigateToBookings();
  };

  return (
    <View style={styles.container}>
      <CornerDecorations />

      <Header
        showBack
        onBack={onNavigateToHome}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.heading}>MY TRIPS</Text>
          <Text style={styles.subtitle}>Past completed trips & fares</Text>
        </View>

        {/* Total Earned Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Completed Trips Total</Text>
            <Text style={styles.totalValue}>₹{totalEarned.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.walletIconCircle}>
            <Ionicons name="wallet" size={24} color="#F5B83D" />
          </View>
        </View>

        {/* Trips List */}
        {recentTrips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripCardHeader}>
              <View style={styles.tripIdRow}>
                <Ionicons name="car" size={16} color="#075B64" />
                <Text style={styles.tripIdText}>{trip.id}</Text>
              </View>
              <Text style={styles.timeText}>
                {trip.date}, {trip.time}
              </Text>
            </View>

            <View style={styles.locationGroup}>
              <View style={styles.locRow}>
                <Ionicons name="location" size={14} color="#F5B83D" />
                <Text style={styles.locText}>{trip.pickupLocation}</Text>
              </View>
              <View style={styles.locRow}>
                <Ionicons name="flag" size={14} color="#075B64" />
                <Text style={styles.locText}>{trip.destination}</Text>
              </View>
            </View>

            <View style={styles.tripCardFooter}>
              <Text style={styles.vehicleText}>{trip.vehicle}</Text>
              <View style={styles.fareRow}>
                <Text style={styles.fareAmount}>₹{trip.fare}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{trip.status}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pinned Bottom Navigation */}
      <BottomNav
        activeTab="trips"
        onTabChange={handleTabChange}
        pendingBookingsCount={pendingBookingsCount}
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
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#76A6A5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripCard: {
    backgroundColor: 'rgba(140, 184, 184, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.6)',
    marginBottom: 12,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111, 165, 165, 0.4)',
  },
  tripIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripIdText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#075B64',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  locationGroup: {
    gap: 6,
    marginBottom: 10,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
  },
  tripCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(111, 165, 165, 0.4)',
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fareAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075B64',
  },
  statusBadge: {
    backgroundColor: 'rgba(209, 250, 229, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
});
