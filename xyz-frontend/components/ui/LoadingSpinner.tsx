/**
 * @file components/ui/LoadingSpinner.tsx
 * @description Full-screen and inline loading spinner — Glassmorphism Dark theme.
 *
 * ✅ All existing props preserved — zero logic changes.
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
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

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
  message?: string;
}

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
    backgroundColor: Colors.backgroundBase,
    gap: 16,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
