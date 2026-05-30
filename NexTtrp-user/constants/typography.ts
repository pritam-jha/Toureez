/**
 * @file constants/typography.ts
 * @description NEXTTRP type scale.
 */

import { Platform } from 'react-native';

export const Typography = {
  sizes: {
    xxs: 10,
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    default: 15,
    lg: 16,
    xl: 17,
    xxl: 18,
    title: 20,
    section: 22,
    page: 24,
    hero: 28,
    display: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Compatibility aliases.
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
    hero: 32,
  },
  fontWeights: {
    thin: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight: 0,
    normal: 0,
    wide: 0,
    ultraWide: 0,
  },
  fontFamilyDisplay: Platform.OS === 'ios' ? 'System' : 'Roboto',
  fontFamilyBody: Platform.OS === 'ios' ? 'System' : 'Roboto',
} as const;
