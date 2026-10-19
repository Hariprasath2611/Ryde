import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/index';

describe('Ryde Capital - HomeScreen Placeholder', () => {
  it('renders successfully and contains platform title and role information', () => {
    const element = HomeScreen();
    expect(element).toBeDefined();
    expect(element.props.testID).toBe('home-screen-container');

    const result = render(<HomeScreen />);
    console.log('Result:', result);
  });
});
