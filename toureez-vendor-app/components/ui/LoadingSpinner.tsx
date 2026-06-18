/**
 * @file components/ui/LoadingSpinner.tsx
 * @description Loading state components for the Vendor Portal.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface FullScreenLoaderProps {
  message?: string;
}

/**
 * Full-screen loading overlay used during initial auth resolution
 * and between heavy screen transitions.
 */
export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Loading...',
}) => (
  <View style={styles.fullScreen}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.message}>{message}</Text>
  </View>
);

/**
 * Inline loading indicator for lists and content areas.
 */
export const InlineLoader: React.FC<{ size?: 'small' | 'large'; message?: string }> = ({
  size = 'large',
  message,
}) => (
  <View style={styles.inline}>
    <ActivityIndicator size={size} color={Colors.primary} />
    {message != null && <Text style={styles.message}>{message}</Text>}
  </View>
);

/**
 * Loading placeholder for empty list states.
 */
export const ListLoader: React.FC = () => (
  <View style={styles.list}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.listMessage}>Loading...</Text>
  </View>
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  inline: {
    padding: 24,
    alignItems: 'center',
  },
  list: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  listMessage: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
