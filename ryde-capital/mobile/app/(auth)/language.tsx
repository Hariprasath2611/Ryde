import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, typography, shape } from '../../src/theme/tokens';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import {
  useTranslation,
  LANGUAGE_OPTIONS,
  SupportedLocale,
  LanguageOption,
} from '../../src/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromProfile?: string }>();
  const isFromProfile = params.fromProfile === 'true';

  const { locale: currentLocale, setLocale, t } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>(currentLocale);
  const [isSaving, setIsSaving] = useState(false);

  const selectedOption = LANGUAGE_OPTIONS.find((opt) => opt.id === selectedLocale) || LANGUAGE_OPTIONS[0];

  const handleSelectLanguage = (option: LanguageOption) => {
    setSelectedLocale(option.id);
    Haptics.selectionAsync().catch(() => {});
  };

  // Handle hardware back button
  React.useEffect(() => {
    const onBackPress = () => {
      if (isFromProfile) {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/profile');
      } else {
        router.replace('/(auth)/welcome');
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isFromProfile, router]);

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      await setLocale(selectedLocale);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      if (isFromProfile) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch (e) {
      console.warn('Failed to save selected locale:', e);
      setIsSaving(false);
    }
  };

  const ctaButtonText = isFromProfile
    ? t.language.save
    : selectedOption.ctaLabel;

  return (
    <ScreenBackground deco={true}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          showBack={true}
          onBack={() => {
            if (isFromProfile) {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/profile');
            } else {
              router.replace('/(auth)/welcome');
            }
          }}
          showBrand={true}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title and Bilingual Heading */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t.language.title}</Text>
            {selectedLocale !== 'ta' && (
              <Text style={styles.tamilSubtitle}>
                உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்
              </Text>
            )}
            <Text style={styles.description}>
              {t.language.subtitle}
            </Text>
          </View>

          {/* Language Options List */}
          <View style={styles.optionsContainer}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selectedLocale === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  testID={`language-option-${option.id}`}
                  style={[
                    styles.languageCard,
                    isSelected ? styles.languageCardSelected : styles.languageCardDefault,
                  ]}
                  onPress={() => handleSelectLanguage(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${option.label}, ${option.sublabel}`}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardLeft}>
                    {/* Radio Button */}
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected ? styles.radioOuterSelected : styles.radioOuterDefault,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    {/* Text Details */}
                    <View style={styles.textContainer}>
                      <View style={styles.labelRow}>
                        <Text
                          style={[
                            styles.languageLabel,
                            isSelected ? styles.languageLabelSelected : styles.languageLabelDefault,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.badge && (
                          <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{option.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.languageSublabel}>{option.sublabel}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky Bottom Action Container */}
        <View style={styles.bottomBar}>
          <Button
            title={ctaButtonText}
            onPress={handleConfirm}
            loading={isSaving}
            variant="amber"
            testID="language-continue-button"
            accessibilityLabel={ctaButtonText}
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 110,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: typography.fontSize.screenTitle,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tamilSubtitle: {
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.darkTeal,
    marginBottom: 8,
  },
  description: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.medium,
    color: colors.mutedText,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 14,
  },
  languageCard: {
    borderRadius: shape.cardRadius,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  languageCardDefault: {
    backgroundColor: colors.white,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    backgroundColor: colors.softCard,
    borderColor: colors.darkTeal,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioOuterDefault: {
    borderColor: colors.secondaryPanel,
    backgroundColor: colors.white,
  },
  radioOuterSelected: {
    borderColor: colors.darkTeal,
    backgroundColor: colors.white,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.amber,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: typography.fontSize.subheading,
    fontFamily: typography.fontFamily.bold,
  },
  languageLabelDefault: {
    color: colors.ink,
  },
  languageLabelSelected: {
    color: colors.darkTeal,
  },
  languageSublabel: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.medium,
    color: colors.mutedText,
  },
  badgeContainer: {
    backgroundColor: '#C5E2E5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.midTeal,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.darkTeal,
    letterSpacing: 0.2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    paddingTop: 14,
    backgroundColor: 'rgba(216, 237, 239, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(14, 92, 99, 0.1)',
  },
});
