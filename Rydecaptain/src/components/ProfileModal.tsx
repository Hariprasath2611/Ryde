import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { DriverProfile } from '../types';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  driver: DriverProfile;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  driver,
  onLogout,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Driver Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: driver.avatarUrl }} style={styles.avatar} />
              <View style={styles.checkBadge}>
                <Feather name="check" size={10} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.name}>{driver.fullName}</Text>
            <Text style={styles.phone}>+91 {driver.mobileNumber}</Text>

            {/* Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>RATING</Text>
                <Text style={styles.metricVal}>★ {driver.rating}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TRIPS</Text>
                <Text style={styles.metricVal}>{driver.totalTripsToday}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>EARNING</Text>
                <Text style={[styles.metricVal, { color: '#059669' }]}>
                  ₹{driver.todayEarnings}
                </Text>
              </View>
            </View>

            {/* Verification Info */}
            <View style={styles.kycCard}>
              <View style={styles.kycHeader}>
                <Text style={styles.kycTitle}>🛡 KYC Verification</Text>
                <View style={styles.approvedPill}>
                  <Text style={styles.approvedText}>APPROVED</Text>
                </View>
              </View>
              <Text style={styles.kycDetail}>Aadhar: {driver.aadharNumber}</Text>
              <Text style={styles.kycDetail}>
                License: {driver.licenseFileName || 'DL_TN01_2022003891.pdf'}
              </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={14} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out & Reset Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#DDF0F0',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#6FA5A5',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111, 165, 165, 0.3)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#075B64',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#075B64',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#075B64',
  },
  phone: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(111, 165, 165, 0.4)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075B64',
    marginTop: 2,
  },
  kycCard: {
    backgroundColor: '#7EAFA8',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kycTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  approvedPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  approvedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  kycDetail: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
});
