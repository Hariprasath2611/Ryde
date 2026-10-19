import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors, typography } from '../src/theme/tokens';
import { ScreenBackground } from '../src/components/ScreenBackground';
import { Button } from '../src/components/Button';
import { en } from '../src/i18n/en';

export default function OfflineScreen() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Top Warning Badge */}
        <View style={styles.topArea}>
          <View style={styles.badgeCircle}>
            <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L1 21h22L12 2zm0 3.5l8.5 14.5H3.5L12 5.5z"
                fill={colors.darkTeal}
              />
              <Path d="M11 10h2v5h-2v-5zm0 6h2v2h-2v-2z" fill={colors.darkTeal} />
            </Svg>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.middleArea}>
          <Text style={styles.title}>{en.offline.title}</Text>
          <Text style={styles.subtitle}>{en.offline.subtitle}</Text>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <Button
            title={en.offline.tryAgain}
            variant="amber"
            onPress={handleTryAgain}
            accessibilityLabel="Try again"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 100,
  },
  badgeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleArea: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    paddingBottom: 16,
  },
});
