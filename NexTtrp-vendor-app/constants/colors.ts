/**
 * @file constants/colors.ts
 * @description NEXTTRP Vendor Portal brand palette.
 *
 * Uses the same brand system as NexTtrp-user to maintain visual consistency
 * across all applications in the NEXTTRP ecosystem.
 */

export const Colors = {
  // ── Primary Brand ──────────────────────────────────────────
  primary: '#E8631A',
  primaryDark: '#CC3300',
  primaryLight: '#FEF0E8',
  primaryUltraLight: '#FFF8F0',

  // ── Secondary ──────────────────────────────────────────────
  secondary: '#0099CC',
  secondaryDark: '#0077AA',
  secondaryLight: '#E0F4FF',

  // ── Accent ─────────────────────────────────────────────────
  accent: '#FFB800',
  accentDark: '#E0A000',
  accentLight: '#FEF3C7',

  // ── Navy ───────────────────────────────────────────────────
  navy: '#1A1A2E',
  navyMedium: '#2D2D44',
  navyLight: '#3D3D5C',

  // ── Backgrounds ────────────────────────────────────────────
  background: '#FFF8F0',
  backgroundWhite: '#FFFFFF',
  backgroundSoft: '#FFF3E8',
  surface: '#FFFFFF',

  // ── Text ───────────────────────────────────────────────────
  text: '#1A1A2E',
  textSecondary: '#5C5C7A',
  textLight: '#9896B0',
  textWhite: '#FFFFFF',
  textOrange: '#E8631A',
  textBlue: '#0099CC',

  // ── UI ─────────────────────────────────────────────────────
  border: '#EDE8E0',
  borderLight: '#F5F0EA',
  divider: '#F0EBE3',

  // ── Semantic ───────────────────────────────────────────────
  star: '#FFB800',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#FFB800',
  warningLight: '#FEF3C7',
  info: '#0099CC',
  infoLight: '#E0F4FF',

  // ── Package status ─────────────────────────────────────────
  statusDraft: '#9896B0',
  statusDraftBg: '#F5F0EA',
  statusPending: '#FFB800',
  statusPendingBg: '#FEF3C7',
  statusActive: '#10B981',
  statusActiveBg: '#D1FAE5',
  statusRejected: '#EF4444',
  statusRejectedBg: '#FEE2E2',

  // ── Booking status ─────────────────────────────────────────
  bookingPending: '#FFB800',
  bookingConfirmed: '#10B981',
  bookingCancelled: '#EF4444',
  bookingCompleted: '#0099CC',

  // ── Shadows ────────────────────────────────────────────────
  shadowOrange: 'rgba(232,99,26,0.20)',
  shadowNavy: 'rgba(26,26,46,0.12)',
  shadowDark: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(26,26,46,0.50)',
  overlayLight: 'rgba(26,26,46,0.25)',

  // ── Tab bar ────────────────────────────────────────────────
  tabActive: '#E8631A',
  tabInactive: '#9896B0',
  tabBackground: '#FFFFFF',

  // ── Compatibility aliases ──────────────────────────────────
  backgroundBase: '#FFF8F0',
  backgroundDeep: '#FFF3E8',
  backgroundLayer1: '#FFFFFF',
  backgroundLayer2: '#FFF3E8',
  backgroundLayer3: '#F5F0EA',
  muted: '#9896B0',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
