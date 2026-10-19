/**
 * Design System Tokens
 *
 * NOTE: [TO BE REPLACED WITH THE DESIGN TEAM'S TOKENS]
 * These tokens provide foundational values for Phase 0 scaffolding.
 */

export const colors = {
  // Brand colors
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryLight: '#DBEAFE',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Neutral / Background colors
  background: '#0F172A',
  cardBackground: '#1E293B',
  border: '#334155',

  // Typography colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontSizes: {
    caption: 12,
    bodySmall: 14,
    body: 16,
    subtitle: 18,
    title: 24,
    headline: 32,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
  },
  lineHeights: {
    caption: 16,
    bodySmall: 20,
    body: 24,
    subtitle: 26,
    title: 32,
    headline: 40,
  },
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
