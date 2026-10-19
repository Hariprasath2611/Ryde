import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import TripScreen from '../app/trip/index';
import * as ApiService from '../src/services/api';
import * as MapsHandoff from '../src/services/maps-handoff';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({ id: 'trip-test-123' })),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
      fitToCoordinates: jest.fn(),
    }));
    return <View testID="mock-map-view" {...props} />;
  });
  const MockMarker = (props: any) => <View testID="mock-marker" {...props} />;
  const MockPolyline = (props: any) => <View testID="mock-polyline" {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    PROVIDER_GOOGLE: 'google',
  };
});

describe('Mobile Trip Lifecycle Screen (Task 4)', () => {
  const baseTripData = {
    id: 'trip-test-123',
    trip_status: 'heading_to_pickup',
    booking: {
      id: 'bk-123',
      pickup_address: 'Koramangala 5th Block',
      pickup_location: { coordinates: [77.6200, 12.9300] },
      destination_address: 'Indiranagar 100ft Rd',
      destination_location: { coordinates: [77.6400, 12.9700] },
      estimated_fare: 280,
      vehicle_type: 'four_wheeler',
    },
    vehicle: {
      make: 'Hyundai',
      model: 'Creta',
      license_plate: 'KA-01-MJ-5566',
      vehicle_type: 'four_wheeler',
    },
    customer: {
      id: 'cust-123',
      full_name: 'Rahul Sharma',
      phone: '+919876543210',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading_to_pickup with Navigate in Google Maps button', async () => {
    jest.spyOn(ApiService, 'apiClient').mockImplementation(async (path: string) => {
      if (path.includes('/route')) {
        return { data: { polyline: 'test_poly' } } as never;
      }
      return { data: baseTripData } as never;
    });

    await act(async () => {
      render(<TripScreen />);
    });

    expect(screen.getByText('Pickup & Verification')).toBeTruthy();
    expect(screen.getByText(/Koramangala 5th Block/)).toBeTruthy();
    expect(screen.getByText(/Navigate to Pickup in Google Maps/)).toBeTruthy();
    expect(screen.getByText(/I've Arrived at Pickup/)).toBeTruthy();
  });

  it('invokes openRouteInGoogleMaps when Navigate button is pressed', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({ data: baseTripData } as never);
    const handoffSpy = jest.spyOn(MapsHandoff, 'openRouteInGoogleMaps').mockResolvedValue({
      success: true,
      fallbackUsed: false,
    });

    await act(async () => {
      render(<TripScreen />);
    });

    const navBtn = screen.getByText(/Navigate to Pickup in Google Maps/);
    await act(async () => {
      fireEvent.press(navBtn);
    });

    expect(handoffSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: 'trip-test-123',
        leg: 'pickup',
        isTripActiveAndAccepted: true,
      }),
    );
  });

  it('renders arrived state with waiting timer and OTP input', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: {
        ...baseTripData,
        trip_status: 'arrived',
        waiting_started_at: new Date(Date.now() - 60000).toISOString(),
      },
    } as never);

    await act(async () => {
      render(<TripScreen />);
    });

    expect(screen.getByText(/Waiting at Pickup/)).toBeTruthy();
    expect(screen.getByText(/Enter Customer Trip Start OTP/)).toBeTruthy();
    expect(screen.getByText(/Verify OTP & Proceed/)).toBeTruthy();
  });

  it('renders otp_verified state with vehicle handover inspection checklist', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: {
        ...baseTripData,
        trip_status: 'otp_verified',
      },
    } as never);

    await act(async () => {
      render(<TripScreen />);
    });

    expect(screen.getByText(/Customer Vehicle Handover/)).toBeTruthy();
    expect(screen.getByText(/Initial Odometer Reading/)).toBeTruthy();
    expect(screen.getByText('FRONT')).toBeTruthy();
    expect(screen.getByText('BACK')).toBeTruthy();
    expect(screen.getByText('ODOMETER')).toBeTruthy();
    expect(screen.getByText(/Complete Vehicle Handover/)).toBeTruthy();
  });

  it('renders in_progress state with active trip destination and SOS', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: {
        ...baseTripData,
        trip_status: 'in_progress',
        started_at: new Date(Date.now() - 300000).toISOString(),
      },
    } as never);

    await act(async () => {
      render(<TripScreen />);
    });

    expect(screen.getByText('On Trip to Destination')).toBeTruthy();
    expect(screen.getByText(/Indiranagar 100ft Rd/)).toBeTruthy();
    expect(screen.getByText(/Navigate to Drop in Google Maps/)).toBeTruthy();
    expect(screen.getByText(/SOS/)).toBeTruthy();
    expect(screen.getByText(/Complete & End Trip/)).toBeTruthy();
  });

  it('renders completed state with itemized fare breakdown', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: {
        ...baseTripData,
        trip_status: 'completed',
        fare: {
          base_fare: 80,
          distance_charge: 160,
          time_charge: 50,
          waiting_charge: 0,
          tax: 14.5,
          total_amount: 304.5,
        },
      },
    } as never);

    await act(async () => {
      render(<TripScreen />);
    });

    expect(screen.getByText(/Trip Completed Successfully/)).toBeTruthy();
    expect(screen.getByText('₹304.50')).toBeTruthy();
    expect(screen.getByText('Base Fare')).toBeTruthy();
    expect(screen.getByText('₹160.00')).toBeTruthy();
    expect(screen.getByText('Go Online / Next Trip')).toBeTruthy();
  });
});
