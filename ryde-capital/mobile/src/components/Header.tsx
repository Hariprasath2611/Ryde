import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../theme/tokens';
import { BRAND } from '../config/brand';

export interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  showBrand?: boolean;
  rightAction?: React.ReactNode;
  showHomeActions?: boolean;
  unreadNotifications?: boolean;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  avatarInitial?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  title,
  showBrand = true,
  rightAction,
  showHomeActions = false,
  unreadNotifications = false,
  onNotificationsPress,
  onProfilePress,
  avatarInitial = 'A',
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.header}>
      {/* Left side */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : null}

        {showHomeActions && (
          <View style={styles.brandRow}>
            <Text style={styles.brandTeal}>{BRAND.tealPart}</Text>
            <Text style={styles.brandAmber}> {BRAND.amberPart}</Text>
          </View>
        )}
      </View>

      {/* Center side */}
      <View style={styles.centerContainer}>
        {showBrand && !showHomeActions ? (
          <View style={styles.brandRow}>
            <Text style={styles.brandTeal}>{BRAND.tealPart}</Text>
            <Text style={styles.brandAmber}> {BRAND.amberPart}</Text>
          </View>
        ) : title ? (
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Right side */}
      <View style={styles.rightContainer}>
        {showHomeActions ? (
          <View style={styles.homeActionsRow}>
            <TouchableOpacity
              onPress={onNotificationsPress || (() => router.push('/notifications'))}
              style={styles.bellButton}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadNotifications && <View style={styles.unreadBadge} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onProfilePress || (() => router.push('/(tabs)/profile'))}
              style={styles.avatarButton}
              accessibilityLabel="Profile"
              accessibilityRole="button"
            >
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rightAction || <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  leftContainer: {
    minWidth: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    minWidth: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ACCDD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTeal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.darkTeal,
    letterSpacing: -0.5,
  },
  brandAmber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: -0.5,
  },
  titleText: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
  homeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bellIcon: {
    fontSize: 18,
  },
  unreadBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});

export default Header;
