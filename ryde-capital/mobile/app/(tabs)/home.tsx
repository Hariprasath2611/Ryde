import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { MapViewWrapper } from '../../src/components/MapViewWrapper';
import { BottomTabs } from '../../src/components/BottomTabs';
import { en } from '../../src/i18n/en';
import { formatINR } from '../../src/utils/format';
import * as Location from 'expo-location';
import { useAppStore } from '../../src/store/useAppStore';

export default function HomeScreen() {
  const router = useRouter();
  const {
    driver,
    isOnline,
    setOnline,
    currentOffer,
    notifications,
  } = useAppStore();

  const [deviceCoords, setDeviceCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          setDeviceCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((loc) => {
        if (!isMounted) return;
        setDeviceCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadNotifs = notifications.some((n) => !n.read);

  // If an offer arrives while on Home, automatically route to /trip/offer
  React.useEffect(() => {
    if (currentOffer) {
      router.push('/trip/offer');
    }
  }, [currentOffer]);

  return (
    <ScreenBackground deco={!isOnline}>
      <Header
        showBack={false}
        showHomeActions={true}
        unreadNotifications={unreadNotifs}
        avatarInitial={driver.fullName ? driver.fullName[0].toUpperCase() : 'A'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline View (12-Home) */}
        {!isOnline ? (
          <View style={styles.offlineContainer}>
            <View style={styles.greetingHeader}>
              <Text style={styles.greetingTitle}>
                {en.home.greeting(driver.fullName.split(' ')[0] || 'Arun')}
              </Text>
              <Text style={styles.greetingSubtitle}>
                {en.home.greetingSubtitle}
              </Text>
            </View>

            {/* Offline White Card */}
            <Card variant="white" style={styles.statusWhiteCard}>
              <Text style={styles.offlineCardTitle}>{en.home.offlineTitle}</Text>
              <Text style={styles.offlineCardSubtitle}>
                {en.home.offlineSubtitle}
              </Text>
              <Button
                title={en.home.goOnline}
                variant="amber"
                onPress={() => setOnline(true)}
                style={styles.cardActionButton}
                accessibilityLabel="Go online"
              />
            </Card>

            {/* 2x2 Stats Grid */}
            <View style={styles.statsGrid}>
              <Card variant="card" style={styles.statTile}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>{en.home.tripsToday}</Text>
              </Card>

              <Card variant="card" style={styles.statTile}>
                <Text style={styles.statNumber}>{formatINR(1240)}</Text>
                <Text style={styles.statLabel}>{en.home.earnedToday}</Text>
              </Card>

              <Card variant="card" style={styles.statTile}>
                <Text style={styles.statNumber}>4.8 ★</Text>
                <Text style={styles.statLabel}>{en.home.rating}</Text>
              </Card>

              <Card variant="card" style={styles.statTile}>
                <Text style={styles.statNumber}>3h 12m</Text>
                <Text style={styles.statLabel}>{en.home.onlineToday}</Text>
              </Card>
            </View>

            {/* Last Trip Card */}
            <Card variant="card" style={styles.lastTripCard}>
              <Text style={styles.lastTripLabel}>{en.home.lastTrip}</Text>
              <View style={styles.lastTripRow}>
                <Text style={styles.lastTripRoute}>Anna Nagar → T. Nagar</Text>
                <Text style={styles.lastTripFare}>{formatINR(340)}</Text>
              </View>
            </Card>
          </View>
        ) : (
          /* Online View (13-HomeOnline) */
          <View style={styles.onlineContainer}>
            {/* Bright Styled In-App Map with Live Device GPS */}
            <MapViewWrapper origin={deviceCoords || undefined} height={320} style={styles.mapCard} />

            {/* Online Status White Card */}
            <Card variant="white" style={styles.statusWhiteCard}>
              <View style={styles.onlineBadgeRow}>
                <View style={styles.greenDot} />
                <Text style={styles.onlineCardTitle}>
                  {en.home.onlineTitle}
                </Text>
              </View>
              <Text style={styles.onlineCardSubtitle}>
                {en.home.onlineSubtitle}
              </Text>
              <Button
                title={en.home.goOffline}
                variant="outline"
                onPress={() => setOnline(false)}
                style={styles.cardActionButton}
                accessibilityLabel="Go offline"
              />
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Tabs */}
      <BottomTabs activeTab="home" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  offlineContainer: {
    gap: 16,
  },
  greetingHeader: {
    marginTop: 8,
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  greetingSubtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 4,
  },
  statusWhiteCard: {
    borderRadius: shape.cardRadius,
    padding: 24,
    alignItems: 'center',
    marginVertical: 4,
  },
  offlineCardTitle: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  offlineCardSubtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 6,
    marginBottom: 18,
  },
  cardActionButton: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    width: '48%',
    padding: 16,
    marginVertical: 0,
    borderRadius: shape.cardRadius,
  },
  statNumber: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.darkTeal,
    marginTop: 4,
  },
  lastTripCard: {
    padding: 18,
    marginVertical: 0,
    borderRadius: shape.cardRadius,
  },
  lastTripLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
    marginBottom: 8,
  },
  lastTripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastTripRoute: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
  },
  lastTripFare: {
    fontSize: typography.fontSize.button,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  onlineContainer: {
    gap: 16,
  },
  mapCard: {
    borderRadius: shape.cardRadius,
    marginVertical: 8,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
  },
  onlineCardTitle: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  onlineCardSubtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 6,
    marginBottom: 18,
  },
});
