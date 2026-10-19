import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { mockEmergencyContacts } from '../../src/services/api/mock/data';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState(mockEmergencyContacts);

  const handleAddContact = () => {
    if (contacts.length >= 5) return;
    const newContact = {
      id: `c-${Date.now()}`,
      name: 'Kavitha R.',
      relationship: 'Spouse',
      phone: '+91 98401 22334',
    };
    setContacts([...contacts, newContact]);
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{en.emergencyContacts.title}</Text>
          <Text style={styles.subtitle}>{en.emergencyContacts.subtitle}</Text>

          {/* Contacts List */}
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {contacts.map((contact) => (
              <Card key={contact.id} variant="card" style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactDetails}>
                    {`${contact.relationship} · ${contact.phone}`}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {}}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${contact.name}`}
                  style={styles.editBtn}
                >
                  <Text style={styles.editText}>
                    {en.emergencyContacts.edit}
                  </Text>
                </TouchableOpacity>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Add Contact Button */}
        <View style={styles.footer}>
          <Button
            title={en.emergencyContacts.addContact}
            variant="outline"
            onPress={handleAddContact}
            disabled={contacts.length >= 5}
            accessibilityLabel="Add emergency contact"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
  contactCard: {
    borderRadius: shape.cardRadius,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 0,
  },
  contactInfo: {
    flex: 1,
    paddingRight: 12,
  },
  contactName: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  contactDetails: {
    fontSize: typography.fontSize.caption,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 4,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editText: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
