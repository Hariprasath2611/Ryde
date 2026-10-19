// ryde-capital/mobile/src/i18n/index.ts
// Internationalization (i18n) scaffolding for Ryde Capital
// Defaults to English (en-IN) with Hindi (hi-IN), Kannada (kn-IN), and Tamil (ta-IN) scaffolding

export type SupportedLocale = 'en' | 'hi' | 'kn' | 'ta';

export interface TranslationDictionary {
  common: {
    appName: string;
    online: string;
    offline: string;
    retry: string;
    cancel: string;
    confirm: string;
    loading: string;
    save: string;
  };
  navigation: {
    home: string;
    trips: string;
    earnings: string;
    profile: string;
    terms: string;
    privacy: string;
  };
  trip: {
    pickup: string;
    dropoff: string;
    headingToPickup: string;
    arrived: string;
    startTrip: string;
    completeTrip: string;
    enterOtp: string;
    openInGoogleMaps: string;
  };
  safety: {
    sos: string;
    emergencyContacts: string;
    shareTrip: string;
    alertSent: string;
  };
}

const en: TranslationDictionary = {
  common: {
    appName: 'Ryde Capital',
    online: 'ONLINE',
    offline: 'OFFLINE',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    save: 'Save',
  },
  navigation: {
    home: 'Home',
    trips: 'Trips',
    earnings: 'Earnings',
    profile: 'Profile',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  },
  trip: {
    pickup: 'Pickup Location',
    dropoff: 'Drop Location',
    headingToPickup: 'Heading to Pickup',
    arrived: 'Arrived at Pickup',
    startTrip: 'Start Trip',
    completeTrip: 'Complete Trip',
    enterOtp: 'Enter Customer OTP',
    openInGoogleMaps: 'Navigate with Google Maps',
  },
  safety: {
    sos: 'EMERGENCY SOS',
    emergencyContacts: 'Emergency Contacts',
    shareTrip: 'Share Live Trip',
    alertSent: 'Emergency alert dispatched to contacts',
  },
};

const hi: TranslationDictionary = {
  common: {
    appName: 'राइड कैपिटल',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    loading: 'लोड हो रहा है...',
    save: 'सहेजें',
  },
  navigation: {
    home: 'होम',
    trips: 'सफ़र',
    earnings: 'कमाई',
    profile: 'प्रोफ़ाइल',
    terms: 'नियम और शर्तें',
    privacy: 'गोपनीयता नीति',
  },
  trip: {
    pickup: 'पिकअप स्थान',
    dropoff: 'ड्रॉप स्थान',
    headingToPickup: 'पिकअप की ओर जा रहे हैं',
    arrived: 'पिकअप पर पहुंच गए',
    startTrip: 'सफ़र शुरू करें',
    completeTrip: 'सफ़र समाप्त करें',
    enterOtp: 'ग्राहक ओटीपी दर्ज करें',
    openInGoogleMaps: 'गूगल मैप्स में नेविगेट करें',
  },
  safety: {
    sos: 'आपातकालीन एसओएस',
    emergencyContacts: 'आपातकालीन संपर्क',
    shareTrip: 'लाइव सफ़र साझा करें',
    alertSent: 'संपर्कों को आपातकालीन चेतावनी भेजी गई',
  },
};

const translations: Record<SupportedLocale, TranslationDictionary> = {
  en,
  hi,
  kn: en, // Scaffolded for Kannada localization
  ta: en, // Scaffolded for Tamil localization
};

let currentLocale: SupportedLocale = 'en';

export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(): TranslationDictionary {
  return translations[currentLocale] || translations.en;
}
