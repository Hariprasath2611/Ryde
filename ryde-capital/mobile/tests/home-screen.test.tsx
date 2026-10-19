import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

describe('Ryde Capital - HomeScreen Placeholder', () => {
  it('renders successfully and displays platform title and role information', () => {
    render(<HomeScreen />);

    // Assert container renders
    expect(screen.getByTestId('home-screen-container')).toBeTruthy();

    // Assert branding title and driver role indicators
    expect(screen.getByText('Ryde Capital')).toBeTruthy();
    expect(screen.getByText('Professional Driver Companion')).toBeTruthy();
    expect(screen.getByText('PHASE 0 FOUNDATION')).toBeTruthy();
    expect(screen.getByText('Driver Core Ready')).toBeTruthy();
  });
});
