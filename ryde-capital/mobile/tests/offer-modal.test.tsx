import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { OfferModal, type OfferAssignment } from '../src/components/OfferModal';
import * as ApiService from '../src/services/api';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
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

describe('OfferModal Component (Phase 3 Ride Offers)', () => {
  const mockOffer: OfferAssignment = {
    id: 'assign-100',
    booking_id: 'book-100',
    distance_to_customer_m: 1500,
    estimated_arrival_s: 360,
    expires_at: new Date(Date.now() + 20000).toISOString(),
    booking: {
      id: 'book-100',
      pickup_address: '100 Feet Rd, Indiranagar',
      pickup_location: { latitude: 12.9716, longitude: 77.5946 },
      destination_address: 'Sony Signal, Koramangala',
      destination_location: { latitude: 12.9352, longitude: 77.6190 },
      estimated_fare: 450,
      vehicle_type: 'four_wheeler',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders offer details including fare, vehicle type, and addresses', async () => {
    await act(async () => {
      render(
        <OfferModal
          visible={true}
          offer={mockOffer}
          onAcceptSuccess={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    });

    expect(screen.getByTestId('offer-modal-container')).toBeTruthy();
    expect(screen.getByTestId('offer-fare')).toBeTruthy();
    expect(screen.getByText('₹450')).toBeTruthy();
    expect(screen.getByText('FOUR WHEELER')).toBeTruthy();
    expect(screen.getByText('100 Feet Rd, Indiranagar')).toBeTruthy();
    expect(screen.getByText('Sony Signal, Koramangala')).toBeTruthy();
    expect(screen.getByText('1.5 km')).toBeTruthy();
    expect(screen.getByText('6 mins')).toBeTruthy();
  });

  it('triggers haptic warning when offer appears', async () => {
    await act(async () => {
      render(
        <OfferModal
          visible={true}
          offer={mockOffer}
          onAcceptSuccess={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    });

    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it('calls accept API and executes onAcceptSuccess when Accept is pressed', async () => {
    const onAcceptSuccess = jest.fn();
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: { status: 'accepted', tripId: 'trip-999' },
    });

    await act(async () => {
      render(
        <OfferModal
          visible={true}
          offer={mockOffer}
          onAcceptSuccess={onAcceptSuccess}
          onDismiss={jest.fn()}
        />,
      );
    });

    const acceptBtn = screen.getByTestId('accept-offer-button');
    await act(async () => {
      fireEvent.press(acceptBtn);
    });

    expect(ApiService.apiClient).toHaveBeenCalledWith(
      '/assignments/assign-100/accept',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onAcceptSuccess).toHaveBeenCalledWith('trip-999');
  });

  it('calls reject API and dismisses when Decline is pressed', async () => {
    const onDismiss = jest.fn();
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: { status: 'rejected' },
    });

    await act(async () => {
      render(
        <OfferModal
          visible={true}
          offer={mockOffer}
          onAcceptSuccess={jest.fn()}
          onDismiss={onDismiss}
        />,
      );
    });

    const rejectBtn = screen.getByTestId('reject-offer-button');
    await act(async () => {
      fireEvent.press(rejectBtn);
    });

    expect(ApiService.apiClient).toHaveBeenCalledWith(
      '/assignments/assign-100/reject',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  it('opens in-app RoutePreviewModal when Preview Full Route is pressed', async () => {
    jest.spyOn(ApiService, 'apiClient').mockResolvedValue({
      data: {
        polyline: 'sample_polyline',
        distanceMeters: 1500,
        durationSeconds: 360,
        pickupAddress: '100 Feet Rd',
        destinationAddress: 'Sony Signal',
        pickupCoords: { latitude: 12.9716, longitude: 77.5946 },
        destinationCoords: { latitude: 12.9352, longitude: 77.6190 },
      },
    });

    await act(async () => {
      render(
        <OfferModal
          visible={true}
          offer={mockOffer}
          onAcceptSuccess={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    });

    const previewBtn = screen.getByTestId('preview-route-button');
    await act(async () => {
      fireEvent.press(previewBtn);
    });

    // Close button of preview modal should now exist
    expect(screen.getByTestId('close-route-preview')).toBeTruthy();
  });
});
