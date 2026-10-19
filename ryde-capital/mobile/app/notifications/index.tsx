// ryde-capital/mobile/app/notifications/index.tsx
// Phase 5: Notifications Screen (In-App List, Unread Counter, Mark As Read, Deep Links)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>('/notifications?limit=30');

      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.read_at) {
      await apiClient(`/notifications/${item.id}/read`, { method: 'PATCH' }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    // Handle deep links from data
    if (item.data) {
      if (item.data['type'] === 'OFFER') {
        router.push('/(tabs)');
      } else if (item.data['type'] === 'TRIP' && item.data['tripId']) {
        router.push({ pathname: '/trip', params: { id: String(item.data['tripId']) } });
      } else if (item.data['type'] === 'EARNINGS') {
        router.push('/(tabs)/earnings' as any);
      } else if (item.data['type'] === 'PROFILE') {
        router.push('/(tabs)/profile' as any);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = !item.read_at;
            return (
              <TouchableOpacity
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
                onPress={() => handleMarkAsRead(item)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, isUnread && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardBody}>{item.body}</Text>
                <Text style={styles.cardTime}>
                  {new Date(item.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  markAllText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#64748b', fontSize: 15 },
  notificationCard: {
    backgroundColor: '#131b2e',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  unreadCard: {
    backgroundColor: '#18243e',
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#cbd5e1' },
  unreadTitle: { color: '#f8fafc', fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  cardBody: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 8 },
  cardTime: { fontSize: 11, color: '#64748b' },
});
