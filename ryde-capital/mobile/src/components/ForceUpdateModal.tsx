// ryde-capital/mobile/src/components/ForceUpdateModal.tsx
// Force update blocking modal triggered when client version < MIN_APP_VERSION

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';

interface ForceUpdateModalProps {
  visible: boolean;
  minVersion: string;
  currentVersion: string;
  updateUrl?: string;
}

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  visible,
  minVersion,
  currentVersion,
  updateUrl,
}) => {
  const handleUpdate = () => {
    const defaultUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id6400000000'
        : 'https://play.google.com/store/apps/details?id=com.ryde.capital';

    Linking.openURL(updateUrl || defaultUrl).catch((err) => {
      console.error('Failed to open app store URL:', err);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.icon}>🚀</Text>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A critical update is required to continue using Ryde Capital. Please update the app to version{' '}
            <Text style={styles.bold}>{minVersion}</Text> or higher.
          </Text>
          <Text style={styles.versionInfo}>
            Current Version: {currentVersion} • Minimum: {minVersion}
          </Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            accessibilityRole="button"
            accessibilityLabel="Update now on app store"
          >
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#60A5FA',
  },
  versionInfo: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
