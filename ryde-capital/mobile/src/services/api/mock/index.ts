import {
  DriverProfile,
  RideOffer,
  TripRecord,
  TripState,
  EarningsSummary,
  PayoutAccount,
  EmergencyContact,
  AppNotification,
} from '../types';
import {
  mockDriverProfile,
  createMockOffer,
  mockActiveTrip,
  mockEarningsToday,
  mockAllTrips,
  mockNotifications,
  mockEmergencyContacts,
  mockPayoutAccount,
} from './data';

const delay = (ms: number = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class MockApiClient {
  private driver: DriverProfile = { ...mockDriverProfile };
  private activeOffer: RideOffer | null = null;
  private currentTrip: TripRecord | null = null;
  private contacts: EmergencyContact[] = [...mockEmergencyContacts];
  private payoutAccount: PayoutAccount = { ...mockPayoutAccount };
  private notifications: AppNotification[] = [...mockNotifications];
  private isOnline: boolean = false;

  // Auth Module
  async sendOtp(phone: string): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  }

  async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{ token: string; driver: DriverProfile }> {
    await delay();
    this.driver.phone = phone;
    return {
      token: 'mock-jwt-token-12345',
      driver: this.driver,
    };
  }

  // Driver / Onboarding Module
  async getProfile(): Promise<DriverProfile> {
    await delay();
    return this.driver;
  }

  async updateProfile(updates: Partial<DriverProfile>): Promise<DriverProfile> {
    await delay();
    this.driver = { ...this.driver, ...updates };
    return this.driver;
  }

  async verifyAadhaar(
    _aadhaarNumber: string,
    _otp: string
  ): Promise<{ verified: boolean }> {
    await delay();
    // Aadhaar is never stored or persisted
    return { verified: true };
  }

  async submitOnboarding(): Promise<{ status: 'review' }> {
    await delay();
    this.driver.status = 'review';
    return { status: 'review' };
  }

  // Availability Module
  async setAvailability(online: boolean): Promise<{ isOnline: boolean }> {
    await delay();
    this.isOnline = online;
    if (online && !this.activeOffer && !this.currentTrip) {
      // Auto-schedule an offer after a short realistic interval
      setTimeout(() => {
        if (this.isOnline && !this.currentTrip) {
          this.activeOffer = createMockOffer(25);
        }
      }, 2500);
    }
    return { isOnline: this.isOnline };
  }

  async getAvailability(): Promise<{ isOnline: boolean }> {
    await delay(100);
    return { isOnline: this.isOnline };
  }

  // Assignments / Offer Module
  async getActiveOffer(): Promise<RideOffer | null> {
    await delay(100);
    if (this.activeOffer) {
      const now = Date.now();
      const expires = new Date(this.activeOffer.expiresAt).getTime();
      if (now >= expires) {
        this.activeOffer = null;
      }
    }
    return this.activeOffer;
  }

  async acceptOffer(offerId: string): Promise<TripRecord> {
    await delay();
    this.activeOffer = null;
    this.currentTrip = {
      ...mockActiveTrip,
      id: `trip-${Date.now()}`,
      state: 'assigned',
    };
    return this.currentTrip;
  }

  async rejectOffer(offerId: string): Promise<{ success: boolean }> {
    await delay();
    this.activeOffer = null;
    return { success: true };
  }

  // Trips Module
  async getActiveTrip(): Promise<TripRecord | null> {
    await delay(100);
    return this.currentTrip;
  }

  async updateTripState(
    tripId: string,
    state: TripState,
    payload?: any
  ): Promise<TripRecord> {
    await delay();
    if (!this.currentTrip) {
      this.currentTrip = { ...mockActiveTrip, id: tripId, state };
    } else {
      this.currentTrip.state = state;
      if (payload) {
        Object.assign(this.currentTrip, payload);
      }
    }
    if (state === 'completed' || state.startsWith('cancelled')) {
      const finished = { ...this.currentTrip };
      // After complete, clear current active trip
      setTimeout(() => {
        if (this.currentTrip?.id === tripId) {
          this.currentTrip = null;
        }
      }, 5000);
      return finished;
    }
    return this.currentTrip;
  }

  async verifyArrivalOtp(
    tripId: string,
    otp: string
  ): Promise<{ success: boolean }> {
    await delay();
    // Default valid test OTP is '4569' or any 4 digits
    return { success: true };
  }

  async getTripList(
    filter: 'all' | 'completed' | 'cancelled'
  ): Promise<typeof mockAllTrips> {
    await delay();
    if (filter === 'all') return mockAllTrips;
    return mockAllTrips.filter((t) => t.status === filter);
  }

  // Earnings Module
  async getEarningsSummary(
    period: 'today' | 'week' | 'month'
  ): Promise<EarningsSummary> {
    await delay();
    if (period === 'week') {
      return {
        ...mockEarningsToday,
        period: 'week',
        totalEarnings: 8450,
        tripsCount: 24,
        onlineTimeFormatted: '22h 40m',
      };
    }
    if (period === 'month') {
      return {
        ...mockEarningsToday,
        period: 'month',
        totalEarnings: 34200,
        tripsCount: 98,
        onlineTimeFormatted: '94h 15m',
      };
    }
    return mockEarningsToday;
  }

  async getPayoutAccount(): Promise<PayoutAccount> {
    await delay();
    return this.payoutAccount;
  }

  async savePayoutAccount(account: PayoutAccount): Promise<PayoutAccount> {
    await delay();
    this.payoutAccount = account;
    return this.payoutAccount;
  }

  // Safety Module
  async triggerSos(
    tripId?: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<{ alertId: string; status: 'dispatched' }> {
    await delay();
    return { alertId: `sos-${Date.now()}`, status: 'dispatched' };
  }

  async cancelSos(alertId?: string): Promise<{ success: boolean }> {
    await delay();
    return { success: true };
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    await delay();
    return this.contacts;
  }

  async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact> {
    await delay();
    const created: EmergencyContact = {
      ...contact,
      id: `c-${Date.now()}`,
    };
    this.contacts.push(created);
    return created;
  }

  // Notifications Module
  async getNotifications(): Promise<AppNotification[]> {
    await delay();
    return this.notifications;
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    return { success: true };
  }
}

export const mockApi = new MockApiClient();
export default mockApi;
