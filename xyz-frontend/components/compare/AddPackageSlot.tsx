/**
 * @file components/compare/AddPackageSlot.tsx
 * @description Dashed "+" slot shown in the header when fewer than 4 packages
 * are selected. Tapping navigates back to search.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';

/** Width of each package column */
export const COLUMN_WIDTH = 180;
/** Gap between columns */
export const COLUMN_GAP = 10;

export function AddPackageSlot(): React.ReactElement {
  const handlePress = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  return (
    <Pressable
      style={styles.slot}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Add another package to compare"
    >
      <View style={styles.iconCircle}>
        <Ionicons name="add" size={26} color={Colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        Add Package
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 160,
    justifyContent: 'center',
    width: COLUMN_WIDTH,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    marginBottom: 10,
    width: 52,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
