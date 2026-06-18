/**
 * @file constants/colors.ts
 * Toureez Vendor Portal — luxury dark-mode palette.
 * Background: #0B1426 · Cards: #111827 · Accent: #E8631A
 */

export const Colors = {
  // ── Primary Brand ──────────────────────────────────────────
  primary:          '#E8631A',
  primaryDark:      '#C85412',
  primaryLight:     'rgba(232,99,26,0.15)',
  primaryUltraLight:'rgba(232,99,26,0.07)',

  // ── Secondary / blue ───────────────────────────────────────
  secondary:        '#3B82F6',
  secondaryDark:    '#2563EB',
  secondaryLight:   'rgba(59,130,246,0.15)',

  // ── Accent / amber ─────────────────────────────────────────
  accent:           '#F59E0B',
  accentDark:       '#D97706',
  accentLight:      'rgba(245,158,11,0.15)',

  // ── Navy (heading / emphasis text in dark mode) ────────────
  navy:             '#E2E8F0',
  navyMedium:       '#94A3B8',
  navyLight:        '#64748B',

  // ── Backgrounds ────────────────────────────────────────────
  background:       '#0B1426',
  backgroundWhite:  '#111827',
  backgroundSoft:   '#0D1830',
  surface:          '#111827',

  // ── Text ───────────────────────────────────────────────────
  text:             '#F1F5F9',
  textSecondary:    '#94A3B8',
  textLight:        '#64748B',
  textWhite:        '#FFFFFF',
  textOrange:       '#E8631A',
  textBlue:         '#3B82F6',

  // ── Borders / dividers ─────────────────────────────────────
  border:           '#1E2D40',
  borderLight:      '#1A2535',
  divider:          '#1E2D40',

  // ── Semantic ───────────────────────────────────────────────
  star:             '#F59E0B',
  error:            '#EF4444',
  errorLight:       'rgba(239,68,68,0.15)',
  success:          '#10B981',
  successLight:     'rgba(16,185,129,0.15)',
  warning:          '#F59E0B',
  warningLight:     'rgba(245,158,11,0.15)',
  info:             '#3B82F6',
  infoLight:        'rgba(59,130,246,0.15)',

  // ── Package status ─────────────────────────────────────────
  statusDraft:      '#94A3B8',
  statusDraftBg:    'rgba(148,163,184,0.12)',
  statusPending:    '#F59E0B',
  statusPendingBg:  'rgba(245,158,11,0.12)',
  statusActive:     '#10B981',
  statusActiveBg:   'rgba(16,185,129,0.12)',
  statusRejected:   '#EF4444',
  statusRejectedBg: 'rgba(239,68,68,0.12)',

  // ── Booking status ─────────────────────────────────────────
  bookingPending:   '#F59E0B',
  bookingConfirmed: '#10B981',
  bookingCancelled: '#EF4444',
  bookingCompleted: '#3B82F6',

  // ── Shadows / overlays ─────────────────────────────────────
  shadowOrange:    'rgba(232,99,26,0.20)',
  shadowNavy:      'rgba(0,0,0,0.30)',
  shadowDark:      'rgba(0,0,0,0.20)',
  overlay:         'rgba(0,0,0,0.70)',
  overlayLight:    'rgba(0,0,0,0.40)',

  // ── Tab bar ────────────────────────────────────────────────
  tabActive:       '#E8631A',
  tabInactive:     '#64748B',
  tabBackground:   '#0D1830',

  // ── Compatibility aliases ──────────────────────────────────
  backgroundBase:   '#0B1426',
  backgroundDeep:   '#0D1830',
  backgroundLayer1: '#111827',
  backgroundLayer2: '#0D1830',
  backgroundLayer3: '#1A2535',
  muted:            '#64748B',
  white:            '#111827',
  transparent:      'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
