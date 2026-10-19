import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, act } from '@testing-library/react-native';
import EmergencyContactsScreen from '../app/safety/emergency-contacts';
import * as ApiService from '../src/services/api';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

describe('Phase 5 Mobile: Safety & Emergency Contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders emergency contacts and displays contact count limit (max 5)', async () => {
    jest.spyOn(ApiService, 'apiClient').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/emergency-contacts') {
        return {
          data: [
            {
              id: 'c-1',
              name: 'Suresh Kumar',
              relationship: 'Brother',
              phone: '+919876543210',
              created_at: new Date().toISOString(),
            },
          ],
        } as never;
      }
      return { data: {} } as never;
    });

    await act(async () => {
      render(<EmergencyContactsScreen />);
    });

    expect(screen.getByText('Emergency Contacts')).toBeTruthy();
    expect(screen.getByText('Contacts (1/5)')).toBeTruthy();
    expect(screen.getByText('Suresh Kumar')).toBeTruthy();
    expect(screen.getByText('Brother')).toBeTruthy();
    expect(screen.getByText('+919876543210')).toBeTruthy();
    expect(screen.getByText('+ Add Contact')).toBeTruthy();
  });
});
