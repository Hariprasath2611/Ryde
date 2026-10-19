import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Card } from '../../src/components/Card';
import { Row } from '../../src/components/Row';
import { Button } from '../../src/components/Button';
import { BottomTabs } from '../../src/components/BottomTabs';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { driver, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@rydecapital.in?subject=Driver%20Support').catch(() => {});
  };

  return (
    <ScreenBackground deco={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Top Avatar & Name */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {driver.fullName ? driver.fullName[0].toUpperCase() : 'A'}
              </Text>
            </View>

            <Text style={styles.name}>{driver.fullName || 'Arun Kumar'}</Text>
            <Text style={styles.statsSubtitle}>
              {`${driver.rating} ★ · ${en.account.tripsCount(driver.totalTrips || 25)}`}
            </Text>
          </View>

          {/* Account Details Card */}
          <Card variant="card" style={styles.detailsCard}>
            <Row
              label={en.account.documents}
              value={en.account.verified}
              showDivider={true}
            />
            <Row
              label={en.account.vehicleTypes}
              value="Bike, Car"
              showDivider={true}
            />
            <Row
              label={en.account.payoutAccount}
              value="UPI"
              showDivider={true}
              onPress={() => router.push('/payout')}
            />
            <Row
              label={en.account.emergencyContacts}
              value="2"
              showDivider={true}
              onPress={() => router.push('/emergency-contacts')}
            />
            <Row
              label={en.account.helpAndSupport}
              value="›"
              showDivider={false}
              onPress={handleSupport}
            />
          </Card>
        </View>

        {/* Log out Button */}
        <View style={styles.footer}>
          <Button
            title={en.account.logOut}
            variant="outline"
            onPress={handleLogout}
            accessibilityLabel="Log out"
          />
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs activeTab="profile" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'space-between',
    paddingBottom: 24,
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.white,
  },
  name: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  statsSubtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 4,
  },
  detailsCard: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: shape.cardRadius,
  },
  footer: {
    width: '100%',
    paddingTop: 32,
    paddingBottom: 16,
  },
});
