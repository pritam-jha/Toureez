/**
 * @file constants/typography.ts
 * @description Typography scale for XYZ Premium Light 3D design system.
 * All font sizes, weights, line heights, and letter spacings are defined here.
 */

import { Platform } from 'react-native';

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
    hero: 44,
  },

  fontWeights: {
    thin: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    ultraWide: 1.5,
  },

  /**
   * Display font family — SF Pro Display on iOS, Roboto on Android.
   * Use for headings and hero text.
   */
  fontFamilyDisplay: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',

  /**
   * Body font family — System default.
   */
  fontFamilyBody: Platform.OS === 'ios' ? 'System' : 'Roboto',
} as const;
