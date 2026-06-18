/**
 * @file constants/theme.ts
 * Shared spacing, typography, radius, shadow, and layout tokens.
 */

import { Platform } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
  huge: 64,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 24,
  '5xl': 28,
  '6xl': 34,
  display: 38,
} as const;

export const LineHeight = {
  tight: 1.22,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  normal: 0,
  wide: 0.2,
  wider: 0.4,
  widest: 0.6,
} as const;

export const TypographyVariants = {
  display: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    lineHeight: Math.round(FontSize.display * LineHeight.tight),
    letterSpacing: LetterSpacing.normal,
  },
  h1: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.bold,
    lineHeight: Math.round(FontSize['5xl'] * LineHeight.tight),
    letterSpacing: LetterSpacing.normal,
  },
  h2: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: Math.round(FontSize['4xl'] * LineHeight.snug),
    letterSpacing: LetterSpacing.normal,
  },
  h3: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: Math.round(FontSize['3xl'] * LineHeight.snug),
    letterSpacing: LetterSpacing.normal,
  },
  h4: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: Math.round(FontSize['2xl'] * LineHeight.snug),
    letterSpacing: LetterSpacing.normal,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: Math.round(FontSize.base * LineHeight.normal),
    letterSpacing: LetterSpacing.normal,
  },
  bodySm: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: Math.round(FontSize.md * LineHeight.normal),
    letterSpacing: LetterSpacing.normal,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: Math.round(FontSize.sm * LineHeight.normal),
    letterSpacing: LetterSpacing.normal,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: Math.round(FontSize.xs * LineHeight.normal),
    letterSpacing: LetterSpacing.wider,
  },
  mono: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: Math.round(FontSize.md * LineHeight.normal),
    letterSpacing: LetterSpacing.normal,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
} as const;

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

function shadow(opts: {
  iosOpacity: number;
  iosRadius: number;
  iosOffset: { width: number; height: number };
  androidElevation: number;
  webBoxShadow: string;
}) {
  return Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOpacity: opts.iosOpacity,
      shadowRadius: opts.iosRadius,
      shadowOffset: opts.iosOffset,
    },
    android: {
      elevation: opts.androidElevation,
    },
    web: {
      boxShadow: opts.webBoxShadow,
    },
    default: {},
  }) as object;
}

export const Shadows = {
  none: {},
  sm: shadow({
    iosOpacity: 0.05,
    iosRadius: 5,
    iosOffset: { width: 0, height: 1 },
    androidElevation: 1,
    webBoxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 1px 1px rgba(15,23,42,0.03)',
  }),
  md: shadow({
    iosOpacity: 0.08,
    iosRadius: 14,
    iosOffset: { width: 0, height: 5 },
    androidElevation: 3,
    webBoxShadow: '0 8px 20px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)',
  }),
  lg: shadow({
    iosOpacity: 0.12,
    iosRadius: 24,
    iosOffset: { width: 0, height: 12 },
    androidElevation: 8,
    webBoxShadow: '0 16px 36px rgba(15,23,42,0.12), 0 4px 10px rgba(15,23,42,0.06)',
  }),
} as const;

export const ZIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const;

export const Duration = {
  instant: 80,
  fast: 150,
  base: 220,
  slow: 320,
  slower: 480,
} as const;

export const TouchTarget = {
  min: 44,
  comfortable: 48,
} as const;

export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.lg,
  headerHeight: 60,
  toolbarHeight: 72,
  inputHeight: 48,
  maxContentWidth: 1180,
  maxReadingWidth: 760,
} as const;

export const Theme = {
  spacing: Spacing,
  fontSize: FontSize,
  fontWeight: FontWeight,
  lineHeight: LineHeight,
  letterSpacing: LetterSpacing,
  typography: TypographyVariants,
  radius: Radius,
  shadows: Shadows,
  zIndex: ZIndex,
  duration: Duration,
  touchTarget: TouchTarget,
  layout: Layout,
} as const;

export type ThemeType = typeof Theme;
