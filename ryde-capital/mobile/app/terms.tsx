// ryde-capital/mobile/app/terms.tsx
// Terms of Service screen for Ryde Capital driver partners

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            ⚖️ NOTICE: This policy document incorporates statutory compliance for India's Motor Vehicle
            Aggregator Guidelines and the Digital Personal Data Protection (DPDP) Act 2023. Formal legal
            review by qualified Indian counsel is required prior to commercial launch.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Independent Contractor Relationship</Text>
        <Text style={styles.paragraph}>
          By registering as a driver partner on Ryde Capital, you acknowledge that you operate as an
          independent contractor and not an employee or agent of Ryde Platform Technologies. You retain
          the discretion to accept or decline ride offers in accordance with platform availability guidelines.
        </Text>

        <Text style={styles.sectionTitle}>2. Platform Rules & Eligibility</Text>
        <Text style={styles.paragraph}>
          Drivers must be at least 18 years of age, possess a valid Commercial Driving License (DL) or
          eligible transport class endorsement, and undergo statutory identity and background checks.
          Operating under the influence or permitting unauthorized third parties to drive is strictly prohibited.
        </Text>

        <Text style={styles.sectionTitle}>3. Location Services & Telemetry</Text>
        <Text style={styles.paragraph}>
          While toggled Online or during active customer trips, high-frequency location data is collected
          for matching, passenger navigation, safety audits, and accurate fare computation. Location tracking
          stops when toggled Offline.
        </Text>

        <Text style={styles.sectionTitle}>4. Platform Fees & Settlement</Text>
        <Text style={styles.paragraph}>
          Platform service fees are deducted from gross trip fares as published in the vehicle fare schedule.
          Net earnings are settled to your verified default payout account (UPI ID or IMPS bank account)
          on a weekly settlement cycle.
        </Text>

        <Text style={styles.sectionTitle}>5. Safety & SOS Procedures</Text>
        <Text style={styles.paragraph}>
          The application provides an Emergency SOS feature that transmits real-time coordinates to platform
          safety operators, designated emergency contacts, and law enforcement when activated. Misuse of the
          SOS button for non-emergencies may lead to account suspension.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  noticeBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noticeText: {
    color: '#FCD34D',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 12,
  },
});
