import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Card } from '../../src/components/Card';
import { Row } from '../../src/components/Row';
import { Button } from '../../src/components/Button';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

export default function StatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();
  const { driver, setDriver } = useAppStore();

  const isRejected =
    params.state === 'rejected' || driver.status === 'rejected';

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@rydecapital.in?subject=Driver%20Onboarding%20Inquiry').catch(() => {});
  };

  const handleReupload = () => {
    setDriver({ status: 'pending' });
    router.push('/(onboarding)/verification');
  };

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Top Badge Icon */}
        <View style={styles.topArea}>
          <View
            style={[
              styles.iconCircle,
              isRejected ? styles.iconCircleAmber : styles.iconCircleTeal,
            ]}
          >
            <Text
              style={[
                styles.iconText,
                isRejected ? styles.iconTextExclamation : styles.iconTextCheck,
              ]}
            >
              {isRejected ? '!' : '✓'}
            </Text>
          </View>
        </View>

        {/* Status Headings & Details Card */}
        <View style={styles.middleArea}>
          <Text style={styles.title}>
            {isRejected ? en.rejected.title : en.review.title}
          </Text>
          <Text style={styles.subtitle}>
            {isRejected
              ? en.rejected.subtitle
              : en.review.subtitle}
          </Text>

          {isRejected ? (
            <Card variant="card" style={styles.detailsCard}>
              <Text style={styles.whyLabel}>{en.rejected.why}</Text>
              <Text style={styles.whyReason}>
                {driver.rejectionReason || en.rejected.defaultReason}
              </Text>
            </Card>
          ) : (
            <Card variant="card" style={styles.detailsCard}>
              <Row
                label={en.review.identity}
                value={en.review.submitted}
                showDivider={true}
              />
              <Row
                label={en.review.drivingLicence}
                value={en.review.submitted}
                showDivider={true}
              />
              <Row
                label={en.review.vehicleTypes}
                value="Bike, Car"
                showDivider={false}
              />
            </Card>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          {isRejected ? (
            <Button
              title={en.rejected.reupload}
              variant="amber"
              onPress={handleReupload}
              accessibilityLabel="Re-upload licence"
            />
          ) : (
            <Button
              title={en.review.contactSupport}
              variant="outline"
              onPress={handleContactSupport}
              accessibilityLabel="Contact support"
            />
          )}
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
  topArea: {
    alignItems: 'center',
    paddingTop: 80,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleTeal: {
    backgroundColor: '#8EB5BA',
  },
  iconCircleAmber: {
    backgroundColor: colors.amber,
  },
  iconText: {
    fontWeight: '800',
    color: colors.darkTeal,
  },
  iconTextCheck: {
    fontSize: 54,
  },
  iconTextExclamation: {
    fontSize: 64,
  },
  middleArea: {
    alignItems: 'center',
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
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  whyLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '800',
    color: colors.darkTeal,
    marginBottom: 8,
  },
  whyReason: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.darkTeal,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
