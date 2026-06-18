/**
 * @file constants/colors.ts
 * Toureez Admin — luxury dark-mode palette.
 * Background: #0B1426 · Cards: #111827 · Accent: #E8631A
 */
export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:          '#E8631A',
  primaryDark:      '#C85412',
  primaryLight:     'rgba(232,99,26,0.15)',
  primaryUltraLight:'rgba(232,99,26,0.07)',

  // ── Blue / secondary ───────────────────────────────────────────────────────
  secondary:        '#3B82F6',
  secondaryDark:    '#2563EB',
  secondaryLight:   'rgba(59,130,246,0.15)',

  // ── Amber / accent ─────────────────────────────────────────────────────────
  accent:           '#F59E0B',
  accentLight:      'rgba(245,158,11,0.15)',

  // ── Purple ─────────────────────────────────────────────────────────────────
  purple:           '#8B5CF6',
  purpleLight:      'rgba(139,92,246,0.15)',

  // ── Navy (used as emphasis text on dark surfaces) ──────────────────────────
  navy:             '#E2E8F0',
  navyLight:        '#94A3B8',

  // ── Backgrounds ────────────────────────────────────────────────────────────
  background:       '#0B1426',
  backgroundSoft:   '#0D1830',
  backgroundWhite:  '#111827',

  // ── Surfaces / cards ───────────────────────────────────────────────────────
  surface:          '#111827',
  surfaceRaised:    '#1A2535',

  // ── Text ───────────────────────────────────────────────────────────────────
  text:             '#F1F5F9',
  textSecondary:    '#94A3B8',
  textLight:        '#64748B',
  textWhite:        '#FFFFFF',

  // ── Borders / dividers ─────────────────────────────────────────────────────
  border:           '#1E2D40',
  borderLight:      '#1A2535',
  divider:          '#1E2D40',

  // ── Semantic ───────────────────────────────────────────────────────────────
  star:             '#F59E0B',
  error:            '#EF4444',
  errorLight:       'rgba(239,68,68,0.15)',
  success:          '#10B981',
  successLight:     'rgba(16,185,129,0.15)',
  warning:          '#F59E0B',
  warningLight:     'rgba(245,158,11,0.15)',
  info:             '#3B82F6',
  infoLight:        'rgba(59,130,246,0.15)',

  // ── Overlays ───────────────────────────────────────────────────────────────
  overlay:          'rgba(0,0,0,0.70)',
  overlayLight:     'rgba(0,0,0,0.30)',
} as const;
