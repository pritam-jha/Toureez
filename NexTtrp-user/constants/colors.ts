/**
 * @file constants/colors.ts
 * @description NEXTTRP light brand palette.
 */

export const Colors = {
  // Primary Brand
  primary: '#E8631A',
  primaryDark: '#CC3300',
  primaryLight: '#FEF0E8',
  primaryUltraLight: '#FFF8F0',

  // Secondary
  secondary: '#0099CC',
  secondaryDark: '#0077AA',
  secondaryLight: '#E0F4FF',

  // Accent
  accent: '#FFB800',
  accentDark: '#E0A000',
  accentLight: '#FEF3C7',

  // Navy
  navy: '#1A1A2E',
  navyMedium: '#2D2D44',
  navyLight: '#3D3D5C',

  // Backgrounds
  background: '#FFF8F0',
  backgroundWhite: '#FFFFFF',
  backgroundSoft: '#FFF3E8',
  surface: '#FFFFFF',

  // Text
  text: '#1A1A2E',
  textSecondary: '#5C5C7A',
  textLight: '#9896B0',
  textWhite: '#FFFFFF',
  textOrange: '#E8631A',
  textBlue: '#0099CC',

  // UI
  border: '#EDE8E0',
  borderLight: '#F5F0EA',
  divider: '#F0EBE3',

  // Semantic
  star: '#FFB800',
  error: '#EF4444',
  success: '#10B981',
  warning: '#FFB800',

  // Shadows
  shadowOrange: 'rgba(232,99,26,0.20)',
  shadowNavy: 'rgba(26,26,46,0.12)',
  shadowDark: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(26,26,46,0.50)',
  overlayLight: 'rgba(26,26,46,0.25)',

  // Tab
  tabActive: '#E8631A',
  tabInactive: '#9896B0',
  tabBackground: '#FFFFFF',

  // Compatibility aliases for existing screens and components.
  backgroundBase: '#FFF8F0',
  backgroundDeep: '#FFF3E8',
  backgroundLayer1: '#FFFFFF',
  backgroundLayer2: '#FFF3E8',
  backgroundLayer3: '#F5F0EA',
  backgroundSecondary: '#FFFFFF',
  surfacePrimary: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceElevated1: '#FFFFFF',
  surfaceElevated2: '#FFF8F0',
  surfacePressed: '#FEF0E8',
  surfaceBorder: '#EDE8E0',
  surfaceBorderStrong: '#EDE8E0',
  surfaceBorderDim: '#F5F0EA',
  glassPrimary: '#FFFFFF',
  glassSecondary: '#FFF8F0',
  glassTertiary: '#FFF3E8',
  glassHighlight: '#FFFFFF',
  glassBorder: '#EDE8E0',
  glassBorderBright: '#EDE8E0',
  glassBorderDim: '#F5F0EA',
  primaryDeep: '#CC3300',
  primaryGlow: '#FEF0E8',
  primaryGlowStrong: 'rgba(232,99,26,0.20)',
  accentViolet: '#0099CC',
  accentGold: '#FFB800',
  accentGlow: '#FEF3C7',
  gold: '#FFB800',
  goldGlow: '#FEF3C7',
  textPrimary: '#1A1A2E',
  textTertiary: '#9896B0',
  textOnPrimary: '#FFFFFF',
  textGlow: '#E8631A',
  textInverse: '#FFFFFF',
  muted: '#9896B0',
  white: '#FFFFFF',
  errorLight: '#FEE2E2',
  errorGlow: 'rgba(239,68,68,0.12)',
  successLight: '#D1FAE5',
  warningLight: '#FEF3C7',
  info: '#0099CC',
  infoLight: '#E0F4FF',
  wishlistActive: '#EF4444',
  wishlistInactive: '#9896B0',
  tabBarActive: '#E8631A',
  tabBarInactive: '#9896B0',
  tabBarBackground: '#FFFFFF',
  shadow: 'rgba(26,26,46,0.12)',
  shadowCard: 'rgba(26,26,46,0.12)',
  shadowTeal: 'rgba(0,153,204,0.18)',
  overlayGlass: 'rgba(26,26,46,0.50)',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
