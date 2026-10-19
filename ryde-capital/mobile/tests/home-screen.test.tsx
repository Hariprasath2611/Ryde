import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

describe('Ryde Capital - HomeScreen Placeholder', () => {
  it('renders successfully and displays platform title and role information', () => {
    const rendered = render(<HomeScreen />);
    console.log('RENDERED KEYS:', Object.keys(rendered));

    expect(rendered.getByTestId('home-screen-container')).toBeTruthy();
    expect(rendered.getByText('Ryde Capital')).toBeTruthy();
    expect(rendered.getByText('Professional Driver Companion')).toBeTruthy();
    expect(rendered.getByText('PHASE 0 FOUNDATION')).toBeTruthy();
    expect(rendered.getByText('Driver Core Ready')).toBeTruthy();
  });
});
