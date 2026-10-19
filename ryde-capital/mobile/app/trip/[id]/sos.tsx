import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { HoldToConfirm } from '../../../src/components/HoldToConfirm';
import { Card } from '../../../src/components/Card';
import { Row } from '../../../src/components/Row';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';

export default function SosScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isSent, setIsSent] = useState(false);

  const handleHoldConfirm = () => {
    setIsSent(true);
  };

  const handleCallPolice = () => {
    Linking.openURL('tel:112').catch(() => {});
  };

  const handleCancelAlert = () => {
    setIsSent(false);
    router.back();
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      {!isSent ? (
        /* Screen 23: SOS Hold state */
        <View style={styles.container}>
          <View style={styles.topArea}>
            <Text style={styles.title}>{en.sos.title}</Text>
            <Text style={styles.subtitle}>{en.sos.subtitle}</Text>

            <HoldToConfirm
              onConfirm={handleHoldConfirm}
              holdDurationMs={3000}
              size={210}
              label={en.sos.buttonText}
            />

            <Text style={styles.locationNotice}>{en.sos.locationNotice}</Text>
          </View>

          <View style={styles.footer}>
            <Button
              title={en.sos.cancel}
              variant="outline"
              onPress={() => router.back()}
              accessibilityLabel="Cancel SOS"
            />
          </View>
        </View>
      ) : (
        /* Screen 24: SOS Sent confirmation state */
        <View style={styles.container}>
          <View style={styles.topArea}>
            <View style={styles.badgeCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.title}>{en.sos.sentTitle}</Text>
            <Text style={styles.subtitle}>{en.sos.sentSubtitle}</Text>

            <Card variant="card" style={styles.statusCard}>
              <Row
                label={en.sos.contactsNotified}
                value="✓"
                showDivider={true}
              />
              <Row
                label={en.sos.supportAlerted}
                value="✓"
                showDivider={true}
              />
              <Row
                label={en.sos.liveLocationShared}
                value={en.sos.on}
                showDivider={false}
              />
            </Card>
          </View>

          <View style={styles.sentFooter}>
            <Button
              title={en.sos.call112}
              variant="danger"
              onPress={handleCallPolice}
              style={styles.fullBtn}
              accessibilityLabel="Call police on 112"
            />
            <Button
              title={en.sos.cancelAlert}
              variant="outline"
              onPress={handleCancelAlert}
              style={styles.fullBtn}
              accessibilityLabel="Cancel emergency alert"
            />
          </View>
        </View>
      )}
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
  topArea: {
    alignItems: 'center',
    paddingTop: 16,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  locationNotice: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.darkTeal,
    textAlign: 'center',
    marginTop: 8,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  statusCard: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
  sentFooter: {
    width: '100%',
    gap: 12,
    paddingBottom: 16,
  },
  fullBtn: {
    width: '100%',
  },
});
