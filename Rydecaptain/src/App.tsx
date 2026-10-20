import React, { useState } from 'react';
import { DeviceFrame } from './components/common/DeviceFrame';
import { Screen1Splash } from './components/screens/Screen1Splash';
import { Screen2Registration } from './components/screens/Screen2Registration';
import { Screen3OtpVerification } from './components/screens/Screen3OtpVerification';
import { Screen4DriverVerification } from './components/screens/Screen4DriverVerification';
import { Screen5HomeDashboard } from './components/screens/Screen5HomeDashboard';
import { Screen6NewBookings } from './components/screens/Screen6NewBookings';
import { TripsHistoryScreen } from './components/screens/TripsHistoryScreen';
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
} from './components/workflow/WorkflowSteps';
import { NotificationsModal } from './components/common/NotificationsModal';
import { ProfileModal } from './components/common/ProfileModal';
import {
  ScreenType,
  DriverProfile,
  BookingRequest,
  RecentTrip,
  NotificationItem,
} from './types';
import {
  initialDriverProfile,
  initialBookings,
  initialRecentTrips,
  initialNotifications,
} from './data/mockData';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [driver, setDriver] = useState<DriverProfile>(initialDriverProfile);
  const [bookings, setBookings] = useState<BookingRequest[]>(initialBookings);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(initialRecentTrips);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeBooking, setActiveBooking] = useState<BookingRequest>(initialBookings[0]);
  const [isViewingTrips, setIsViewingTrips] = useState<boolean>(false);

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetDemo = () => {
    setCurrentScreen('splash');
    setDriver(initialDriverProfile);
    setBookings(initialBookings);
    setRecentTrips(initialRecentTrips);
    setActiveBooking(initialBookings[0]);
    setIsViewingTrips(false);
    showToast('Demo reset to Welcome Screen');
  };

  // Online / Offline toggle
  const handleToggleOnline = () => {
    const nextStatus = !driver.isOnline;
    setDriver((prev) => ({ ...prev, isOnline: nextStatus }));
    showToast(nextStatus ? "You are now ONLINE. Ready for trips!" : "You are now OFFLINE");
  };

  // Accept booking
  const handleAcceptBooking = (booking: BookingRequest) => {
    setActiveBooking(booking);
    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'accepted' } : b))
    );
    setCurrentScreen('workflow_accepted');
  };

  // Reject booking
  const handleRejectBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    showToast(`Booking ${bookingId} rejected`);
  };

  // Complete end of trip
  const handleFinishTrip = () => {
    const payout = Math.round(activeBooking.estimatedFare * 0.85);

    // Update driver metrics
    setDriver((prev) => ({
      ...prev,
      totalTripsToday: prev.totalTripsToday + 1,
      todayEarnings: prev.todayEarnings + payout,
    }));

    // Add to recent trips
    const newRecentTrip: RecentTrip = {
      id: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
      route: `${activeBooking.pickupLocation} → ${activeBooking.destination}`,
      pickupLocation: activeBooking.pickupLocation,
      destination: activeBooking.destination,
      fare: payout,
      status: 'Done',
      date: 'Just now',
      time: '11:00 AM',
      vehicle: `${activeBooking.vehicleType} (${activeBooking.vehicleModel})`,
      customerName: activeBooking.customerName,
    };
    setRecentTrips((prev) => [newRecentTrip, ...prev]);

    // Proceed to earnings screen
    setCurrentScreen('workflow_earnings');
  };

  return (
    <DeviceFrame
      activeScreen={currentScreen}
      onSelectScreen={(screen) => {
        setIsViewingTrips(false);
        setCurrentScreen(screen);
      }}
      onResetDemo={handleResetDemo}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-12 inset-x-4 z-50 flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="bg-[#075B64] text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg border border-[#F5B83D] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F5B83D]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Screen Routing */}
      {isViewingTrips ? (
        <TripsHistoryScreen
          recentTrips={recentTrips}
          unreadNotifications={notifications.filter((n) => !n.read).length}
          avatarUrl={driver.avatarUrl}
          pendingBookingsCount={bookings.filter((b) => b.status === 'pending').length}
          onNavigateToHome={() => setIsViewingTrips(false)}
          onNavigateToBookings={() => {
            setIsViewingTrips(false);
            setCurrentScreen('new_bookings');
          }}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          onProfileClick={() => setIsProfileOpen(true)}
        />
      ) : (
        <>
          {/* SCREEN 1: Splash / Welcome */}
          {currentScreen === 'splash' && (
            <Screen1Splash
              onGetStarted={() => setCurrentScreen('registration')}
            />
          )}

          {/* SCREEN 2: Driver Registration */}
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

          {/* SCREEN 3: OTP Verification */}
          {currentScreen === 'otp' && (
            <Screen3OtpVerification
              mobileNumber={driver.mobileNumber}
              onBack={() => setCurrentScreen('registration')}
              onProceed={() => setCurrentScreen('verification')}
            />
          )}

          {/* SCREEN 4: Driver Verification */}
          {currentScreen === 'verification' && (
            <Screen4DriverVerification
              driver={driver}
              onBack={() => setCurrentScreen('otp')}
              onProceed={() => {
                setDriver((prev) => ({ ...prev, isVerified: true }));
                setCurrentScreen('dashboard');
                showToast('Documents verified! Welcome to Ryde Captain');
              }}
            />
          )}

          {/* SCREEN 5: Driver Home Dashboard */}
          {currentScreen === 'dashboard' && (
            <Screen5HomeDashboard
              driver={driver}
              recentTrips={recentTrips}
              unreadNotifications={notifications.filter((n) => !n.read).length}
              pendingBookingsCount={bookings.filter((b) => b.status === 'pending').length}
              onToggleOnline={handleToggleOnline}
              onNavigateToBookings={() => setCurrentScreen('new_bookings')}
              onNavigateToTrips={() => setIsViewingTrips(true)}
              onNotificationsClick={() => setIsNotificationsOpen(true)}
              onProfileClick={() => setIsProfileOpen(true)}
              onTripClick={(trip) => {
                showToast(`Viewing trip: ${trip.route}`);
              }}
              onBack={() => setCurrentScreen('verification')}
            />
          )}

          {/* SCREEN 6: New Booking Screen */}
          {currentScreen === 'new_bookings' && (
            <Screen6NewBookings
              bookings={bookings}
              unreadNotifications={notifications.filter((n) => !n.read).length}
              avatarUrl={driver.avatarUrl}
              onAccept={handleAcceptBooking}
              onReject={handleRejectBooking}
              onNavigateToHome={() => setCurrentScreen('dashboard')}
              onNavigateToTrips={() => setIsViewingTrips(true)}
              onNotificationsClick={() => setIsNotificationsOpen(true)}
              onProfileClick={() => setIsProfileOpen(true)}
              onBack={() => setCurrentScreen('dashboard')}
            />
          )}

          {/* DRIVER WORKFLOW STEPS */}
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
            />
          )}

          {currentScreen === 'workflow_arrived' && (
            <Workflow3ArrivedPickup
              booking={activeBooking}
              onProceedToOtp={() => setCurrentScreen('workflow_customer_otp')}
              onBack={() => setCurrentScreen('workflow_pickup')}
            />
          )}

          {currentScreen === 'workflow_customer_otp' && (
            <Workflow4CustomerOtp
              booking={activeBooking}
              onVerified={() => setCurrentScreen('workflow_vehicle_handover')}
              onBack={() => setCurrentScreen('workflow_arrived')}
            />
          )}

          {currentScreen === 'workflow_vehicle_handover' && (
            <Workflow5VehicleHandover
              booking={activeBooking}
              onChecklistComplete={() => setCurrentScreen('workflow_start_trip')}
              onBack={() => setCurrentScreen('workflow_customer_otp')}
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
            />
          )}

          {currentScreen === 'workflow_destination_reached' && (
            <Workflow8DestinationReached
              booking={activeBooking}
              onNext={() => setCurrentScreen('workflow_final_handover')}
              onBack={() => setCurrentScreen('workflow_active_trip')}
            />
          )}

          {currentScreen === 'workflow_final_handover' && (
            <Workflow9FinalCheck
              booking={activeBooking}
              onConfirmed={() => setCurrentScreen('workflow_end_trip')}
              onBack={() => setCurrentScreen('workflow_destination_reached')}
            />
          )}

          {currentScreen === 'workflow_end_trip' && (
            <Workflow10EndTripConfirm
              booking={activeBooking}
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
              onSubmit={(_rating, _feedback) => {
                showToast('Feedback submitted! Wallet updated.');
                setCurrentScreen('dashboard');
              }}
            />
          )}
        </>
      )}

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          showToast('All notifications marked as read');
        }}
      />

      {/* Profile Drawer Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        driver={driver}
        onLogout={handleResetDemo}
      />
    </DeviceFrame>
  );
};

export default App;
