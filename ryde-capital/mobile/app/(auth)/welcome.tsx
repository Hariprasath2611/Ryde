import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Button } from '../../src/components/Button';
import { StepDots } from '../../src/components/StepDots';
import { en } from '../../src/i18n/en';

interface SlideData {
  number: string;
  title: string;
  subtitle: string;
  button: string;
}

const SLIDES: SlideData[] = [
  en.welcome.slide1,
  en.welcome.slide2,
  en.welcome.slide3,
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = SLIDES[currentSlide];

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Large Number Badge */}
        <View style={styles.topArea}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{slide.number}</Text>
          </View>
        </View>

        {/* Text and Dots Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <StepDots total={SLIDES.length} activeIndex={currentSlide} />
        </View>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <Button
            title={slide.button}
            variant="amber"
            onPress={handleNext}
            style={styles.primaryButton}
          />
          <Button
            title={en.welcome.skip}
            variant="text"
            onPress={handleSkip}
            style={styles.skipButton}
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
    paddingTop: 80,
  },
  numberBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: typography.fontSize.screenTitle,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    width: '100%',
  },
  skipButton: {
    minHeight: 44,
  },
});
