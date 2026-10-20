import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RydeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
}

export const RydeLogo: React.FC<RydeLogoProps> = ({
  size = 'md',
  withTagline = false,
}) => {
  const fontSizes = {
    sm: 22,
    md: 28,
    lg: 36,
    xl: 46,
  };

  const currentSize = fontSizes[size];

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={[styles.tealLetter, { fontSize: currentSize }]}>R</Text>
        <Text style={[styles.amberLetter, { fontSize: currentSize }]}>y</Text>
        <Text style={[styles.tealLetter, { fontSize: currentSize }]}>de</Text>
      </View>
      {withTagline && (
        <Text style={styles.tagline}>your vehicle , our driver</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tealLetter: {
    fontWeight: '900',
    color: '#0E525A',
    letterSpacing: -0.5,
  },
  amberLetter: {
    fontWeight: '900',
    color: '#ECA233',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
