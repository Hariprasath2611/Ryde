import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoRouter from 'expo-router';
import LanguageScreen from '../app/(auth)/language';
import { useI18nStore, LOCALE_STORAGE_KEY } from '../src/store/useI18nStore';
import { en, ta, hi, te, translations } from '../src/i18n';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

describe('Language Selection & Regional i18n Suite', () => {
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockCanGoBack = jest.fn(() => true);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(ExpoRouter.useRouter).mockReturnValue({
      replace: mockReplace,
      back: mockBack,
      canGoBack: mockCanGoBack,
    } as any);
    useI18nStore.setState({ locale: 'en', isLoaded: true });
    await AsyncStorage.clear();
  });

  describe('LanguageScreen UI', () => {
    it('renders all four regional languages with their native scripts', async () => {
      await act(async () => {
        render(<LanguageScreen />);
      });

      expect(screen.getByText('தமிழ்')).toBeTruthy();
      expect(screen.getByText('English')).toBeTruthy();
      expect(screen.getByText('हिन्दी')).toBeTruthy();
      expect(screen.getByText('తెలుగు')).toBeTruthy();
      expect(screen.getByText('Recommended')).toBeTruthy();
    });

    it('changes selection and updates CTA button live on card press', async () => {
      await act(async () => {
        render(<LanguageScreen />);
      });

      // Initially in English
      expect(screen.getByText('Continue →')).toBeTruthy();

      // Tap Tamil card
      const tamilOption = screen.getByTestId('language-option-ta');
      await act(async () => {
        fireEvent.press(tamilOption);
      });

      // Live CTA button updates to Tamil
      expect(screen.getByText('தொடரவும் →')).toBeTruthy();

      // Tap Hindi card
      const hindiOption = screen.getByTestId('language-option-hi');
      await act(async () => {
        fireEvent.press(hindiOption);
      });
      expect(screen.getByText('आगे बढ़ें →')).toBeTruthy();

      // Tap Telugu card
      const teluguOption = screen.getByTestId('language-option-te');
      await act(async () => {
        fireEvent.press(teluguOption);
      });
      expect(screen.getByText('కొనసాగించండి →')).toBeTruthy();
    });

    it('saves selected locale to AsyncStorage and navigates to login in onboarding mode', async () => {
      await act(async () => {
        render(<LanguageScreen />);
      });

      // Select Tamil
      const tamilOption = screen.getByTestId('language-option-ta');
      await act(async () => {
        fireEvent.press(tamilOption);
      });

      // Tap Continue
      const continueBtn = screen.getByTestId('language-continue-button');
      await act(async () => {
        fireEvent.press(continueBtn);
      });

      const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      expect(savedLocale).toBe('ta');
      expect(useI18nStore.getState().locale).toBe('ta');
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('navigates back when accessed from profile settings mode', async () => {
      jest.mocked(ExpoRouter.useLocalSearchParams).mockReturnValue({
        fromProfile: 'true',
      });

      await act(async () => {
        render(<LanguageScreen />);
      });

      // Tap Telugu
      const teluguOption = screen.getByTestId('language-option-te');
      await act(async () => {
        fireEvent.press(teluguOption);
      });

      const saveBtn = screen.getByTestId('language-continue-button');
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      expect(useI18nStore.getState().locale).toBe('te');
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Dictionary Parity and Completeness', () => {
    function getAllKeys(obj: any, prefix = ''): string[] {
      return Object.keys(obj).reduce((res: string[], el: string) => {
        const fullKey = prefix ? `${prefix}.${el}` : el;
        if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
          res.push(...getAllKeys(obj[el], fullKey));
        } else {
          res.push(fullKey);
        }
        return res;
      }, []);
    }

    const enKeys = getAllKeys(en);

    it('Tamil (ta) dictionary has 100% key parity with English (en)', () => {
      const taKeys = getAllKeys(ta);
      const missingKeys = enKeys.filter((k) => !taKeys.includes(k));
      expect(missingKeys).toEqual([]);
    });

    it('Hindi (hi) dictionary has 100% key parity with English (en)', () => {
      const hiKeys = getAllKeys(hi);
      const missingKeys = enKeys.filter((k) => !hiKeys.includes(k));
      expect(missingKeys).toEqual([]);
    });

    it('Telugu (te) dictionary has 100% key parity with English (en)', () => {
      const teKeys = getAllKeys(te);
      const missingKeys = enKeys.filter((k) => !teKeys.includes(k));
      expect(missingKeys).toEqual([]);
    });

    it('Parameterized functions return valid localized strings across all languages', () => {
      (['en', 'ta', 'hi', 'te'] as const).forEach((loc) => {
        const dict = translations[loc];
        expect(typeof dict.otp.subtitle('+919876543210')).toBe('string');
        expect(typeof dict.otp.resendIn(30)).toBe('string');
        expect(typeof dict.home.greeting('Kumar')).toBe('string');
        expect(typeof dict.offer.offerEndsIn(15)).toBe('string');
        expect(typeof dict.arrivalOtp.subtitle('Ramesh')).toBe('string');
        expect(typeof dict.arrivalOtp.attemptsLeft(2)).toBe('string');
        expect(typeof dict.vehicleCheck.photosCount(3, 6)).toBe('string');
        expect(typeof dict.activeTrip.remaining(10, '4.2', '15:00')).toBe('string');
        expect(typeof dict.finalCheck.returnPhotosCount(4, 6)).toBe('string');
        expect(typeof dict.earnings.summaryStats(12, '6h 30m')).toBe('string');
        expect(typeof dict.account.tripsCount(45)).toBe('string');
      });
    });
  });
});
