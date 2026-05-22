/**
 * @file constants/colors.ts
 * @description Premium Light 3D design system colour palette for XYZ.
 * Light backgrounds, deep navy brand, warm gold accents, real 3D depth.
 * All colours are defined here — never hardcode hex values inline.
 */

export const Colors = {
  // ── BACKGROUNDS — Light depth layers ────────────────────────
  backgroundDeep: '#F0F2F8',
  backgroundBase: '#F5F7FC',
  backgroundLayer1: '#FFFFFF',
  backgroundLayer2: '#EEF1F8',
  backgroundLayer3: '#E6EAF4',

  // ── Legacy aliases ───────────────────────────────────────────
  /** @deprecated use backgroundBase */
  background: '#F5F7FC',
  /** @deprecated use backgroundLayer1 */
  backgroundSecondary: '#FFFFFF',
  /** @deprecated use surfacePrimary */
  surface: '#FFFFFF',
  /** @deprecated use surfaceElevated */
  surfaceElevated: '#FFFFFF',

  // ── SURFACES ─────────────────────────────────────────────────
  surfacePrimary: '#FFFFFF',
  surfaceElevated1: '#FFFFFF',
  surfaceElevated2: '#FAFBFF',
  surfacePressed: '#F0F2F8',
  surfaceBorder: 'rgba(30,40,100,0.08)',
  surfaceBorderStrong: 'rgba(30,40,100,0.16)',
  surfaceBorderDim: 'rgba(30,40,100,0.04)',

  // ── Legacy glass aliases (mapped to light equivalents) ───────
  glassPrimary: '#FFFFFF',
  glassSecondary: '#FAFBFF',
  glassTertiary: '#F0F2F8',
  glassHighlight: 'rgba(255,255,255,0.90)',
  glassBorder: 'rgba(30,40,100,0.08)',
  glassBorderBright: 'rgba(30,40,100,0.20)',
  glassBorderDim: 'rgba(30,40,100,0.04)',

  // ── BRAND — Deep Navy Indigo ─────────────────────────────────
  primary: '#2D3FE0',
  primaryDark: '#1E2DB8',
  primaryDeep: '#141F8A',
  primaryGlow: 'rgba(45,63,224,0.10)',
  primaryGlowStrong: 'rgba(45,63,224,0.20)',

  // ── Legacy aliases ───────────────────────────────────────────
  /** @deprecated use primaryGlow */
  primaryLight: 'rgba(45,63,224,0.08)',
  /** @deprecated use backgroundLayer2 */
  primaryUltraLight: '#EEF1F8',
  /** @deprecated use primaryDark */
  accent: '#1E2DB8',

  // ── ACCENT — Warm Gold ───────────────────────────────────────
  accentViolet: '#7B61FF',
  accentGold: '#F59E0B',
  accentGlow: 'rgba(245,158,11,0.15)',

  // ── GOLD — Premium highlights ────────────────────────────────
  gold: '#F59E0B',
  goldGlow: 'rgba(245,158,11,0.15)',

  // ── TEXT ─────────────────────────────────────────────────────
  textPrimary: '#0F1535',
  textSecondary: '#4A5280',
  textTertiary: '#8B93B8',
  textOnPrimary: '#FFFFFF',
  textGlow: '#2D3FE0',

  // ── Legacy aliases ───────────────────────────────────────────
  /** @deprecated use textPrimary */
  text: '#0F1535',
  /** @deprecated use textOnPrimary */
  textInverse: '#FFFFFF',
  /** @deprecated use textTertiary */
  muted: '#8B93B8',
  white: '#FFFFFF',

  // ── SEMANTIC ─────────────────────────────────────────────────
  star: '#F59E0B',
  error: '#E53E3E',
  errorGlow: 'rgba(229,62,62,0.12)',
  errorLight: 'rgba(229,62,62,0.08)',
  success: '#38A169',
  successLight: 'rgba(56,161,105,0.10)',
  warning: '#DD6B20',
  warningLight: 'rgba(221,107,32,0.10)',
  info: '#2D3FE0',
  infoLight: 'rgba(45,63,224,0.08)',

  // ── WISHLIST ─────────────────────────────────────────────────
  wishlistActive: '#E53E3E',
  wishlistInactive: 'rgba(15,21,53,0.30)',

  // ── TAB BAR ──────────────────────────────────────────────────
  tabActive: '#2D3FE0',
  tabInactive: '#8B93B8',
  tabBackground: '#FFFFFF',

  // ── Legacy aliases ───────────────────────────────────────────
  /** @deprecated use tabActive */
  tabBarActive: '#2D3FE0',
  /** @deprecated use tabInactive */
  tabBarInactive: '#8B93B8',
  /** @deprecated use tabBackground */
  tabBarBackground: '#FFFFFF',

  // ── BORDERS ──────────────────────────────────────────────────
  /** @deprecated use surfaceBorder */
  border: 'rgba(30,40,100,0.08)',
  /** @deprecated use surfaceBorderDim */
  borderLight: 'rgba(30,40,100,0.04)',

  // ── OVERLAYS ─────────────────────────────────────────────────
  overlay: 'rgba(15,21,53,0.50)',
  overlayLight: 'rgba(15,21,53,0.20)',
  overlayGlass: 'rgba(15,21,53,0.60)',
  transparent: 'transparent',

  // ── SHADOWS ──────────────────────────────────────────────────
  shadowNavy: 'rgba(45,63,224,0.20)',
  shadowDark: 'rgba(15,21,53,0.15)',
  shadowCard: 'rgba(15,21,53,0.10)',

  // ── Legacy aliases ───────────────────────────────────────────
  /** @deprecated use shadowCard */
  shadow: 'rgba(15,21,53,0.10)',
  shadowTeal: 'rgba(45,63,224,0.20)',

  // ── Legacy secondary ─────────────────────────────────────────
  /** @deprecated use primary */
  secondary: '#2D3FE0',
  /** @deprecated use primaryGlow */
  secondaryLight: 'rgba(45,63,224,0.08)',
  /** @deprecated use primaryDark */
  secondaryDark: '#1E2DB8',
} as const;

/** Type representing any valid colour key in the palette */
export type ColorKey = keyof typeof Colors;
