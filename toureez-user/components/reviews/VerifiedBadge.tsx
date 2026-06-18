/**
 * @file components/reviews/VerifiedBadge.tsx
 * @description Small green "✓ Verified Purchase" badge.
 * Only renders when is_verified is true.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface VerifiedBadgeProps {
  is_verified: boolean;
}

export function VerifiedBadge({ is_verified }: VerifiedBadgeProps): React.ReactElement | null {
  if (!is_verified) return null;

  return (
    <View
      style={styles.badge}
      accessibilityRole="text"
      accessibilityLabel="Verified Purchase"
    >
      <Text style={styles.text} numberOfLines={1}>
        ✓ Verified Purchase
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '50',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
});
