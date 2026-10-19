import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, act } from '@testing-library/react-native';
import EarningsScreen from '../app/(tabs)/earnings';
import * as ApiService from '../src/services/api';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

describe('Phase 5 Mobile: Earnings & Payouts Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders today, week, and month earnings summary and trip breakdown', async () => {
    jest.spyOn(ApiService, 'apiClient').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/earnings/summary')) {
        return {
          data: {
            today: 1450.0,
            thisWeek: 8900.5,
            thisMonth: 34200.0,
            completedTripsCount: 28,
          },
        } as never;
      }
      if (endpoint.includes('/earnings/payout-accounts')) {
        return {
          data: [
            {
              id: 'payout-1',
              account_type: 'upi',
              upi_id: 'driver@okhdfcbank',
              bank_name: null,
              account_number_masked: null,
              ifsc_code: null,
              beneficiary_name: 'Driver Kumar',
              is_default: true,
              verification_status: 'approved',
            },
          ],
        } as never;
      }
      if (endpoint.includes('/earnings')) {
        return {
          earnings: [
            {
              id: 'earn-1',
              trip_id: 'trip-9999-8888',
              gross_amount: 350.0,
              platform_fee: 52.5,
              net_amount: 297.5,
              settlement_status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        } as never;
      }
      return { data: {} } as never;
    });

    await act(async () => {
      render(<EarningsScreen />);
    });

    expect(screen.getByText('Earnings & Payouts')).toBeTruthy();
    expect(screen.getByText('₹1450.00')).toBeTruthy();
    expect(screen.getByText('₹8900.50')).toBeTruthy();
    expect(screen.getByText('₹34200.00')).toBeTruthy();
    expect(screen.getByText(/Total Completed Trips:/)).toBeTruthy();
    expect(screen.getByText('28')).toBeTruthy();
    expect(screen.getByText('+₹297.50')).toBeTruthy();
    expect(screen.getByText('PENDING')).toBeTruthy();
  });
});
