/**
 * Ryde Capital API Client
 *
 * Configured with base URL from environment and automatically attaches
 * the active Supabase JWT session token to all outbound requests.
 */

let activeAuthToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  activeAuthToken = token;
}

export function getApiAuthToken(): string | null {
  return activeAuthToken;
}

export const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:4000/api/v1';
export const isUsingMocks = process.env['EXPO_PUBLIC_USE_MOCKS'] !== 'false';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function getMockData<T>(endpoint: string): T | undefined {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (path === '/auth/me') {
    return {
      id: 'driver-mock-current',
      phone: '+919790851329',
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
    } as unknown as T;
  }

  if (path === '/drivers/me') {
    return {
      driver: {
        id: 'driver-rec-mock',
        driver_code: 'DRV-1001',
        verification_status: 'approved',
        onboarding_status: 'approved',
        allowed_vehicle_types: ['two_wheeler', 'four_wheeler'],
        date_of_birth: '1995-01-01',
        address_line: '123 Anna Salai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600002',
        experience_years: 3,
      },
      profile: {
        full_name: 'Arun Kumar',
      },
      onboarding: {
        status: 'approved',
        rejectionReason: null,
        submittedAt: '2026-01-01T00:00:00Z',
        progressPercentage: 100,
        completedStepsCount: 5,
        totalStepsCount: 5,
        canSubmit: false,
        steps: {
          personalDetails: { name: 'Personal Details', status: 'completed', details: {} },
          vehicleTypes: { name: 'Vehicle Types', status: 'completed', details: {} },
          idProof: { name: 'ID Proof', status: 'completed', details: { maskedReference: 'XXXX XXXX 1234' } },
          license: {
            name: 'Driving Licence',
            status: 'completed',
            details: {
              frontFilePath: 'lic_f.jpg',
              backFilePath: 'lic_b.jpg',
              licenseNumber: 'TN0120200001234',
              expiryDate: '2032-12-31',
            },
          },
          selfie: { name: 'Profile Photo', status: 'completed', details: {} },
        },
      },
    } as unknown as T;
  }

  if (path === '/auth/complete-signup') {
    return { success: true } as unknown as T;
  }

  if (path.startsWith('/drivers/me/location')) {
    return { success: true, data: { accepted: 1 } } as unknown as T;
  }

  if (path === '/notifications/device-token') {
    return { success: true } as unknown as T;
  }

  if (path.includes('/assignments') && path.endsWith('/route')) {
    return {
      data: {
        distanceMeters: 4500,
        durationSeconds: 720,
        pickupAddress: '100 Feet Rd, Indiranagar',
        destinationAddress: 'Sony Signal, Koramangala',
        pickupCoords: { latitude: 12.9716, longitude: 77.5946 },
        destinationCoords: { latitude: 12.9352, longitude: 77.6190 },
        polyline: 'oodnAgerxMfh@_g@n}@_q@n}@g^f|@g^',
      },
    } as unknown as T;
  }

  return undefined;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (isUsingMocks && (!activeAuthToken || activeAuthToken.startsWith('mock-'))) {
    const mockData = getMockData<T>(cleanEndpoint);
    if (mockData !== undefined) {
      return mockData;
    }
  }

  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  if (activeAuthToken) {
    requestHeaders.set('Authorization', `Bearer ${activeAuthToken}`);
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    if (!response.ok) {
      if (isUsingMocks) {
        const fallback = getMockData<T>(cleanEndpoint);
        if (fallback !== undefined) return fallback;
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody?.error?.message || `API request failed with status ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (isUsingMocks) {
      const fallback = getMockData<T>(cleanEndpoint);
      if (fallback !== undefined) return fallback;
    }
    throw err;
  }
}
