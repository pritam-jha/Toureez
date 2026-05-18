/**
 * @file constants/colors.ts
 * @description Design-system colour palette for XYZ.
 * All colours are defined here. Components must import from this file —
 * never hardcode hex values inline.
 */

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────
  /** Primary brand colour — deep saffron, evokes Indian travel */
  primary: '#E8621A',
  /** Lighter tint of primary for hover/pressed states */
  primaryLight: '#F28C5E',
  /** Darker shade of primary for active/focus states */
  primaryDark: '#B84A0E',

  // ── Secondary ──────────────────────────────────────────────
  /** Secondary accent — teal, used for CTAs and highlights */
  secondary: '#0D9488',
  secondaryLight: '#5EEAD4',
  secondaryDark: '#0F766E',

  // ── Neutrals ───────────────────────────────────────────────
  /** Pure white */
  white: '#FFFFFF',
  /** Off-white background */
  background: '#F8F7F4',
  /** Light grey for cards and surfaces */
  surface: '#FFFFFF',
  /** Subtle divider / border colour */
  border: '#E5E7EB',
  /** Placeholder text and disabled icons */
  muted: '#9CA3AF',

  // ── Text ───────────────────────────────────────────────────
  /** Primary text — near-black */
  textPrimary: '#111827',
  /** Secondary text — medium grey */
  textSecondary: '#6B7280',
  /** Tertiary / caption text */
  textTertiary: '#9CA3AF',
  /** Text on dark/coloured backgrounds */
  textInverse: '#FFFFFF',

  // ── Semantic ───────────────────────────────────────────────
  /** Success green */
  success: '#16A34A',
  successLight: '#DCFCE7',
  /** Warning amber */
  warning: '#D97706',
  warningLight: '#FEF3C7',
  /** Error red */
  error: '#DC2626',
  errorLight: '#FEE2E2',
  /** Info blue */
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // ── Rating ─────────────────────────────────────────────────
  /** Star rating colour */
  star: '#F59E0B',

  // ── Overlay ────────────────────────────────────────────────
  /** Semi-transparent dark overlay for modals / image overlays */
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  transparent: 'transparent',

  // ── Tab Bar ────────────────────────────────────────────────
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#E8621A',
  tabBarInactive: '#9CA3AF',
} as const;

/** Type representing any valid colour key in the palette */
export type ColorKey = keyof typeof Colors;
