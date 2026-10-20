import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { RydeLogo } from './RydeLogo';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showActions?: boolean;
  unreadCount?: number;
  avatarUrl?: string;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  showActions = false,
  unreadCount = 0,
  avatarUrl,
  onNotificationsClick,
  onProfileClick,
}) => {
  const canShowBack = showBack && typeof onBack === 'function';

  return (
    <View style={styles.header}>
      {/* Left Slot: Back Button (width 80 for perfect symmetrical balance) */}
      <View style={styles.leftSlot}>
        {canShowBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#075B64" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Slot: RYDE Brand Logo */}
      <View style={styles.centerSlot}>
        <RydeLogo size="md" />
      </View>

      {/* Right Slot: Notification Bell & Profile Avatar (width 80) */}
      <View style={styles.rightSlot}>
        {showActions ? (
          <View style={styles.rightActionsRow}>
            {/* Notifications Bell */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNotificationsClick}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Notifications"
            >
              <Feather name="bell" size={20} color="#075B64" />
              {unreadCount > 0 && <View style={styles.alertDot} />}
            </TouchableOpacity>

            {/* Profile Avatar */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onProfileClick}
              style={styles.avatarButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Driver Profile"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={15} color="#075B64" />
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 10,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  leftSlot: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(7, 91, 100, 0.25)',
    elevation: 2,
    shadowColor: '#075B64',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(7, 91, 100, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 2,
  },
  alertDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5B83D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#075B64',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
