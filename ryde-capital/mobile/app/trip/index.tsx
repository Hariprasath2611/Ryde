import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TripScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trip Navigation & Handover Checklist - Planned Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  text: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
