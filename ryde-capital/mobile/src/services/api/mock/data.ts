import {
  DriverProfile,
  RideOffer,
  TripRecord,
  EarningsSummary,
  PayoutAccount,
  EmergencyContact,
  AppNotification,
} from '../types';

export const mockDriverProfile: DriverProfile = {
  id: 'driver-arun-01',
  fullName: 'Arun Kumar',
  phone: '+91 98765 43210',
  rating: 4.8,
  totalTrips: 25,
  status: 'approved',
  rejectionReason: 'Your licence photo is blurry. Retake it in good light with all four corners visible.',
  vehicleTypes: ['two_wheeler', 'four_wheeler'],
  documentsVerified: true,
};

export const createMockOffer = (expiresInSeconds: number = 25): RideOffer => ({
  id: `offer-${Date.now()}`,
  fare: 190,
  expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  totalDurationSeconds: 30,
  customer: {
    firstName: 'Venkat',
    rating: 4.5,
    phone: '+91 98400 99999',
  },
  vehicle: {
    type: 'two_wheeler',
    label: "Bike (owner's)",
  },
  pickup: {
    address: 'T. Nagar',
    distanceKm: 1.2,
    latitude: 13.0418,
    longitude: 80.2341,
    etaMinutes: 6,
  },
  drop: {
    address: 'Puzhal',
    distanceKm: 12.4,
    latitude: 13.1537,
    longitude: 80.1989,
    durationMinutes: 28,
  },
});

export const mockActiveTrip: TripRecord = {
  id: 'trip-v-202',
  state: 'heading_to_pickup',
  customer: {
    firstName: 'Venkat',
    rating: 4.5,
    phone: '+91 98400 99999',
  },
  vehicle: {
    type: 'two_wheeler',
    label: "Bike (owner's)",
  },
  pickup: {
    address: 'T. Nagar',
    distanceKm: 1.2,
    latitude: 13.0418,
    longitude: 80.2341,
  },
  drop: {
    address: 'Anna Nagar',
    distanceKm: 5.6,
    latitude: 13.0850,
    longitude: 80.2101,
  },
  fare: 480,
  driverEarnings: 432,
  platformFee: 48,
  distanceKm: 18.6,
  durationMinutes: 42,
  startOdometer: 24560,
  endOdometer: 24579,
  startFuelLevel: 'half',
  endFuelLevel: 'half',
  createdAt: new Date().toISOString(),
};

export const mockEarningsToday: EarningsSummary = {
  period: 'today',
  totalEarnings: 1240,
  tripsCount: 4,
  onlineTimeFormatted: '3h 12m',
  dailySeries: [
    { label: 'M', value: 65 },
    { label: 'T', value: 110 },
    { label: 'W', value: 45 },
    { label: 'T', value: 140 },
    { label: 'F', value: 95 },
    { label: 'S', value: 88 },
    { label: 'S', value: 160, isCurrent: true },
  ],
  recentTrips: [
    { id: 't1', time: '6:10 PM', location: 'T. Nagar', amount: 432 },
    { id: 't2', time: '4:45 PM', location: 'Anna Nagar', amount: 310 },
    { id: 't3', time: '1:20 PM', location: 'Puzhal', amount: 95 },
  ],
};

export const mockAllTrips = [
  {
    id: 'trip-1',
    pickup: 'T. Nagar',
    drop: 'Puzhal',
    fare: 480,
    status: 'completed' as const,
    dateLabel: 'Completed · Today',
  },
  {
    id: 'trip-2',
    pickup: 'Anna Nagar',
    drop: 'T. Nagar',
    fare: 340,
    status: 'completed' as const,
    dateLabel: 'Completed · Today',
  },
  {
    id: 'trip-3',
    pickup: 'Velachery',
    drop: 'Adyar',
    fare: 0,
    status: 'cancelled' as const,
    dateLabel: 'Cancelled · Yesterday',
  },
  {
    id: 'trip-4',
    pickup: 'Guindy',
    drop: 'Porur',
    fare: 410,
    status: 'completed' as const,
    dateLabel: 'Completed · Yesterday',
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Account approved',
    message: 'You can go online and accept bookings.',
    read: false,
    type: 'approval',
    createdAt: '10 mins ago',
  },
  {
    id: 'n2',
    title: 'Payout sent',
    message: '₹3,420 was sent to your UPI ID.',
    read: false,
    type: 'payout',
    createdAt: '2 hours ago',
  },
  {
    id: 'n3',
    title: 'Rate your last trip',
    message: 'Tell us how it went with Venkat.',
    read: true,
    type: 'rate',
    createdAt: 'Yesterday',
  },
  {
    id: 'n4',
    title: 'Licence expires soon',
    message: 'Upload your renewed licence by 30 Nov.',
    read: true,
    type: 'reminder',
    createdAt: '3 days ago',
  },
];

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: 'c1',
    name: 'Meena Kumar',
    relationship: 'Mother',
    phone: '+91 98400 11122',
  },
  {
    id: 'c2',
    name: 'Ravi S.',
    relationship: 'Friend',
    phone: '+91 99620 33445',
  },
];

export const mockPayoutAccount: PayoutAccount = {
  type: 'upi',
  upiId: 'arun@okbank',
  isDefault: true,
};
