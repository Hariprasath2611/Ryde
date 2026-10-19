import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { en } from '../../src/i18n/en';
import { useAppStore } from '../../src/store/useAppStore';

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useAppStore();

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{en.notifications.title}</Text>

          <View style={styles.list}>
            {notifications.map((item) => {
              const isUnread = !item.read;
              return (
                <Card
                  key={item.id}
                  variant={isUnread ? 'card' : 'soft'}
                  style={styles.notificationCard}
                >
                  <View style={styles.headerRow}>
                    {isUnread && <View style={styles.unreadAmberDot} />}
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardMessage}>{item.message}</Text>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
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
  list: {
    gap: 14,
  },
  notificationCard: {
    borderRadius: shape.cardRadius,
    padding: 20,
    marginVertical: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  unreadAmberDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.amber,
  },
  cardTitle: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  cardMessage: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    lineHeight: 22,
  },
});
