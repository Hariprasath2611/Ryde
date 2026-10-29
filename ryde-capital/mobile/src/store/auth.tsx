import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { apiClient, isUsingMocks, setApiAuthToken } from '../services/api';

export interface DriverRecord {
  id: string;
  driver_code: string;
  verification_status: string;
  onboarding_status?: string;
  rejection_reason?: string | null;
  availability_status: string;
  allowed_vehicle_types?: string[];
  rating_avg?: number;
  rating_count?: number;
}

export interface DriverProfile {
  id: string;
  phone?: string | null;
  email?: string | null;
  full_name?: string | null;
  role: string;
  account_status?: string;
  driver?: DriverRecord | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  driverProfile: DriverProfile | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session and listen for auth changes
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        if (!isUsingMocks) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session && isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            setApiAuthToken(data.session.access_token);
            await fetchDriverProfile(data.session.access_token);
          }
        }
      } catch (err) {
        console.warn('Failed to load active session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setApiAuthToken(newSession?.access_token ?? null);

      if (newSession?.access_token) {
        await fetchDriverProfile(newSession.access_token);
      } else {
        setDriverProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function fetchDriverProfile(token?: string) {
    if (isUsingMocks) {
      setDriverProfile({
        id: user?.id || 'driver-mock-current',
        phone: user?.user_metadata?.phone || '+919790851329',
        email: 'driver@ryde.in',
        full_name: 'Arun Kumar',
        role: 'driver',
        account_status: 'active',
        driver: {
          id: 'driver-rec-mock',
          driver_code: 'DRV-1001',
          verification_status: 'approved',
          onboarding_status: 'approved',
          availability_status: 'online',
          allowed_vehicle_types: ['two_wheeler', 'four_wheeler'],
          rating_avg: 4.8,
          rating_count: 25,
        },
      });
      return;
    }

    try {
      if (token) setApiAuthToken(token);
      const profile = await apiClient<DriverProfile>('/auth/me');
      setDriverProfile(profile);
    } catch (err) {
      console.warn('Failed to fetch driver profile from backend:', err);
    }
  }

  // Format and validate India phone number
  function formatPhone(phoneInput: string): string {
    const cleaned = phoneInput.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return cleaned;
  }

  async function sendOtp(phoneInput: string): Promise<{ success: boolean; error?: string }> {
    try {
      const phone = formatPhone(phoneInput);
      if (!/^\+91[6-9]\d{9}$/.test(phone)) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit Indian mobile number',
        };
      }

      // In mock mode, succeed without calling unconfigured Supabase SMS gateway
      if (isUsingMocks) {
        console.log(`[MockAuth] Verification code '123456' generated for ${phone}`);
        return { success: true };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      return { success: false, error: message };
    }
  }

  async function verifyOtp(
    phoneInput: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const phone = formatPhone(phoneInput);

      if (isUsingMocks) {
        if (token.length !== 6) {
          return { success: false, error: 'Please enter all 6 digits of the verification code' };
        }

        const mockUser: User = {
          id: 'driver-mock-current',
          app_metadata: {},
          user_metadata: { phone, full_name: 'Arun Kumar' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        const mockSession: Session = {
          access_token: 'mock-access-token-driver-current',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser,
        };

        const mockProfile: DriverProfile = {
          id: mockUser.id,
          phone,
          email: 'driver@ryde.in',
          full_name: 'Arun Kumar',
          role: 'driver',
          account_status: 'active',
          driver: {
            id: 'driver-rec-mock',
            driver_code: 'DRV-1001',
            verification_status: 'approved',
            onboarding_status: 'approved',
            availability_status: 'online',
            allowed_vehicle_types: ['two_wheeler', 'four_wheeler'],
            rating_avg: 4.8,
            rating_count: 25,
          },
        };

        setSession(mockSession);
        setUser(mockUser);
        setDriverProfile(mockProfile);
        setApiAuthToken(mockSession.access_token);
        return { success: true };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error || !data.session) {
        return { success: false, error: error?.message || 'Invalid verification code' };
      }

      setSession(data.session);
      setUser(data.session.user);
      setApiAuthToken(data.session.access_token);

      // Call backend complete-signup (idempotent, server enforces driver role)
      try {
        await apiClient('/auth/complete-signup', {
          method: 'POST',
          body: JSON.stringify({ phone }),
        });
      } catch (signupErr) {
        console.warn('Complete-signup endpoint notice:', signupErr);
      }

      // Fetch updated profile
      await fetchDriverProfile(data.session.access_token);

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify OTP';
      return { success: false, error: message };
    }
  }

  async function signOut(): Promise<void> {
    try {
      if (!isUsingMocks) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
      setDriverProfile(null);
      setApiAuthToken(null);
    }
  }

  async function refreshProfile(): Promise<void> {
    if (session?.access_token) {
      await fetchDriverProfile(session.access_token);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        driverProfile,
        isLoading,
        sendOtp,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
