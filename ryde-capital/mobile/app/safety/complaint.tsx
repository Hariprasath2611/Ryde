// ryde-capital/mobile/app/safety/complaint.tsx
// Phase 5: Driver Complaint Filing Form

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../src/services/api';

const COMPLAINT_CATEGORIES = [
  { id: 'fare_dispute', label: '💰 Fare / Toll Dispute' },
  { id: 'passenger_misconduct', label: '👤 Passenger Misconduct' },
  { id: 'route_issue', label: '🗺️ Wrong Pickup/Drop Location' },
  { id: 'safety_hazard', label: '⚠️ Safety / Security Concern' },
  { id: 'other', label: '📝 Other Issue' },
];

export default function ComplaintScreen() {
  const params = useLocalSearchParams<{ tripId?: string }>();
  const [selectedCategory, setSelectedCategory] = useState('fare_dispute');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Incomplete Description', 'Please provide at least 5 characters explaining the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient<{ success: boolean; data: { id: string } }>('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          tripId: params.tripId || undefined,
          complaintType: selectedCategory,
          description: description.trim(),
        }),
      });

      Alert.alert(
        'Complaint Filed',
        `Your grievance has been submitted to Support (Ticket #${res.data.id.slice(0, 8)}). We will review it shortly.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to file complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raise Complaint</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container}>
        {params.tripId && (
          <View style={styles.tripBadge}>
            <Text style={styles.tripBadgeText}>Regarding Trip #{params.tripId.slice(0, 8)}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Select Complaint Category</Text>
        <View style={styles.categoryContainer}>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                selectedCategory === cat.id && styles.categoryCardSelected,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Detailed Explanation</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe exactly what happened. Include specific details like toll amounts, timestamps, or route diversions..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={styles.submitButton}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Complaint to Support</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  container: { flex: 1, padding: 16 },
  tripBadge: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  tripBadgeText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryContainer: { marginBottom: 20 },
  categoryCard: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  categoryCardSelected: { borderColor: '#38bdf8', backgroundColor: '#0c2238' },
  categoryText: { color: '#cbd5e1', fontSize: 15, fontWeight: '500' },
  categoryTextSelected: { color: '#38bdf8', fontWeight: '700' },
  textArea: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 14,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 140,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
