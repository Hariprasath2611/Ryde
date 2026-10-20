import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { DriverProfile, RecentTrip, BottomNavTab } from '../types';

interface Screen5HomeDashboardProps {
  driver: DriverProfile;
  recentTrips: RecentTrip[];
  unreadNotifications: number;
  pendingBookingsCount: number;
  onToggleOnline: () => void;
  onNavigateToBookings: () => void;
  onNavigateToTrips: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTripClick: (trip: RecentTrip) => void;
  onBack?: () => void;
}

export const Screen5HomeDashboard: React.FC<Screen5HomeDashboardProps> = ({
  driver,
  recentTrips,
  unreadNotifications,
  pendingBookingsCount,
  onToggleOnline,
  onNavigateToBookings,
  onNavigateToTrips,
  onNotificationsClick,
  onProfileClick,
  onTripClick,
  onBack,
}) => {
  const latestTrip = recentTrips[0];

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'bookings') onNavigateToBookings();
    if (tab === 'trips') onNavigateToTrips();
  };

  return (
    <View style={styles.container}>
      <CornerDecorations />

      <Header
        showBack
        onBack={onBack}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={driver.avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSub}>Welcome Back</Text>
          <Text style={styles.driverName}>{driver.fullName}</Text>
        </View>

        {/* Large Online/Offline Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.statusDot,
                driver.isOnline ? styles.onlineDot : styles.offlineDot,
              ]}
            />
            <Text style={styles.statusText}>
              {driver.isOnline
                ? "you're online & accepting rides"
                : "you're offline"}
            </Text>
          </View>

          <View style={styles.statusBtnWrap}>
            <Button
              title={driver.isOnline ? 'Go Offline ⏸' : 'Go Online'}
              variant={driver.isOnline ? 'teal' : 'amber'}
              withArrow={!driver.isOnline}
              size="md"
              onPress={onToggleOnline}
            />
          </View>

          {driver.isOnline && (
            <Text style={styles.autoMatchText}>
              ✨ Auto-matching new customer trips nearby
            </Text>
          )}
        </View>

        {/* 2-Column Summary Grid */}
        <View style={styles.summaryGrid}>
          {/* Card 1: Trips Today */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="car-sport" size={20} color="#075B64" />
            </View>
            <Text style={styles.metricValue}>{driver.totalTripsToday}</Text>
            <Text style={styles.metricLabel}>Trips Today</Text>
          </View>

          {/* Card 2: Today Earning */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="wallet-outline" size={20} color="#075B64" />
            </View>
            <Text style={styles.metricValue}>
              ₹{driver.todayEarnings.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricLabel}>Today Earning</Text>
          </View>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <Ionicons name="star" size={16} color="#F5B83D" />
          <Text style={styles.ratingText}>{driver.rating.toFixed(1)} Rating</Text>
          <Text style={styles.ratingSub}>(142 reviews)</Text>
        </View>

        {/* Recent Trip Card */}
        {latestTrip && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onTripClick(latestTrip)}
            style={styles.recentTripCard}
          >
            <View style={styles.recentTripHeader}>
              <View style={styles.recentTripIconRow}>
                <View style={styles.carMiniIcon}>
                  <Ionicons name="car" size={16} color="#075B64" />
                </View>
                <Text style={styles.recentTripTitle}>Recent Trip</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#075B64" />
            </View>

            <Text style={styles.routeText}>{latestTrip.route}</Text>

            <View style={styles.recentTripFooter}>
              <Text style={styles.fareText}>₹{latestTrip.fare}</Text>
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>{latestTrip.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Pending Booking Quick Alert */}
        {pendingBookingsCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNavigateToBookings}
            style={styles.alertBanner}
          >
            <View style={styles.alertBannerLeft}>
              <View style={styles.pingDot} />
              <View>
                <Text style={styles.alertBannerTitle}>
                  {pendingBookingsCount} New Booking Request{pendingBookingsCount > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.alertBannerSub}>Tap to review and accept</Text>
              </View>
            </View>
            <View style={styles.viewBadge}>
              <Text style={styles.viewBadgeText}>View →</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab="home"
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
  welcomeSection: {
    marginBottom: 14,
  },
  welcomeSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(7, 91, 100, 0.8)',
  },
  driverName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#075B64',
    letterSpacing: -0.3,
  },
  statusCard: {
    backgroundColor: '#76A6A5',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: '#34D399',
  },
  offlineDot: {
    backgroundColor: '#CBD5E1',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBtnWrap: {
    width: 200,
  },
  autoMatchText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(140, 184, 184, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.6)',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#075B64',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(7, 91, 100, 0.8)',
    marginTop: 2,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(140, 184, 184, 0.75)',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.6)',
    marginBottom: 12,
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
  },
  ratingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(7, 91, 100, 0.7)',
  },
  recentTripCard: {
    backgroundColor: 'rgba(140, 184, 184, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.6)',
    marginBottom: 12,
  },
  recentTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentTripIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
    marginBottom: 10,
  },
  recentTripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(111, 165, 165, 0.4)',
  },
  fareText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075B64',
  },
  doneBadge: {
    backgroundColor: 'rgba(209, 250, 229, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#F5B83D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5B83D',
  },
  alertBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075B64',
  },
  alertBannerSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  viewBadge: {
    backgroundColor: '#DDF0F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#075B64',
  },
});
