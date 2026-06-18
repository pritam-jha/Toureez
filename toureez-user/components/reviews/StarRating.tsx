/**
 * @file components/reviews/StarRating.tsx
 * @description Interactive and display star rating component.
 *
 * Interactive mode: tap to set 1–5 whole-number rating.
 * Display mode: supports half-star rendering for decimal values (e.g. 4.3).
 *
 * Props:
 *   rating      — current value (0–5, decimals supported in display mode)
 *   size        — 'small' | 'medium' | 'large'
 *   interactive — enables tap-to-rate
 *   onRate      — callback fired with the new whole-number rating
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAR_SIZES: Record<'small' | 'medium' | 'large', number> = {
  small: 14,
  medium: 20,
  large: 32,
};

const STAR_GAP: Record<'small' | 'medium' | 'large', number> = {
  small: 2,
  medium: 3,
  large: 5,
};

const FILLED_COLOR = Colors.star;   // gold stars
const EMPTY_COLOR = Colors.backgroundLayer3;  // light grey

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

// ── Single star ───────────────────────────────────────────────────────────────

interface StarProps {
  /** 'full' | 'half' | 'empty' */
  fill: 'full' | 'half' | 'empty';
  size: number;
  interactive: boolean;
  value: number; // 1–5 — the rating this star represents
  onPress?: (value: number) => void;
}

function Star({ fill, size, interactive, value, onPress }: StarProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(value);
  }, [onPress, value]);

  const icon =
    fill === 'full'
      ? 'star'
      : fill === 'half'
        ? 'star-half'
        : 'star-outline';

  const color = fill === 'empty' ? EMPTY_COLOR : FILLED_COLOR;

  if (interactive) {
    return (
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Rate ${value} star${value !== 1 ? 's' : ''}`}
        accessibilityState={{ selected: fill === 'full' }}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Pressable>
    );
  }

  return (
    <Ionicons
      name={icon}
      size={size}
      color={color}
      accessibilityElementsHidden
    />
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────

/**
 * Determines the fill type for each star position (1–5) given a decimal rating.
 *
 * Rules:
 *   - position ≤ floor(rating)  → 'full'
 *   - position === ceil(rating) and fractional part ≥ 0.25 → 'half'
 *   - otherwise → 'empty'
 */
function getFill(position: number, rating: number): 'full' | 'half' | 'empty' {
  const floored = Math.floor(rating);
  const fraction = rating - floored;

  if (position <= floored) return 'full';
  if (position === floored + 1 && fraction >= 0.25) return 'half';
  return 'empty';
}

export function StarRating({
  rating,
  size = 'medium',
  interactive = false,
  onRate,
  style,
  accessibilityLabel,
}: StarRatingProps): React.ReactElement {
  const starSize = STAR_SIZES[size];
  const gap = STAR_GAP[size];

  const handlePress = useCallback(
    (value: number) => {
      if (interactive) {
        onRate?.(value);
      }
    },
    [interactive, onRate]
  );

  return (
    <View
      style={[styles.row, { gap }, style]}
      accessibilityRole={interactive ? 'adjustable' : 'none'}
      accessibilityLabel={
        accessibilityLabel ??
        (interactive
          ? `Star rating, currently ${rating} out of 5`
          : `${rating} out of 5 stars`)
      }
      accessibilityValue={
        interactive ? { min: 0, max: 5, now: Math.round(rating) } : undefined
      }
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          fill={interactive ? (position <= rating ? 'full' : 'empty') : getFill(position, rating)}
          size={starSize}
          interactive={interactive}
          value={position}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
