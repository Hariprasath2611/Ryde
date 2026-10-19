// ryde-capital/mobile/app/safety/emergency-contacts.tsx
// Phase 5: Emergency Contacts Management Screen (Max 5 Contacts, Phone Validation, Add/Delete)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  created_at: string;
}

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('+91');
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await apiClient<{ data: EmergencyContact[] }>('/emergency-contacts');
      setContacts(res.data || []);
    } catch (err) {
      console.warn('Failed to load emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter contact full name');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Required', 'Please enter relationship (e.g. Spouse, Parent, Friend)');
      return;
    }

    const cleanedPhone = phone.trim();
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      Alert.alert(
        'Invalid Phone',
        'Please enter a valid 10-digit Indian phone number prefixed with +91 (e.g. +919876543210)',
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiClient('/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.trim(),
          phone: cleanedPhone,
        }),
      });

      Alert.alert('Success', 'Emergency contact saved');
      setAddModalVisible(false);
      setName('');
      setRelationship('');
      setPhone('+91');
      fetchContacts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = (id: string, contactName: string) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contactName} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient(`/emergency-contacts/${id}`, { method: 'DELETE' });
              fetchContacts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete contact');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🛡️</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Safety First</Text>
            <Text style={styles.bannerDesc}>
              When you trigger SOS, an immediate SMS with your live location coordinates is
              dispatched to your emergency contacts.
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listCount}>Contacts ({contacts.length}/5)</Text>
          {contacts.length < 5 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddModalVisible(true)}
            >
              <Text style={styles.addBtnText}>+ Add Contact</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
                <Text style={styles.emptySubtext}>
                  Add up to 5 family members or trusted contacts.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactRelationship}>{item.relationship}</Text>
                  <Text style={styles.contactPhone}>{item.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteContact(item.id, item.name)}
                >
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Contact Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Contact Full Name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g. Spouse, Parent, Brother)"
              placeholderTextColor="#64748b"
              value={relationship}
              onChangeText={setRelationship}
            />

            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                disabled={submitting}
                onPress={handleAddContact}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Contact</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: { flex: 1, padding: 16 },
  banner: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  bannerIcon: { fontSize: 32, marginRight: 14 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#38bdf8', marginBottom: 4 },
  bannerDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listCount: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  addBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  contactCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  contactRelationship: { fontSize: 13, color: '#38bdf8', marginVertical: 2 },
  contactPhone: { fontSize: 13, color: '#94a3b8' },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 16 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center' },
  modalCancelText: { color: '#f8fafc', fontWeight: '600' },
  modalSave: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#0284c7', alignItems: 'center' },
  modalSaveText: { color: '#ffffff', fontWeight: '700' },
});
