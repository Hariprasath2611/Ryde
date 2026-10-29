import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  BackHandler,
  AccessibilityInfo,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Button } from '../../src/components/Button';
import { StepDots } from '../../src/components/StepDots';
import {
  Slide1Panel,
  Slide2Panel,
  Slide3Panel,
} from '../../src/components/welcome/WelcomePanels';

export const HAS_SEEN_WELCOME_KEY = '@ryde_has_seen_welcome';

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  renderPanel: (height: number, reduceMotion: boolean) => React.ReactNode;
}

const SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    title: 'Your vehicle.\nOur driver.',
    subtitle:
      'Get booked by owners who need a trusted professional to drive their own bike, auto or car.',
    renderPanel: (height, reduceMotion) => (
      <Slide1Panel height={height} reduceMotion={reduceMotion} />
    ),
  },
  {
    id: 'slide-2',
    title: 'Know every trip\nbefore you accept',
    subtitle:
      'See pickup, drop and route up front, then navigate with one tap.',
    renderPanel: (height, reduceMotion) => (
      <Slide2Panel height={height} reduceMotion={reduceMotion} />
    ),
  },
  {
    id: 'slide-3',
    title: 'Verified, tracked\nand protected',
    subtitle:
      'Start codes, vehicle checks and an SOS button keep you and every vehicle safe.',
    renderPanel: (height, reduceMotion) => (
      <Slide3Panel height={height} reduceMotion={reduceMotion} />
    ),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  // Compute adaptive panel height for standard and small screens (min 260, max 380)
  const isShortScreen = windowHeight < 720;
  const panelHeight = isShortScreen
    ? 260
    : Math.min(380, Math.max(260, windowHeight - 480));

  // Check Accessibility reduce motion setting
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReduceMotion(enabled);
      },
    );

    return () => {
      isMounted = false;
      listener?.remove?.();
    };
  }, []);

  // Announce slide index for screen readers
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Slide ${currentSlide + 1} of 3`);
  }, [currentSlide]);

  const scrollToSlide = useCallback((index: number) => {
    try {
      flatListRef.current?.scrollToIndex({ index, animated: !reduceMotion });
    } catch {}
    currentSlideRef.current = index;
    setCurrentSlide(index);
    Haptics.selectionAsync().catch(() => {});
  }, [reduceMotion]);

  // Complete welcome flow and navigate to language selection
  const completeWelcome = useCallback(async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save welcome state to storage:', e);
    }
    router.replace('/(auth)/language');
  }, [router]);

  // Handle Next button press
  const handleNext = () => {
    if (currentSlideRef.current < SLIDES.length - 1) {
      scrollToSlide(currentSlideRef.current + 1);
    } else {
      completeWelcome();
    }
  };

  // Android Back Handler
  useEffect(() => {
    const onBackPress = () => {
      if (currentSlideRef.current > 0) {
        scrollToSlide(currentSlideRef.current - 1);
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [scrollToSlide]);

  const onMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index >= 0 && index < SLIDES.length && index !== currentSlideRef.current) {
      currentSlideRef.current = index;
      setCurrentSlide(index);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <ScreenBackground deco={true}>
      <View style={styles.container}>
        {/* Header: Brand wordmark on the left, Skip on the right */}
        <View style={styles.header}>
          <View style={styles.headerBrand} accessible={true} accessibilityLabel="Ryde Capital">
            <Text style={styles.headerTeal}>Ryde</Text>
            <Text style={styles.headerAmber}> Capital</Text>
          </View>

          <TouchableOpacity
            onPress={completeWelcome}
            style={styles.skipButton}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Skip intro and go to login"
            testID="welcome-skip-button"
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Content */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          getItemLayout={(_data, index) => ({
            length: windowWidth,
            offset: windowWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: windowWidth }]}>
              {/* Picture Panel */}
              <View style={styles.panelWrapper}>
                {item.renderPanel(panelHeight, reduceMotion)}
              </View>

              {/* Text Info */}
              <View style={styles.textWrapper}>
                <Text
                  style={[
                    styles.title,
                    isShortScreen && styles.titleShort,
                  ]}
                  maxFontSizeMultiplier={1.3}
                  testID={`slide-title-${item.id}`}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    isShortScreen && styles.subtitleShort,
                  ]}
                  maxFontSizeMultiplier={1.3}
                  testID={`slide-subtitle-${item.id}`}
                >
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Footer Area: Dots + Primary Action Button */}
        <View style={styles.footer}>
          {/* Animated Interactive Page Dots */}
          <StepDots
            total={SLIDES.length}
            activeIndex={currentSlide}
            onDotPress={scrollToSlide}
            style={styles.dots}
          />

          {/* Primary Action Button */}
          <Button
            title={isLastSlide ? 'Get started' : 'Next →'}
            variant="amber"
            onPress={handleNext}
            style={styles.primaryButton}
            accessibilityLabel={isLastSlide ? 'Get started and proceed to login' : 'Next slide'}
            testID="welcome-next-button"
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 4,
    minHeight: 48,
    zIndex: 10,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTeal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.darkTeal,
    letterSpacing: -0.5,
  },
  headerAmber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: -0.5,
  },
  skipButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'flex-start',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  panelWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  textWrapper: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.darkTeal,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleShort: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 330,
  },
  subtitleShort: {
    fontSize: 13.5,
    lineHeight: 19,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
    alignItems: 'center',
    width: '100%',
  },
  dots: {
    marginTop: 6,
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
  },
});
