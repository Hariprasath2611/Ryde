// ryde-capital/mobile/app/privacy.tsx
// Privacy Policy & Data Subject Notice under India Digital Personal Data Protection (DPDP) Act 2023

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🔒 NOTICE: This policy complies with transparency requirements under India's Digital
            Personal Data Protection Act 2023 (DPDP Act). Formal review by qualified Indian legal
            counsel is required prior to commercial release.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Personal Data We Collect</Text>
        <Text style={styles.paragraph}>
          We collect personal data required to onboard, verify, and operate as a driver partner:
          {'\n'}• Identity Information: Full legal name, date of birth, phone number, address.
          {'\n'}• Verification Documents: Driving license, identity proof (Aadhaar/PAN masked), profile photo.
          {'\n'}• Telemetry: Real-time GPS coordinates, speed, heading while Online and on active trips.
          {'\n'}• Financial Data: Masked bank account numbers, IFSC codes, and UPI IDs for earnings settlement.
        </Text>

        <Text style={styles.sectionTitle}>2. Purpose of Data Processing</Text>
        <Text style={styles.paragraph}>
          Your digital personal data is processed strictly for specified lawful purposes:
          {'\n'}• Dispatching and matching passenger ride requests based on proximity.
          {'\n'}• Calculating accurate fares and disbursing weekly driver earnings.
          {'\n'}• Ensuring road safety, preventing fraud, and activating SOS emergency response.
          {'\n'}• Regulatory compliance under state transport aggregator rules.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Retention Policy</Text>
        <Text style={styles.paragraph}>
          • Real-time Telemetry: Trip breadcrumbs are pruned after 30 days via automated maintenance jobs.
          {'\n'}• Financial & Ledger Records: Retained for statutory periods (7 years) under Indian tax laws.
          {'\n'}• Documents: Retained for the duration of your active partnership plus regulatory audit limits.
        </Text>

        <Text style={styles.sectionTitle}>4. Rights of the Data Principal (You)</Text>
        <Text style={styles.paragraph}>
          Under the DPDP Act 2023, you hold the following rights:
          {'\n'}• Right to Access: View all personal data held about you in the app profile.
          {'\n'}• Right to Portability (Export): Request a machine-readable export via `GET /drivers/me/export`.
          {'\n'}• Right to Erasure: Request account deletion via `DELETE /drivers/me` with a statutory 30-day grace period.
          {'\n'}• Right to Grievance Redressal: Contact the Data Protection Officer at dpo@ryde.capital.
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
    borderLeftColor: '#38BDF8',
  },
  noticeText: {
    color: '#7DD3FC',
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
