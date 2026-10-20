import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, typography, shape } from '../theme/tokens';

export type TabKey = 'home' | 'trips' | 'earnings' | 'profile';

export interface BottomTabsProps {
  activeTab?: TabKey;
  onTabPress?: (tab: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string; route: string }> = [
  { key: 'home', label: 'Home', route: '/(tabs)/home' },
  { key: 'trips', label: 'Trips', route: '/(tabs)/trips' },
  { key: 'earnings', label: 'Earnings', route: '/(tabs)/earnings' },
  { key: 'profile', label: 'Profile', route: '/(tabs)/profile' },
];

export const BottomTabs: React.FC<BottomTabsProps> = ({
  activeTab,
  onTabPress,
}) => {
  const router = useRouter();
  const pathname = typeof usePathname === 'function' ? (usePathname() || '') : '';

  const getResolvedActiveTab = (): TabKey => {
    if (activeTab) return activeTab;
    if (pathname.includes('/trips')) return 'trips';
    if (pathname.includes('/earnings')) return 'earnings';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  const resolved = getResolvedActiveTab();

  const handlePress = (tab: TabKey, route: string) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      router.push(route as any);
    }
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === resolved;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handlePress(tab.key, tab.route)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
            {isActive ? (
              <View style={styles.indicator} />
            ) : (
              <View style={styles.indicatorPlaceholder} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: colors.secondaryPanel,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    borderTopWidth: 0,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: shape.minTouchTarget,
  },
  tabLabel: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
  tabLabelInactive: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.mutedText,
  },
  indicator: {
    width: 28,
    height: shape.tabIndicatorHeight,
    borderRadius: shape.tabIndicatorRadius,
    backgroundColor: colors.amber,
    marginTop: 6,
  },
  indicatorPlaceholder: {
    height: shape.tabIndicatorHeight,
    marginTop: 6,
  },
});

export default BottomTabs;
