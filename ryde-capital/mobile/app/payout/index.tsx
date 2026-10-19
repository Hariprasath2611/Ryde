import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { Chip } from '../../src/components/Chip';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { mockPayoutAccount } from '../../src/services/api/mock/data';

export default function PayoutAccountScreen() {
  const router = useRouter();

  const [method, setMethod] = useState<'upi' | 'bank_account'>('upi');
  const [upiId, setUpiId] = useState(mockPayoutAccount.upiId || 'arun@okbank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      router.back();
    }, 400);
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{en.payout.title}</Text>
            <Text style={styles.subtitle}>{en.payout.subtitle}</Text>

            {/* UPI vs Bank Account Chips */}
            <View style={styles.methodRow}>
              <Chip
                label={en.payout.upi}
                selected={method === 'upi'}
                onPress={() => setMethod('upi')}
              />
              <Chip
                label={en.payout.bankAccount}
                selected={method === 'bank_account'}
                onPress={() => setMethod('bank_account')}
              />
            </View>

            {/* Input Form */}
            {method === 'upi' ? (
              <View style={styles.formSection}>
                <TextField
                  label={en.payout.upiIdLabel}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder={en.payout.upiPlaceholder}
                  autoCapitalize="none"
                />
                <Text style={styles.defaultMethodNotice}>
                  {en.payout.defaultPayoutMethod}
                </Text>
              </View>
            ) : (
              <View style={styles.formSection}>
                <TextField
                  label={en.payout.accountNumberLabel}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="9876543210123"
                  keyboardType="number-pad"
                />
                <TextField
                  label={en.payout.ifscLabel}
                  value={ifsc}
                  onChangeText={setIfsc}
                  placeholder="HDFC0001234"
                  autoCapitalize="characters"
                />
              </View>
            )}
          </View>

          {/* Save Account Button */}
          <View style={styles.footer}>
            <Button
              title={en.payout.saveAccount}
              variant="amber"
              onPress={handleSave}
              accessibilityLabel="Save payout account"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
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
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  formSection: {
    width: '100%',
  },
  defaultMethodNotice: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: colors.darkTeal,
    marginTop: 8,
    marginLeft: 4,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
