import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { BookingRequest, VehicleHandoverData, BottomNavTab } from '../types';

/* -------------------------------------------------------------------------- */
/* REUSABLE DARK NAVIGATION MAP (Figma Style)                                */
/* -------------------------------------------------------------------------- */
interface DarkRouteMapProps {
  etaText?: string;
  etaTime?: string;
  destinationLabel?: string;
}

const DarkRouteMap: React.FC<DarkRouteMapProps> = ({
  etaText = '2.4 km • 8 min',
  etaTime = 'ETA: 10:42 AM',
  destinationLabel = 'Customer',
}) => {
  return (
    <View style={styles.mapCard}>
      <Svg width="100%" height={210} viewBox="0 0 340 210">
        {/* Deep Slate Navy Map Base */}
        <Rect x="0" y="0" width="340" height="210" rx="16" fill="#131B26" />

        {/* Subdued Road Grid */}
        <Path d="M 0 50 L 340 50" stroke="#1E2A3C" strokeWidth="8" />
        <Path d="M 0 110 L 340 110" stroke="#1E2A3C" strokeWidth="12" />
        <Path d="M 0 170 L 340 170" stroke="#1E2A3C" strokeWidth="9" />
        <Path d="M 70 0 L 70 210" stroke="#1E2A3C" strokeWidth="8" />
        <Path d="M 170 0 L 170 210" stroke="#1E2A3C" strokeWidth="14" />
        <Path d="M 270 0 L 270 210" stroke="#1E2A3C" strokeWidth="9" />

        {/* Minor diagonal streets */}
        <Path d="M 0 20 L 120 140" stroke="#1A2434" strokeWidth="4" />
        <Path d="M 200 40 L 340 180" stroke="#1A2434" strokeWidth="4" />

        {/* Road Label Text */}
        <SvgText x="180" y="42" fill="#3D506A" fontSize="8" fontWeight="bold">
          Anna Nagar
        </SvgText>
        <SvgText x="80" y="102" fill="#3D506A" fontSize="7">
          10th Main Rd
        </SvgText>
        <SvgText x="275" y="130" fill="#3D506A" fontSize="7">
          East Coast
        </SvgText>

        {/* Vibrant Blue Navigation Path */}
        <Path
          d="M 55 170 L 170 170 L 170 80 L 255 80"
          stroke="#0284C7"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M 55 170 L 170 170 L 170 80 L 255 80"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Driver Origin Marker (You) */}
        <Circle cx="55" cy="170" r="12" fill="rgba(56, 189, 248, 0.25)" />
        <Circle cx="55" cy="170" r="7" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />

        {/* Destination Red Pin */}
        <Circle cx="255" cy="80" r="9" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
        <Circle cx="255" cy="80" r="3" fill="#FFFFFF" />

        {/* Destination Tag */}
        <Rect x="225" y="58" width="60" height="16" rx="4" fill="#EF4444" />
        <SvgText x="255" y="69" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
          {destinationLabel}
        </SvgText>
      </Svg>

      {/* Floating Top-Left ETA Badge */}
      <View style={styles.floatingEta}>
        <View style={styles.etaHeaderRow}>
          <Feather name="navigation" size={13} color="#38BDF8" />
          <Text style={styles.floatingEtaText}>{etaText}</Text>
        </View>
        <Text style={styles.floatingEtaTime}>{etaTime}</Text>
      </View>

      {/* Crosshair recenter button */}
      <View style={styles.recenterBtn}>
        <Feather name="crosshair" size={14} color="#94A3B8" />
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 1: Booking Accepted Confirmation                                      */
/* -------------------------------------------------------------------------- */
export const Workflow1BookingAccepted: React.FC<{
  booking: BookingRequest;
  onNext: () => void;
  onBack: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onNext, onBack, onNavigate }) => {
  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <View style={styles.centerContainer}>
        <View style={styles.successCircle}>
          <Feather name="check" size={38} color="#075B64" />
        </View>
        <Text style={styles.screenTitle}>Booking Accepted</Text>
        <Text style={styles.screenSubtitle}>
          Trip #{booking.id} assigned. Customer has been notified.
        </Text>

        <View style={styles.tealCardContainer}>
          <Text style={styles.pickupLabelSmall}>Customer</Text>
          <Text style={styles.locationTitle}>{booking.customerName}</Text>
          <View style={{ height: 1, backgroundColor: 'rgba(7, 91, 100, 0.15)', marginVertical: 8 }} />
          <Text style={styles.pickupLabelSmall}>Pickup Location</Text>
          <Text style={styles.locationTitle}>📍 {booking.pickupLocation}</Text>
        </View>

        <TouchableOpacity onPress={onNext} style={styles.amberBtn}>
          <Text style={styles.amberBtnText}>Navigate to Customer →</Text>
        </TouchableOpacity>
      </View>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* ANDROID MEDIUM - 12: TO CUSTOMER (Figma 1:1)                              */
/* -------------------------------------------------------------------------- */
export const Workflow2PickupDetails: React.FC<{
  booking: BookingRequest;
  onArrived: () => void;
  onBack: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onArrived, onBack, onNavigate }) => {
  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Page Heading */}
        <Text style={styles.screenTitle}>To Customer</Text>

        {/* Dark Route Map */}
        <DarkRouteMap
          etaText="2.4 km • 8 min"
          etaTime="ETA: 10:42 AM"
          destinationLabel="Customer"
        />

        {/* Pickup Location & Customer Card */}
        <View style={styles.tealCardContainer}>
          {/* Pickup Location Row */}
          <View style={styles.pickupHeaderRow}>
            <Text style={styles.pickupLabelSmall}>Pickup Location</Text>
            <Feather name="chevron-right" size={16} color="#075B64" />
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#075B64" style={{ marginRight: 4 }} />
            <Text style={styles.locationTitle}>{booking.pickupLocation || 'T.Nagar'}</Text>
          </View>

          {/* Customer Row */}
          <View style={styles.customerRow}>
            <View style={styles.custLeft}>
              <View style={styles.custAvatarCircle}>
                <Ionicons name="person" size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.custNameText}>{booking.customerName || 'Venkat'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#075B64" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{booking.customerRating || '4.5'}</Text>
            </View>
          </View>

          {/* Call & Message Action Buttons */}
          <View style={styles.commBtnRow}>
            <TouchableOpacity
              onPress={() => Alert.alert('Calling Customer', `Dialing ${booking.customerPhone}...`)}
              style={styles.whitePillBtn}
              activeOpacity={0.7}
            >
              <Feather name="phone" size={14} color="#075B64" style={{ marginRight: 6 }} />
              <Text style={styles.whitePillBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert('Message Sent', 'Notification sent to customer.')}
              style={styles.whitePillBtn}
              activeOpacity={0.7}
            >
              <Feather name="message-square" size={14} color="#075B64" style={{ marginRight: 6 }} />
              <Text style={styles.whitePillBtnText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Big Arrived Pill Button */}
          <TouchableOpacity onPress={onArrived} style={styles.amberBtn} activeOpacity={0.8}>
            <Ionicons name="location-sharp" size={16} color="#075B64" style={{ marginRight: 6 }} />
            <Text style={styles.amberBtnText}>ARRIVED</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* ANDROID MEDIUM - 13: CUSTOMER ARRIVAL (Figma 1:1)                          */
/* -------------------------------------------------------------------------- */
export const Workflow3ArrivedPickup: React.FC<{
  booking: BookingRequest;
  onProceedToOtp: () => void;
  onBack: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onProceedToOtp, onBack, onNavigate }) => {
  const [otpDigits, setOtpDigits] = useState(['4', '5', '6', '9']);

  const handleConfirmArrival = () => {
    onProceedToOtp();
  };

  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.screenTitle}>Customer Arrival</Text>

        {/* Top "You've Arrived" Card */}
        <View style={styles.tealCardContainer}>
          <View style={styles.centerAligned}>
            <View style={styles.arrivalCheckCircle}>
              <Feather name="check" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.arrivedHeading}>You've Arrived</Text>
            <Text style={styles.arrivedSubtitle}>
              Ask the customer for the 4-digit arrival OTP
            </Text>
          </View>

          {/* Customer info inside card */}
          <View style={styles.customerArrivalRow}>
            <View style={styles.custLeft}>
              <View style={styles.custAvatarCircle}>
                <Ionicons name="person" size={15} color="#FFFFFF" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.custNameText}>{booking.customerName || 'Venkat'}</Text>
                  <View style={[styles.ratingBadge, { marginLeft: 8, paddingVertical: 1, paddingHorizontal: 5 }]}>
                    <Ionicons name="star" size={10} color="#075B64" />
                    <Text style={[styles.ratingText, { fontSize: 10 }]}>{booking.customerRating || '4.5'}</Text>
                  </View>
                </View>
                <Text style={styles.locationSubtitle}>📍 {booking.pickupLocation || 'T.Nagar'}</Text>
              </View>
            </View>

            <View style={styles.circleActions}>
              <TouchableOpacity
                onPress={() => Alert.alert('Calling', booking.customerPhone)}
                style={styles.iconCircleSmall}
              >
                <Feather name="phone" size={13} color="#075B64" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Alert.alert('Messaging', 'Customer notified.')}
                style={styles.iconCircleSmall}
              >
                <Feather name="message-square" size={13} color="#075B64" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom "Enter Arrival OTP" Card */}
        <View style={[styles.tealCardContainer, { marginTop: 14 }]}>
          <Text style={styles.otpHeaderTitle}>Enter Arrival OTP</Text>

          {/* 4 Square Input Boxes */}
          <View style={styles.otpSquaresRow}>
            {otpDigits.map((digit, idx) => (
              <View key={idx} style={styles.otpSquare}>
                <TextInput
                  value={digit}
                  onChangeText={(val) => {
                    const copy = [...otpDigits];
                    copy[idx] = val.slice(-1);
                    setOtpDigits(copy);
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  style={styles.otpSquareText}
                  textAlign="center"
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Help', 'Demo OTP: ' + (booking.customerOtp || '4569'))}
            style={styles.otpHelpLink}
          >
            <Text style={styles.otpHelpText}>Didn't receive OTP? Help &gt;</Text>
          </TouchableOpacity>

          {/* Confirm Arrival Button */}
          <TouchableOpacity onPress={handleConfirmArrival} style={styles.amberBtn} activeOpacity={0.8}>
            <Text style={styles.amberBtnText}>Confirm Arrival</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* Compatibility Alias */
export const Workflow4CustomerOtp = Workflow3ArrivedPickup;

/* -------------------------------------------------------------------------- */
/* ANDROID MEDIUM - 14: VEHICLE CHECK (Figma 1:1)                            */
/* -------------------------------------------------------------------------- */
export const Workflow5VehicleHandover: React.FC<{
  booking: BookingRequest;
  onChecklistComplete: (data: VehicleHandoverData) => void;
  onBack: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onChecklistComplete, onBack, onNavigate }) => {
  const [fuelSelection, setFuelSelection] = useState<'Empty' | 'Half' | 'Full'>('Half');
  const [odometerVal, setOdometerVal] = useState('24,560 km');
  const [hasPhoto, setHasPhoto] = useState(false);

  const handleCompleteCheck = () => {
    onChecklistComplete({
      fuelLevel: fuelSelection === 'Empty' ? 10 : fuelSelection === 'Half' ? 50 : 95,
      odometerReading: odometerVal.replace(/\D/g, '') || '24560',
      odometerPhoto: 'odo.jpg',
      frontPhoto: 'front.jpg',
      rearPhoto: 'rear.jpg',
      interiorPhoto: 'interior.jpg',
      existingScratchesChecked: true,
      acWorking: true,
      cleanlinessChecked: true,
    });
  };

  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.screenTitle}>Vehicle Check</Text>

        {/* Section 1: Fuel */}
        <View style={styles.mediumTealCard}>
          <Text style={styles.sectionHeaderTitle}>Fuel</Text>
          <View style={styles.fuelSegmentRow}>
            {(['Empty', 'Half', 'Full'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setFuelSelection(level)}
                style={[
                  styles.fuelSegmentBtn,
                  fuelSelection === level && styles.fuelSegmentBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.fuelSegmentText,
                    fuelSelection === level && styles.fuelSegmentTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 2: Odometer */}
        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Odometer</Text>
          <View style={styles.odometerBox}>
            <TextInput
              value={odometerVal}
              onChangeText={setOdometerVal}
              style={styles.odometerInput}
            />
          </View>
        </View>

        {/* Section 3: Vehicle Photos */}
        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Vehicle Photos</Text>
          <TouchableOpacity
            onPress={() => {
              setHasPhoto(true);
              Alert.alert('Photo Captured', 'Vehicle inspection photo attached.');
            }}
            style={styles.uploadCard}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIconBox}>
              <Feather name="upload-cloud" size={32} color="#075B64" />
            </View>
            <View style={styles.uploadTextBox}>
              <Text style={styles.uploadTitle}>
                {hasPhoto ? '✓ Photo Attached' : 'Upload Image'}
              </Text>
              <View style={styles.uploadFormatBadge}>
                <Text style={styles.uploadFormatText}>JPG / PNG / PDF</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Button: Check Completed */}
        <TouchableOpacity
          onPress={handleCompleteCheck}
          style={[styles.amberBtn, { marginTop: 24 }]}
          activeOpacity={0.8}
        >
          <Text style={styles.amberBtnText}>check completed</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* Compatibility Alias */
export const Workflow6StartTripConfirm: React.FC<{
  booking: BookingRequest;
  onStartTrip: () => void;
  onBack: () => void;
}> = ({ onStartTrip }) => {
  useEffect(() => {
    onStartTrip();
  }, []);
  return null;
};

/* -------------------------------------------------------------------------- */
/* ANDROID MEDIUM - 15: ACTIVE TRIP (Figma 1:1)                               */
/* -------------------------------------------------------------------------- */
export const Workflow7ActiveTripMap: React.FC<{
  booking: BookingRequest;
  onDestinationReached: () => void;
  onBack?: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onDestinationReached, onBack, onNavigate }) => {
  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.screenTitle}>Active Trip</Text>

        {/* Dark Route Map */}
        <DarkRouteMap
          etaText="2.4 km • 8 min"
          etaTime="ETA: 10:42 AM"
          destinationLabel="Anna Nagar"
        />

        {/* Destination Card */}
        <View style={styles.tealCardContainer}>
          <Text style={styles.pickupLabelSmall}>Destination</Text>
          <View style={styles.destinationTitleRow}>
            <Ionicons name="flag-sharp" size={15} color="#075B64" style={{ marginRight: 6 }} />
            <Text style={styles.locationTitle}>{booking.destination || 'Anna Nagar'}</Text>
          </View>

          {/* Stats Row: 20 min | 5.6km */}
          <View style={styles.statsCardRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>20 min</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{booking.distance || '5.6km'}</Text>
            </View>
          </View>

          {/* Reached Action Button */}
          <TouchableOpacity
            onPress={onDestinationReached}
            style={[styles.amberBtn, { marginTop: 18 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.amberBtnText}>Reached</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* ANDROID MEDIUM - 16: DESTINATION REACHED (Figma 1:1)                       */
/* -------------------------------------------------------------------------- */
export const Workflow8DestinationReached: React.FC<{
  booking: BookingRequest;
  onNext?: () => void;
  onBack: () => void;
  onEndTrip?: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onNext, onBack, onEndTrip, onNavigate }) => {
  const [fuelChecked, setFuelChecked] = useState(true);
  const [odometerChecked, setOdometerChecked] = useState(true);
  const [vehicleCheckDone, setVehicleCheckDone] = useState(true);
  const [checkCompleted, setCheckCompleted] = useState(false);

  const handleCheckCompleted = () => {
    setCheckCompleted(true);
    Alert.alert('Verification Confirmed', 'All return checklists verified.');
  };

  const handleFinalEnd = () => {
    if (onEndTrip) {
      onEndTrip();
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showBack onBack={onBack} showActions />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Title with Checkbox Icon */}
        <View style={styles.titleWithCheckRow}>
          <Text style={styles.screenTitle}>Destination Reached</Text>
          <View style={styles.titleCheckIcon}>
            <Feather name="check-square" size={20} color="#075B64" />
          </View>
        </View>

        {/* Final Check Card */}
        <View style={styles.mediumTealCard}>
          <Text style={styles.sectionHeaderTitle}>Final Check</Text>

          {/* Check Item 1: Fuel */}
          <TouchableOpacity
            onPress={() => setFuelChecked(!fuelChecked)}
            style={styles.finalCheckRow}
            activeOpacity={0.7}
          >
            <View style={[styles.boxCheckbox, fuelChecked && styles.boxCheckboxChecked]}>
              {fuelChecked && <Feather name="check" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.finalCheckLabel}>Fuel</Text>
          </TouchableOpacity>

          {/* Check Item 2: Odometer */}
          <TouchableOpacity
            onPress={() => setOdometerChecked(!odometerChecked)}
            style={styles.finalCheckRow}
            activeOpacity={0.7}
          >
            <View style={[styles.boxCheckbox, odometerChecked && styles.boxCheckboxChecked]}>
              {odometerChecked && <Feather name="check" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.finalCheckLabel}>Odometer</Text>
          </TouchableOpacity>

          {/* Check Item 3: Vehicle Check */}
          <TouchableOpacity
            onPress={() => setVehicleCheckDone(!vehicleCheckDone)}
            style={styles.finalCheckRow}
            activeOpacity={0.7}
          >
            <View style={[styles.boxCheckbox, vehicleCheckDone && styles.boxCheckboxChecked]}>
              {vehicleCheckDone && <Feather name="check" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.finalCheckLabel}>Vehicle Check</Text>
          </TouchableOpacity>
        </View>

        {/* Button 1: Check Completed */}
        <TouchableOpacity
          onPress={handleCheckCompleted}
          style={[styles.amberBtn, { marginTop: 24 }]}
          activeOpacity={0.8}
        >
          <Text style={styles.amberBtnText}>
            {checkCompleted ? '✓ Check Completed' : 'Check Completed'}
          </Text>
        </TouchableOpacity>

        {/* Button 2: End Trip */}
        <TouchableOpacity
          onPress={handleFinalEnd}
          style={styles.darkTealBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.darkTealBtnText}>End Trip</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* Compatibility Aliases */
export const Workflow9FinalCheck = Workflow8DestinationReached;
export const Workflow10EndTripConfirm = Workflow8DestinationReached;

/* -------------------------------------------------------------------------- */
/* STEP 11: Driver Earnings & Payment Status                                  */
/* -------------------------------------------------------------------------- */
export const Workflow11EarningsPayment: React.FC<{
  booking: BookingRequest;
  onProceedToFeedback: () => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onProceedToFeedback, onNavigate }) => {
  const driverPayout = Math.round((booking.estimatedFare || 650) * 0.85);

  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showActions />

      <View style={styles.centerContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="wallet-outline" size={36} color="#075B64" />
        </View>

        <Text style={styles.screenTitle}>Payment Credited</Text>
        <Text style={styles.screenSubtitle}>Added directly to your Ryde wallet</Text>

        <Text style={styles.hugePayoutText}>₹{driverPayout}</Text>

        <View style={styles.tealCardContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Trip Fare</Text>
            <Text style={styles.summaryValue}>₹{booking.estimatedFare || 650}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Commission (15%)</Text>
            <Text style={styles.summaryValue}>-₹{(booking.estimatedFare || 650) - driverPayout}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(7, 91, 100, 0.2)', marginVertical: 8 }} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: '900' }]}>Net Earnings</Text>
            <Text style={[styles.summaryValue, { color: '#075B64', fontWeight: '900', fontSize: 16 }]}>
              ₹{driverPayout}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onProceedToFeedback} style={styles.amberBtn}>
          <Text style={styles.amberBtnText}>Rate Customer →</Text>
        </TouchableOpacity>
      </View>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 12: Customer Rating & Feedback                                        */
/* -------------------------------------------------------------------------- */
export const Workflow12RatingFeedback: React.FC<{
  booking: BookingRequest;
  onSubmit: (rating: number, feedback: string) => void;
  onNavigate?: (tab: BottomNavTab) => void;
}> = ({ booking, onSubmit, onNavigate }) => {
  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Polite Customer', 'On Time']);
  const tags = ['Polite Customer', 'On Time', 'Clean Car', 'Respectful'];

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((x) => x !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <CornerDecorations />
      <Header showActions />

      <View style={styles.centerContainer}>
        <Text style={styles.screenTitle}>Rate Customer</Text>
        <Text style={styles.screenSubtitle}>
          How was your experience with {booking.customerName || 'Venkat'}?
        </Text>

        {/* 5 Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setStars(s)}>
              <Ionicons
                name="star"
                size={36}
                color={s <= stars ? '#F5B83D' : '#CBD5E1'}
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {tags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <TouchableOpacity
                key={t}
                onPress={() => toggleTag(t)}
                style={[styles.tagPill, active && styles.tagPillActive]}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => onSubmit(stars, selectedTags.join(', '))}
          style={styles.amberBtn}
        >
          <Text style={styles.amberBtnText}>Submit & Return Home</Text>
        </TouchableOpacity>
      </View>

      <BottomNav
        activeTab="trips"
        onTabChange={(t) => onNavigate?.(t)}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* STYLES (Matching Figma Android Medium 12-16 Exactly)                      */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#DDF0F0',
    justifyContent: 'space-between',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#075B64',
    marginBottom: 12,
  },
  screenSubtitle: {
    fontSize: 13,
    color: 'rgba(7, 91, 100, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleWithCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleCheckIcon: {
    marginLeft: 6,
    marginBottom: 10,
  },

  /* Map Card */
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(7, 91, 100, 0.15)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floatingEta: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(19, 27, 38, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  etaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingEtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingEtaTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 27, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Cards */
  tealCardContainer: {
    backgroundColor: '#9CC8C8',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    width: '100%',
  },
  mediumTealCard: {
    backgroundColor: '#7FAFAF',
    borderRadius: 16,
    padding: 18,
  },
  pickupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pickupLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(7, 91, 100, 0.8)',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#075B64',
  },
  destinationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 91, 100, 0.15)',
    marginBottom: 10,
  },
  customerArrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 91, 100, 0.15)',
  },
  custLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  custAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#075B64',
    alignItems: 'center',
    justifyContent: 'center',
  },
  custNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#075B64',
  },
  locationSubtitle: {
    fontSize: 11,
    color: 'rgba(7, 91, 100, 0.75)',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDF0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075B64',
  },
  circleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Buttons */
  commBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  whitePillBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePillBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#075B64',
  },
  amberBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5B83D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#F5B83D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  amberBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#075B64',
    letterSpacing: 0.5,
  },
  darkTealBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#075B64',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  darkTealBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Customer Arrival */
  centerAligned: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  arrivalCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7FAFAF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  arrivedHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#075B64',
  },
  arrivedSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(7, 91, 100, 0.8)',
    marginTop: 2,
  },
  otpHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075B64',
    marginBottom: 12,
  },
  otpSquaresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  otpSquare: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  otpSquareText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#075B64',
    width: '100%',
    height: '100%',
  },
  otpHelpLink: {
    alignItems: 'center',
    marginBottom: 14,
  },
  otpHelpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#075B64',
  },

  /* Vehicle Check */
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#075B64',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#075B64',
    marginBottom: 8,
  },
  fuelSegmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fuelSegmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  fuelSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
  },
  fuelSegmentTextActive: {
    fontWeight: '900',
    color: '#075B64',
  },
  odometerBox: {
    backgroundColor: '#9CC8C8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  odometerInput: {
    fontSize: 16,
    fontWeight: '900',
    color: '#075B64',
  },
  uploadCard: {
    backgroundColor: '#9CC8C8',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  uploadIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextBox: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
  },
  uploadFormatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  uploadFormatText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Active Trip Stats */
  statsCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 91, 100, 0.15)',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#075B64',
  },

  /* Final Check */
  finalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  boxCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#075B64',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  boxCheckboxChecked: {
    backgroundColor: '#075B64',
  },
  finalCheckLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
  },

  /* Earnings & Feedback */
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(7, 91, 100, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hugePayoutText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#075B64',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#075B64',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#9CC8C8',
  },
  tagPillActive: {
    backgroundColor: '#075B64',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#075B64',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
});
