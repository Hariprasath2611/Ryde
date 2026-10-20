import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Polygon, Circle } from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { RydeLogo } from '../components/RydeLogo';

interface Screen1SplashProps {
  onGetStarted: () => void;
}

export const Screen1Splash: React.FC<Screen1SplashProps> = ({ onGetStarted }) => {
  return (
    <View style={styles.container}>
      {/* Top Left Corner Decoration (Teal arc with Amber stroke) */}
      <View style={styles.topLeft} pointerEvents="none">
        <Svg width={180} height={180} viewBox="0 0 160 160">
          <Circle
            cx="40"
            cy="40"
            r="105"
            stroke="#ECA233"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          <Circle cx="40" cy="40" r="82" fill="#5A9396" />
        </Svg>
      </View>

      {/* Bottom Right Corner Decoration (Teal arc with Amber stroke) */}
      <View style={styles.bottomRight} pointerEvents="none">
        <Svg width={200} height={200} viewBox="0 0 180 180">
          <Circle
            cx="140"
            cy="140"
            r="120"
            stroke="#ECA233"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          <Circle cx="140" cy="140" r="95" fill="#5A9396" />
        </Svg>
      </View>

      {/* Main Content Area */}
      <View style={styles.innerContent}>
        {/* Top Logo & Tagline */}
        <View style={styles.logoSection}>
          <RydeLogo size="xl" withTagline />
        </View>

        {/* Center 3 Badges with Vertical Dividers */}
        <View style={styles.badgesContainer}>
          {/* Badge 1: Safe & Trusted Drivers */}
          <View style={styles.badgeCol}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#1E293B" />
            </View>
            <Text style={styles.badgeText}>safe &{'\n'}trusted Drivers</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Badge 2: Live Tracking */}
          <View style={styles.badgeCol}>
            <View style={styles.iconBox}>
              <Ionicons name="location-sharp" size={32} color="#1E293B" />
            </View>
            <Text style={styles.badgeText}>live{'\n'}Tracking</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Badge 3: On Time Every Time */}
          <View style={styles.badgeCol}>
            <View style={styles.iconBox}>
              <Ionicons name="time-outline" size={32} color="#1E293B" />
            </View>
            <Text style={styles.badgeText}>On time{'\n'}Every Time</Text>
          </View>
        </View>

        {/* Dotted Loop Path & Get Started Button */}
        <View style={styles.actionSection} pointerEvents="box-none">
          <Svg
            width={310}
            height={220}
            viewBox="0 0 310 220"
            style={styles.svgLoop}
            pointerEvents="none"
          >
            {/* Curving Dotted Loop Path matching Image 1 */}
            <Path
              d="M 15 210 C 50 195, 95 160, 128 128 C 150 95, 145 38, 112 28 C 80 18, 55 52, 60 95 C 66 128, 102 135, 128 128 C 168 132, 218 118, 252 70 C 264 52, 272 36, 276 18"
              stroke="#718096"
              strokeWidth="2.2"
              strokeDasharray="5 5"
              fill="none"
            />
            {/* Arrowhead pointing upward-right */}
            <Polygon points="264,28 280,12 286,28" fill="#718096" />
          </Svg>

          {/* Prominent Amber "Get Started →" Button */}
          <TouchableOpacity
            onPress={onGetStarted}
            activeOpacity={0.85}
            style={styles.getStartedButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Tagline Description */}
        <Text style={styles.bottomTagline}>
          Your journey starts here. Let's{'\n'}make every ride safe and{'\n'}effortless.
        </Text>

        {/* Bottom Pagination Dots */}
        <View style={styles.paginationRow}>
          <View style={styles.activePill} />
          <View style={styles.inactiveDot} />
          <View style={styles.inactiveDot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF0F0',
    position: 'relative',
    overflow: 'hidden',
  },
  topLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    zIndex: 1,
  },
  bottomRight: {
    position: 'absolute',
    bottom: -45,
    right: -45,
    zIndex: 1,
  },
  innerContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 24 : 44,
    paddingBottom: 28,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    marginTop: 10,
  },
  badgeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    marginHorizontal: 4,
  },
  actionSection: {
    width: 310,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  svgLoop: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECA233',
    width: 220,
    height: 50,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#ECA233',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bottomTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginTop: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  activePill: {
    width: 30,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ECA233',
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E525A',
  },
});
