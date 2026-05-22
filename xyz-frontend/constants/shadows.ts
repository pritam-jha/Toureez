/**
 * @file constants/shadows.ts
 * @description Shadow presets for XYZ Premium Light 3D design system.
 * Multi-layer shadows create genuine depth on light backgrounds.
 */

import type { ViewStyle } from 'react-native';

export const Shadows: Record<string, ViewStyle> = {
  /**
   * Premium 3D card shadow — layered depth for floating cards.
   */
  glassCard: {
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  /**
   * Navy brand glow shadow — wrap CTAs and active elements.
   */
  neonGlow: {
    shadowColor: '#2D3FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 10,
  },

  /**
   * Subtle float shadow — for secondary cards and inputs.
   */
  float: {
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  /**
   * Hero image depth shadow — for full-bleed images and hero sections.
   */
  heroDepth: {
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },

  /**
   * Error/danger glow shadow.
   */
  errorGlow: {
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  /**
   * Elevated card — strong 3D lift effect.
   */
  elevated: {
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },

  /**
   * No shadow — use for flat elements.
   */
  none: {},

  // ── Legacy aliases ────────────────────────────────────────
  /** @deprecated use glassCard */
  card: {
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  /** @deprecated use neonGlow */
  cardHover: {
    shadowColor: '#2D3FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
