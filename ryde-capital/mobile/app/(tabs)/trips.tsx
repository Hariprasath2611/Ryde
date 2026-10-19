import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Chip } from '../../src/components/Chip';
import { Card } from '../../src/components/Card';
import { BottomTabs } from '../../src/components/BottomTabs';
import { en } from '../../src/i18n/en';
import { formatINR } from '../../src/utils/format';
import { mockAllTrips } from '../../src/services/api/mock/data';

type TripFilter = 'all' | 'completed' | 'cancelled';

export default function TripsScreen() {
  const [activeFilter, setActiveFilter] = useState<TripFilter>('all');

  const filteredTrips = mockAllTrips.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  return (
    <ScreenBackground deco={true}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{en.trips.title}</Text>

          {/* Filter Chips */}
          <View style={styles.filtersRow}>
            <Chip
              label={en.trips.all}
              selected={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
            />
            <Chip
              label={en.trips.completed}
              selected={activeFilter === 'completed'}
              onPress={() => setActiveFilter('completed')}
            />
            <Chip
              label={en.trips.cancelled}
              selected={activeFilter === 'cancelled'}
              onPress={() => setActiveFilter('cancelled')}
            />
          </View>

          {/* Trip Cards */}
          <View style={styles.tripsList}>
            {filteredTrips.map((trip) => {
              const isCancelled = trip.status === 'cancelled';
              return (
                <Card key={trip.id} variant="card" style={styles.tripCard}>
                  <View style={styles.tripHeaderRow}>
                    <Text style={styles.routeText}>
                      {`${trip.pickup} → ${trip.drop}`}
                    </Text>
                    <Text style={styles.fareText}>{formatINR(trip.fare)}</Text>
                  </View>

                  <View style={styles.statusRow}>
                    {isCancelled ? (
                      <Text style={styles.cancelledLabel}>
                        Cancelled{' '}
                        <Text style={styles.dateLabel}>· Yesterday</Text>
                      </Text>
                    ) : (
                      <Text style={styles.dateLabel}>{trip.dateLabel}</Text>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs activeTab="trips" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    borderRadius: shape.cardRadius,
    padding: 18,
    marginVertical: 0,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeText: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  fareText: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  statusRow: {
    marginTop: 6,
  },
  dateLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.mutedText,
  },
  cancelledLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: colors.danger,
  },
});
