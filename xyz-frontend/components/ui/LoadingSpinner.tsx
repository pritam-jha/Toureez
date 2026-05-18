/**
 * @file components/ui/LoadingSpinner.tsx
 * @description Full-screen and inline loading spinner components.
 *
 * Provides two exports:
 * - `LoadingSpinner`: Inline spinner for use within content areas.
 * - `FullScreenLoader`: Full-screen overlay with optional message,
 *   used during auth checks and initial data loads.
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── LoadingSpinner ────────────────────────────────────────────────────────────

export interface LoadingSpinnerProps {
  /** Spinner size (default: 'large') */
  size?: 'small' | 'large';
  /** Spinner colour (default: Colors.primary) */
  color?: string;
  /** Override container style */
  style?: ViewStyle;
}

/**
 * Inline loading spinner. Use inside content areas, cards, or buttons.
 *
 * @example
 * {isLoading && <LoadingSpinner size="small" />}
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = Colors.primary,
  style,
}) => {
  return (
    <View
      style={[styles.spinnerContainer, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

// ── FullScreenLoader ──────────────────────────────────────────────────────────

export interface FullScreenLoaderProps {
  /** Optional message displayed below the spinner */
  message?: string;
}

/**
 * Full-screen loading overlay. Use during auth checks, initial data loads,
 * or any operation that blocks the entire screen.
 *
 * @example
 * if (isLoading) return <FullScreenLoader message="Loading packages..." />;
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message,
}) => {
  return (
    <View
      style={styles.fullScreenContainer}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
