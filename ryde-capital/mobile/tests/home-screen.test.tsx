import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

describe('Ryde Capital - HomeScreen Placeholder', () => {
  it('renders successfully and displays platform title and role information', () => {
    const { getByTestId, getByText } = render(<HomeScreen />);

    // Assert container renders
    expect(getByTestId('home-screen-container')).toBeTruthy();

    // Assert branding title and driver role indicators
    expect(getByText('Ryde Capital')).toBeTruthy();
    expect(getByText('Professional Driver Companion')).toBeTruthy();
    expect(getByText('PHASE 0 FOUNDATION')).toBeTruthy();
    expect(getByText('Driver Core Ready')).toBeTruthy();
  });
});
