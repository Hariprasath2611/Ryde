import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container} testID="home-screen-container">
      <View style={styles.card}>
        <Text style={styles.badge}>PHASE 0 FOUNDATION</Text>
        <Text style={styles.title} testID="app-title">
          Ryde Capital
        </Text>
        <Text style={styles.subtitle}>Professional Driver Companion</Text>
        <Text style={styles.description}>
          On-demand driver service for customer vehicles across India.
        </Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>System Status:</Text>
          <Text style={styles.statusValue}>Driver Core Ready</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badge: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
});
