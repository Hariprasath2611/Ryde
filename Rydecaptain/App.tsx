import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { Screen1Splash } from './src/screens/Screen1Splash';
import { Screen2Registration } from './src/screens/Screen2Registration';
import { Screen3OtpVerification } from './src/screens/Screen3OtpVerification';
import { Screen4DriverVerification } from './src/screens/Screen4DriverVerification';
import { Screen5HomeDashboard } from './src/screens/Screen5HomeDashboard';
import { Screen6NewBookings } from './src/screens/Screen6NewBookings';
import { TripsScreen } from './src/screens/TripsScreen';
import {
  Workflow1BookingAccepted,
  Workflow2PickupDetails,
  Workflow3ArrivedPickup,
  Workflow4CustomerOtp,
  Workflow5VehicleHandover,
  Workflow6StartTripConfirm,
  Workflow7ActiveTripMap,
  Workflow8DestinationReached,
  Workflow9FinalCheck,
  Workflow10EndTripConfirm,
  Workflow11EarningsPayment,
  Workflow12RatingFeedback,
} from './src/workflow/WorkflowSteps';
import { NotificationsModal } from './src/components/NotificationsModal';
import { ProfileModal } from './src/components/ProfileModal';
import {
  ScreenType,
  DriverProfile,
  BookingRequest,
  RecentTrip,
  NotificationItem,
} from './src/types';
import {
  initialDriverProfile,
  initialBookings,
  initialRecentTrips,
  initialNotifications,
} from './src/mockData';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [driver, setDriver] = useState<DriverProfile>(initialDriverProfile);
  const [bookings, setBookings] = useState<BookingRequest[]>(initialBookings);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(initialRecentTrips);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeBooking, setActiveBooking] = useState<BookingRequest>(initialBookings[0]);

  // Modals
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    setCurrentScreen('splash');
    setDriver(initialDriverProfile);
    setIsProfileOpen(false);
  };

  // Online / Offline toggle
  const handleToggleOnline = () => {
    const nextStatus = !driver.isOnline;
    setDriver((prev) => ({ ...prev, isOnline: nextStatus }));
    Alert.alert(
      nextStatus ? 'Status: ONLINE' : 'Status: OFFLINE',
      nextStatus
        ? 'You are now online and will receive new trip bookings.'
        : 'You are now offline.'
    );
  };

  // Accept booking
  const handleAcceptBooking = (b: BookingRequest) => {
    setActiveBooking(b);
    setBookings((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, status: 'accepted' } : item))
    );
    setCurrentScreen('workflow_accepted');
  };

  // Reject booking
  const handleRejectBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    Alert.alert('Booking Rejected', `Booking #${bookingId} was declined.`);
  };

  // Finish end of trip
  const handleFinishTrip = () => {
    const payout = Math.round(activeBooking.estimatedFare * 0.85);
    setDriver((prev) => ({
      ...prev,
      totalTripsToday: prev.totalTripsToday + 1,
      todayEarnings: prev.todayEarnings + payout,
    }));

    const newTrip: RecentTrip = {
      id: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
      route: `${activeBooking.pickupLocation} → ${activeBooking.destination}`,
      pickupLocation: activeBooking.pickupLocation,
      destination: activeBooking.destination,
      fare: payout,
      status: 'Done',
      date: 'Today',
      time: 'Just now',
      vehicle: `${activeBooking.vehicleType} (${activeBooking.vehicleModel})`,
      customerName: activeBooking.customerName,
    };
    setRecentTrips((prev) => [newTrip, ...prev]);
    setCurrentScreen('workflow_earnings');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Screen Routing */}
      <View style={styles.screenContainer}>
        {currentScreen === 'splash' && (
          <Screen1Splash onGetStarted={() => setCurrentScreen('registration')} />
        )}

        {currentScreen === 'registration' && (
          <Screen2Registration
            onBack={() => setCurrentScreen('splash')}
            initialData={{
              fullName: driver.fullName,
              mobileNumber: driver.mobileNumber,
              avatarUrl: driver.avatarUrl,
            }}
            onContinue={(data) => {
              setDriver((prev) => ({
                ...prev,
                fullName: data.fullName,
                mobileNumber: data.mobileNumber,
                avatarUrl: data.avatarUrl,
              }));
              setCurrentScreen('otp');
            }}
          />
        )}

        {currentScreen === 'otp' && (
          <Screen3OtpVerification
            mobileNumber={driver.mobileNumber}
            onBack={() => setCurrentScreen('registration')}
            onProceed={() => setCurrentScreen('verification')}
          />
        )}

        {currentScreen === 'verification' && (
          <Screen4DriverVerification
            driver={driver}
            onBack={() => setCurrentScreen('otp')}
            onProceed={() => {
              setDriver((prev) => ({ ...prev, isVerified: true }));
              setCurrentScreen('dashboard');
            }}
          />
        )}

        {currentScreen === 'dashboard' && (
          <Screen5HomeDashboard
            driver={driver}
            recentTrips={recentTrips}
            unreadNotifications={notifications.filter((n) => !n.read).length}
            pendingBookingsCount={bookings.filter((b) => b.status === 'pending').length}
            onToggleOnline={handleToggleOnline}
            onNavigateToBookings={() => setCurrentScreen('new_bookings')}
            onNavigateToTrips={() => setCurrentScreen('trips')}
            onNotificationsClick={() => setIsNotifOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onTripClick={(trip) => {
              Alert.alert('Trip Details', `Route: ${trip.route}\nFare: ₹${trip.fare}\nStatus: ${trip.status}`);
            }}
            onBack={() => setCurrentScreen('verification')}
          />
        )}

        {currentScreen === 'new_bookings' && (
          <Screen6NewBookings
            bookings={bookings}
            unreadNotifications={notifications.filter((n) => !n.read).length}
            avatarUrl={driver.avatarUrl}
            onAccept={handleAcceptBooking}
            onReject={handleRejectBooking}
            onNavigateToHome={() => setCurrentScreen('dashboard')}
            onNavigateToTrips={() => setCurrentScreen('trips')}
            onNotificationsClick={() => setIsNotifOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'trips' && (
          <TripsScreen
            recentTrips={recentTrips}
            unreadNotifications={notifications.filter((n) => !n.read).length}
            avatarUrl={driver.avatarUrl}
            pendingBookingsCount={bookings.filter((b) => b.status === 'pending').length}
            onNavigateToHome={() => setCurrentScreen('dashboard')}
            onNavigateToBookings={() => setCurrentScreen('new_bookings')}
            onNotificationsClick={() => setIsNotifOpen(true)}
            onProfileClick={() => setIsProfileOpen(true)}
          />
        )}

        {/* DRIVER JOURNEY WORKFLOW */}
        {currentScreen === 'workflow_accepted' && (
          <Workflow1BookingAccepted
            booking={activeBooking}
            onNext={() => setCurrentScreen('workflow_pickup')}
            onBack={() => setCurrentScreen('new_bookings')}
          />
        )}

        {currentScreen === 'workflow_pickup' && (
          <Workflow2PickupDetails
            booking={activeBooking}
            onArrived={() => setCurrentScreen('workflow_arrived')}
            onBack={() => setCurrentScreen('workflow_accepted')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_arrived' && (
          <Workflow3ArrivedPickup
            booking={activeBooking}
            onProceedToOtp={() => setCurrentScreen('workflow_vehicle_handover')}
            onBack={() => setCurrentScreen('workflow_pickup')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_customer_otp' && (
          <Workflow4CustomerOtp
            booking={activeBooking}
            onProceedToOtp={() => setCurrentScreen('workflow_vehicle_handover')}
            onBack={() => setCurrentScreen('workflow_arrived')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_vehicle_handover' && (
          <Workflow5VehicleHandover
            booking={activeBooking}
            onChecklistComplete={() => setCurrentScreen('workflow_active_trip')}
            onBack={() => setCurrentScreen('workflow_arrived')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_start_trip' && (
          <Workflow6StartTripConfirm
            booking={activeBooking}
            onStartTrip={() => setCurrentScreen('workflow_active_trip')}
            onBack={() => setCurrentScreen('workflow_vehicle_handover')}
          />
        )}

        {currentScreen === 'workflow_active_trip' && (
          <Workflow7ActiveTripMap
            booking={activeBooking}
            onDestinationReached={() => setCurrentScreen('workflow_destination_reached')}
            onBack={() => setCurrentScreen('workflow_vehicle_handover')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_destination_reached' && (
          <Workflow8DestinationReached
            booking={activeBooking}
            onNext={handleFinishTrip}
            onEndTrip={handleFinishTrip}
            onBack={() => setCurrentScreen('workflow_active_trip')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_final_handover' && (
          <Workflow9FinalCheck
            booking={activeBooking}
            onNext={handleFinishTrip}
            onEndTrip={handleFinishTrip}
            onBack={() => setCurrentScreen('workflow_active_trip')}
            onNavigate={(t) => setCurrentScreen(t === 'home' ? 'dashboard' : t === 'bookings' ? 'new_bookings' : 'trips')}
          />
        )}

        {currentScreen === 'workflow_end_trip' && (
          <Workflow10EndTripConfirm
            booking={activeBooking}
            onNext={handleFinishTrip}
            onEndTrip={handleFinishTrip}
            onBack={() => setCurrentScreen('workflow_final_handover')}
          />
        )}

        {currentScreen === 'workflow_earnings' && (
          <Workflow11EarningsPayment
            booking={activeBooking}
            onProceedToFeedback={() => setCurrentScreen('workflow_feedback')}
          />
        )}

        {currentScreen === 'workflow_feedback' && (
          <Workflow12RatingFeedback
            booking={activeBooking}
            onSubmit={(_stars, _feed) => {
              Alert.alert('Thank You', 'Customer rated. Net earnings added to driver wallet.');
              setCurrentScreen('dashboard');
            }}
          />
        )}
      </View>

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        visible={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        driver={driver}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DDF0F0',
  },
  screenContainer: {
    flex: 1,
  },
});
