// ryde-capital/mobile/app/(tabs)/earnings.tsx
// Phase 5: Earnings Tab (Today, Week, Month Summary, List, Trip Breakdown, Payout Accounts)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../src/services/api';

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completedTripsCount: number;
}

interface EarningItem {
  id: string;
  trip_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  settlement_status: 'pending' | 'settled';
  created_at: string;
}

interface PayoutAccount {
  id: string;
  account_type: 'upi' | 'bank_account';
  upi_id: string | null;
  bank_name: string | null;
  account_number_masked: string | null;
  ifsc_code: string | null;
  beneficiary_name: string;
  is_default: boolean;
  verification_status: string;
}

export default function EarningsScreen() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earningsList, setEarningsList] = useState<EarningItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected trip detail modal
  const [selectedTrip, setSelectedTrip] = useState<EarningItem | null>(null);

  // Payout accounts management
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);

  // New account form state
  const [accountType, setAccountType] = useState<'upi' | 'bank_account'>('upi');
  const [upiId, setUpiId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [submittingAccount, setSubmittingAccount] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, listRes, accountsRes] = await Promise.all([
        apiClient<{ data: EarningsSummary }>('/earnings/summary').catch(() => ({ data: { today: 0, thisWeek: 0, thisMonth: 0, completedTripsCount: 0 } })),
        apiClient<{ earnings: EarningItem[] }>(`/earnings?period=${selectedPeriod}`).catch(() => ({ earnings: [] })),
        apiClient<{ data: PayoutAccount[] }>('/earnings/payout-accounts').catch(() => ({ data: [] })),
      ]);

      setSummary(summaryRes.data);
      setEarningsList(listRes.earnings || []);
      setPayoutAccounts(accountsRes.data || []);
    } catch (error) {
      console.warn('Failed to load earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSetDefaultAccount = async (accountId: string) => {
    try {
      await apiClient(`/earnings/payout-accounts/${accountId}/default`, { method: 'PATCH' });
      Alert.alert('Success', 'Default payout account updated');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to set default account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this payout account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient(`/earnings/payout-accounts/${accountId}`, { method: 'DELETE' });
              Alert.alert('Removed', 'Payout account removed');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove account');
            }
          },
        },
      ],
    );
  };

  const handleCreateAccount = async () => {
    if (!beneficiaryName.trim()) {
      Alert.alert('Error', 'Please enter beneficiary name');
      return;
    }
    if (accountType === 'upi' && !upiId.trim()) {
      Alert.alert('Error', 'Please enter a valid UPI ID (e.g. name@okhdfcbank)');
      return;
    }
    if (accountType === 'bank_account' && (!accountNumber.trim() || !ifscCode.trim())) {
      Alert.alert('Error', 'Please enter both bank account number and IFSC code');
      return;
    }

    setSubmittingAccount(true);
    try {
      await apiClient('/earnings/payout-accounts', {
        method: 'POST',
        body: JSON.stringify({
          accountType,
          beneficiaryName: beneficiaryName.trim(),
          upiId: accountType === 'upi' ? upiId.trim() : undefined,
          accountNumber: accountType === 'bank_account' ? accountNumber.trim() : undefined,
          ifscCode: accountType === 'bank_account' ? ifscCode.trim().toUpperCase() : undefined,
          bankName: accountType === 'bank_account' ? bankName.trim() : undefined,
          isDefault: payoutAccounts.length === 0,
        }),
      });

      Alert.alert('Success', 'Payout account verified and linked successfully');
      setAddAccountModalVisible(false);
      setUpiId('');
      setBeneficiaryName('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      loadData();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Could not verify payout account');
    } finally {
      setSubmittingAccount(false);
    }
  };

  const defaultAccount = payoutAccounts.find((a) => a.is_default);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings & Payouts</Text>
          <TouchableOpacity
            style={styles.managePayoutBtn}
            onPress={() => setPayoutModalVisible(true)}
          >
            <Text style={styles.managePayoutBtnText}>Payout Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Payout Account Status Banner */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Text style={styles.payoutLabel}>DEFAULT PAYOUT ACCOUNT</Text>
            <TouchableOpacity onPress={() => setPayoutModalVisible(true)}>
              <Text style={styles.payoutActionText}>Change</Text>
            </TouchableOpacity>
          </View>
          {defaultAccount ? (
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountIcon}>
                {defaultAccount.account_type === 'upi' ? '⚡' : '🏦'}
              </Text>
              <View>
                <Text style={styles.accountName}>{defaultAccount.beneficiary_name}</Text>
                <Text style={styles.accountDetail}>
                  {defaultAccount.account_type === 'upi'
                    ? defaultAccount.upi_id
                    : `${defaultAccount.bank_name || 'Bank'} (${defaultAccount.account_number_masked})`}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPayoutPrompt}
              onPress={() => {
                setPayoutModalVisible(true);
                setAddAccountModalVisible(true);
              }}
            >
              <Text style={styles.addPayoutPromptText}>+ Add Payout Account (UPI or Bank) for weekly settlements</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>TODAY</Text>
            <Text style={styles.summaryCardValue}>₹{(summary?.today || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.highlightCard]}>
            <Text style={[styles.summaryCardLabel, styles.highlightLabel]}>THIS WEEK</Text>
            <Text style={[styles.summaryCardValue, styles.highlightValue]}>
              ₹{(summary?.thisWeek || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>THIS MONTH</Text>
            <Text style={styles.summaryCardValue}>₹{(summary?.thisMonth || 0).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tripsCountBanner}>
          <Text style={styles.tripsCountText}>
            🎉 Total Completed Trips: <Text style={styles.tripsCountNumber}>{summary?.completedTripsCount || 0}</Text>
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.filterRow}>
          {(['today', 'week', 'month', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.filterChip, selectedPeriod === period && styles.filterChipActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeriod === period && styles.filterChipTextActive,
                ]}
              >
                {period.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Trip Breakdown</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 24 }} />
          ) : earningsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No earnings recorded for this period</Text>
            </View>
          ) : (
            earningsList.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.earningItem}
                onPress={() => setSelectedTrip(item)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemDate}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.itemTripId}>Trip #{item.trip_id.slice(0, 8)}</Text>
                </View>

                <View style={styles.itemRight}>
                  <Text style={styles.itemNet}>+₹{item.net_amount.toFixed(2)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.settlement_status === 'settled' ? styles.settledBadge : styles.pendingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.settlement_status === 'settled' ? styles.settledText : styles.pendingText,
                      ]}
                    >
                      {item.settlement_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Trip Breakdown Detail Modal */}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Trip Fare Breakdown</Text>
            {selectedTrip && (
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gross Customer Fare</Text>
                  <Text style={styles.detailValue}>₹{selectedTrip.gross_amount.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Platform Commission</Text>
                  <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                    -₹{selectedTrip.platform_fee.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.netRow]}>
                  <Text style={styles.netLabel}>Driver Net Earnings</Text>
                  <Text style={styles.netTotal}>₹{selectedTrip.net_amount.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Settlement Status</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: selectedTrip.settlement_status === 'settled' ? '#22c55e' : '#f59e0b' },
                    ]}
                  >
                    {selectedTrip.settlement_status.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTrip(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payout Accounts Management Modal */}
      <Modal visible={payoutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Payout Accounts</Text>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={payoutAccounts}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No payout accounts linked yet.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.accountCard}>
                  <View style={styles.accountCardDetails}>
                    <Text style={styles.accountCardTitle}>
                      {item.account_type === 'upi' ? '⚡ UPI ID' : '🏦 Bank Account'}
                    </Text>
                    <Text style={styles.accountCardNumber}>
                      {item.account_type === 'upi'
                        ? item.upi_id
                        : `${item.bank_name || 'Bank'}: ${item.account_number_masked}`}
                    </Text>
                    <Text style={styles.accountBeneficiary}>{item.beneficiary_name}</Text>
                  </View>

                  <View style={styles.accountCardActions}>
                    {item.is_default ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setDefaultBtn}
                        onPress={() => handleSetDefaultAccount(item.id)}
                      >
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteAccountBtn}
                      onPress={() => handleDeleteAccount(item.id)}
                    >
                      <Text style={styles.deleteAccountText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.addNewAccountBtn}
              onPress={() => setAddAccountModalVisible(true)}
            >
              <Text style={styles.addNewAccountText}>+ Add New Payout Method</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Account Modal Form */}
      <Modal visible={addAccountModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payout Method</Text>

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, accountType === 'upi' && styles.typeBtnActive]}
                onPress={() => setAccountType('upi')}
              >
                <Text style={[styles.typeBtnText, accountType === 'upi' && styles.typeBtnTextActive]}>
                  UPI ID (Fast)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, accountType === 'bank_account' && styles.typeBtnActive]}
                onPress={() => setAccountType('bank_account')}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    accountType === 'bank_account' && styles.typeBtnTextActive,
                  ]}
                >
                  Bank Account
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Beneficiary Name (as in bank)"
              placeholderTextColor="#64748b"
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
            />

            {accountType === 'upi' ? (
              <TextInput
                style={styles.input}
                placeholder="UPI ID (e.g. mobile@upi, name@okhdfcbank)"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                value={upiId}
                onChangeText={setUpiId}
              />
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Account Number"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />
                <TextInput
                  style={styles.input}
                  placeholder="IFSC Code (e.g. HDFC0001234)"
                  placeholderTextColor="#64748b"
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Bank Name (Optional)"
                  placeholderTextColor="#64748b"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </>
            )}

            <View style={styles.formBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddAccountModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                disabled={submittingAccount}
                onPress={handleCreateAccount}
              >
                {submittingAccount ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Save</Text>
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
  container: { flex: 1, backgroundColor: '#090d16', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  managePayoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  managePayoutBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  payoutCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  payoutActionText: { fontSize: 13, color: '#38bdf8', fontWeight: '600' },
  accountInfoRow: { flexDirection: 'row', alignItems: 'center' },
  accountIcon: { fontSize: 24, marginRight: 12 },
  accountName: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  accountDetail: { fontSize: 13, color: '#94a3b8' },
  verifiedBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  addPayoutPrompt: { paddingVertical: 8 },
  addPayoutPromptText: { color: '#38bdf8', fontSize: 13, fontWeight: '500' },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  highlightCard: {
    borderColor: '#0284c7',
    backgroundColor: '#0c2238',
  },
  summaryCardLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6 },
  summaryCardValue: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  highlightLabel: { color: '#38bdf8' },
  highlightValue: { color: '#38bdf8' },
  tripsCountBanner: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  tripsCountText: { color: '#94a3b8', fontSize: 14 },
  tripsCountNumber: { color: '#f8fafc', fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  filterChipActive: { backgroundColor: '#0284c7' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterChipTextActive: { color: '#ffffff' },
  listSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },
  earningItem: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  itemLeft: {},
  itemDate: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  itemTripId: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemNet: { fontSize: 16, fontWeight: '700', color: '#22c55e' },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settledBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  statusText: { fontSize: 10, fontWeight: '700' },
  settledText: { color: '#22c55e' },
  pendingText: { color: '#f59e0b' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 16 },
  closeIcon: { fontSize: 18, color: '#94a3b8' },
  detailList: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: { color: '#94a3b8', fontSize: 14 },
  detailValue: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  netRow: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderBottomWidth: 0,
  },
  netLabel: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  netTotal: { color: '#22c55e', fontSize: 18, fontWeight: '800' },
  closeBtn: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: { color: '#f8fafc', fontWeight: '600' },
  accountCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountCardDetails: { marginBottom: 10 },
  accountCardTitle: { fontSize: 13, fontWeight: '700', color: '#38bdf8' },
  accountCardNumber: { fontSize: 15, fontWeight: '600', color: '#f8fafc', marginVertical: 2 },
  accountBeneficiary: { fontSize: 12, color: '#94a3b8' },
  accountCardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  defaultBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  setDefaultBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  setDefaultText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  deleteAccountBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteAccountText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  emptyModalText: { color: '#64748b', textAlign: 'center', marginVertical: 20 },
  addNewAccountBtn: {
    backgroundColor: '#0284c7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  addNewAccountText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  typeSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeBtnActive: { borderColor: '#38bdf8', backgroundColor: '#0c2238' },
  typeBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  typeBtnTextActive: { color: '#38bdf8' },
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
  formBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center' },
  cancelBtnText: { color: '#f8fafc', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#0284c7', alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '700' },
});
