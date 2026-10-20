import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNavTab } from '../types';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  pendingBookingsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingBookingsCount = 0,
}) => {
  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabChange('home')}
        style={styles.tabItem}
      >
        <Feather
          name="home"
          size={22}
          color={activeTab === 'home' ? '#075B64' : '#8FA8A8'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'home' && styles.activeTabLabel,
          ]}
        >
          Home
        </Text>
        {activeTab === 'home' && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* Bookings Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabChange('bookings')}
        style={styles.tabItem}
      >
        <View style={styles.iconWrapper}>
          <Feather
            name="calendar"
            size={22}
            color={activeTab === 'bookings' ? '#075B64' : '#8FA8A8'}
          />
          {pendingBookingsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingBookingsCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'bookings' && styles.activeTabLabel,
          ]}
        >
          Bookings
        </Text>
        {activeTab === 'bookings' && <View style={styles.activeDot} />}
      </TouchableOpacity>

      {/* Trips Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onTabChange('trips')}
        style={styles.tabItem}
      >
        <Feather
          name="navigation"
          size={22}
          color={activeTab === 'trips' ? '#075B64' : '#8FA8A8'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'trips' && styles.activeTabLabel,
          ]}
        >
          Trips
        </Text>
        {activeTab === 'trips' && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(111, 165, 165, 0.3)',
    paddingVertical: 8,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#F5B83D',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8FA8A8',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#075B64',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5B83D',
    marginTop: 2,
  },
});
