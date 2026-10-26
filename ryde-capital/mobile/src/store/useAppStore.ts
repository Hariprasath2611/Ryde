import { create } from 'zustand';
import { safeStorage } from '../services/storage';
import {
  DriverProfile,
  RideOffer,
  TripRecord,
  TripState,
  AppNotification,
} from '../services/api/types';
import {
  mockDriverProfile,
  createMockOffer,
  mockActiveTrip,
  mockNotifications,
} from '../services/api/mock/data';

const TRIP_STORAGE_KEY = 'ryde_active_trip_state';
const SESSION_STORAGE_KEY = 'ryde_session_token';

export type OnboardingStep = 'profile' | 'verification' | 'vehicles' | 'status';

export interface AppStoreState {
  // Session & Auth
  token: string | null;
  driver: DriverProfile;
  onboardingStep: OnboardingStep;

  // Availability & Location
  isOnline: boolean;
  isOfflineBannerVisible: boolean;

  // Trip & Offer
  currentOffer: RideOffer | null;
  activeTrip: TripRecord | null;

  // Notifications
  notifications: AppNotification[];

  // Actions
  setToken: (token: string | null) => Promise<void>;
  setDriver: (driver: Partial<DriverProfile>) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  setOnline: (online: boolean) => void;
  setOfflineBannerVisible: (visible: boolean) => void;
  setCurrentOffer: (offer: RideOffer | null) => void;
  setActiveTrip: (trip: TripRecord | null) => Promise<void>;
  updateTripState: (state: TripState, payload?: Partial<TripRecord>) => Promise<void>;
  acceptOffer: (offer: RideOffer) => Promise<TripRecord>;
  rejectOffer: () => void;
  loadPersistedState: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  logout: () => Promise<void>;
}

export const getRouteForTripState = (state: TripState, tripId: string): string => {
  switch (state) {
    case 'offered':
      return '/trip/offer';
    case 'assigned':
    case 'heading_to_pickup':
      return `/trip/${tripId}/to-pickup`;
    case 'arrived':
      return `/trip/${tripId}/arrival`;
    case 'otp_verified':
      return `/trip/${tripId}/vehicle-check`;
    case 'handover_done':
    case 'in_progress':
      return `/trip/${tripId}/active`;
    case 'reached':
      return `/trip/${tripId}/final-check`;
    case 'completed':
      return `/trip/${tripId}/summary`;
    case 'cancelled_by_driver':
    case 'cancelled_by_customer':
    case 'cancelled_by_system':
    default:
      return '/(tabs)/home';
  }
};

export const useAppStore = create<AppStoreState>((set, get) => ({
  token: 'mock-initial-token', // default logged in for previewing flow
  driver: { ...mockDriverProfile },
  onboardingStep: 'profile',
  isOnline: false,
  isOfflineBannerVisible: false,
  currentOffer: null,
  activeTrip: null,
  notifications: [...mockNotifications],

  setToken: async (token) => {
    try {
      if (token) {
        await safeStorage.setItemAsync(SESSION_STORAGE_KEY, token);
      } else {
        await safeStorage.deleteItemAsync(SESSION_STORAGE_KEY);
      }
    } catch {}
    set({ token });
  },

  setDriver: (updates) => {
    set((state) => ({
      driver: { ...state.driver, ...updates },
    }));
  },

  setOnboardingStep: (step) => {
    set({ onboardingStep: step });
  },

  setOnline: (online) => {
    set({ isOnline: online });
    if (online && !get().currentOffer && !get().activeTrip) {
      // Trigger a sample booking offer after 3 seconds when driver turns online
      setTimeout(() => {
        if (get().isOnline && !get().activeTrip) {
          set({ currentOffer: createMockOffer(25) });
        }
      }, 3000);
    }
  },

  setOfflineBannerVisible: (visible) => {
    set({ isOfflineBannerVisible: visible });
  },

  setCurrentOffer: (offer) => {
    set({ currentOffer: offer });
  },

  setActiveTrip: async (trip) => {
    try {
      if (trip) {
        await safeStorage.setItemAsync(TRIP_STORAGE_KEY, JSON.stringify(trip));
      } else {
        await safeStorage.deleteItemAsync(TRIP_STORAGE_KEY);
      }
    } catch {}
    set({ activeTrip: trip });
  },

  updateTripState: async (state, payload) => {
    const current = get().activeTrip;
    if (!current) return;

    const updated: TripRecord = {
      ...current,
      ...payload,
      state,
    };

    try {
      if (state === 'completed' || state.startsWith('cancelled')) {
        await safeStorage.deleteItemAsync(TRIP_STORAGE_KEY);
      } else {
        await safeStorage.setItemAsync(TRIP_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}

    set({ activeTrip: updated });
  },

  acceptOffer: async (offer) => {
    const trip: TripRecord = {
      ...mockActiveTrip,
      id: offer.id,
      customer: {
        firstName: offer.customer.firstName,
        rating: offer.customer.rating,
        phone: offer.customer.phone || '+91 98400 99999',
      },
      pickup: {
        address: offer.pickup.address,
        distanceKm: offer.pickup.distanceKm,
        latitude: offer.pickup.latitude,
        longitude: offer.pickup.longitude,
      },
      drop: {
        address: offer.drop.address,
        distanceKm: offer.drop.distanceKm,
        latitude: offer.drop.latitude,
        longitude: offer.drop.longitude,
      },
      fare: offer.fare,
      driverEarnings: Math.round(offer.fare * 0.9),
      platformFee: Math.round(offer.fare * 0.1),
      state: 'assigned',
    };

    await get().setActiveTrip(trip);
    set({ currentOffer: null });
    return trip;
  },

  rejectOffer: () => {
    set({ currentOffer: null });
  },

  loadPersistedState: async () => {
    try {
      const savedTrip = await safeStorage.getItemAsync(TRIP_STORAGE_KEY);
      if (savedTrip) {
        const parsed = JSON.parse(savedTrip) as TripRecord;
        set({ activeTrip: parsed });
      }
      const savedToken = await safeStorage.getItemAsync(SESSION_STORAGE_KEY);
      if (savedToken) {
        set({ token: savedToken });
      }
    } catch (e) {
      console.warn('Failed to load persisted state:', e);
    }
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
      await SecureStore.deleteItemAsync(TRIP_STORAGE_KEY);
    } catch {}
    set({
      token: null,
      isOnline: false,
      currentOffer: null,
      activeTrip: null,
    });
  },
}));

export default useAppStore;
