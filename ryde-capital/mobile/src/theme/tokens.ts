/**
 * Design Tokens for Ryde Capital
 * Single source of truth for theming, typography, sizing, and colors.
 * Light theme only. Every screen derives styles strictly from these tokens.
 */

export const colors = {
  // Backgrounds & Panels
  background: '#D8EDEF',
  card: '#ACCDD1',
  secondaryPanel: '#9CC2C6',
  softCard: '#E9F5F6',
  white: '#FFFFFF',

  // Brand, Actions & Accents
  darkTeal: '#0E5C63',    // Buttons, borders, logo text, main titles
  midTeal: '#6DA1A4',     // Decorative circles, icon containers
  amber: '#F2B441',       // Primary CTA buttons, highlights, active indicator
  ink: '#07383E',         // All body text on cards, primary content
  mutedText: '#35666B',   // Subtitles, captions, inactive labels

  // Status & Safety
  danger: '#C0392B',      // SOS, cancel alert, error states
  success: '#1E9E62',     // Approved, verified, completed checkmarks
  warning: '#F2B441',

  // Map Theme
  map: '#1A2532',
  routeBlue: '#3B82F6',

  // Backward-compatibility aliases
  primary: '#F2B441',
  textPrimary: '#07383E',
  textSecondary: '#35666B',
  border: '#0E5C63',
  cardBackground: '#ACCDD1',
  textInverse: '#FFFFFF',
  info: '#3B82F6',
  textMuted: '#35666B',
} as const;

export const typography = {
  fontFamily: {
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extraBold: 'PlusJakartaSans-ExtraBold',
  },
  fontSize: {
    amountHuge: 44,
    amountLarge: 40,
    titleLarge: 34,
    screenTitle: 28,
    titleMedium: 22,
    title: 22,
    subheading: 20,
    button: 18,
    buttonSmall: 16,
    body: 15,
    caption: 14,
    label: 13,
    micro: 12,
  },
  // Backward compatibility alias for legacy tests/screens
  fontSizes: {
    amountHuge: 44,
    amountLarge: 40,
    titleLarge: 34,
    screenTitle: 28,
    titleMedium: 22,
    title: 22,
    subheading: 20,
    subtitle: 20,
    button: 18,
    buttonSmall: 16,
    body: 15,
    bodySmall: 14,
    caption: 12,
    label: 13,
    micro: 12,
  },
  lineHeight: {
    amountHuge: 50,
    amountLarge: 46,
    titleLarge: 40,
    screenTitle: 34,
    titleMedium: 28,
    subheading: 26,
    button: 24,
    body: 22,
    caption: 20,
    label: 18,
    micro: 16,
  },
  fontWeight: {
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  // Backward compatibility alias for legacy tests/screens
  fontWeights: {
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
} as const;

export const shape = {
  // Pill button dimensions
  buttonHeight: 54,
  buttonRadius: 27,

  // Text field dimensions
  fieldHeight: 52,
  fieldBorderWidth: 2,
  fieldBorderColor: colors.darkTeal,
  fieldRadius: 14,

  // Cards
  cardRadius: 20,
  cardRadiusLarge: 24,
  cardRadiusSmall: 12,

  // Minimum touch target (accessibility standard)
  minTouchTarget: 48,

  // Active tab indicator
  tabIndicatorHeight: 4,
  tabIndicatorRadius: 2,
} as const;

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const tokens = {
  colors,
  typography,
  shape,
  spacing,
  borderRadius,
} as const;

export default tokens;
