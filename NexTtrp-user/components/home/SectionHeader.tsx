/**
 * @file components/home/SectionHeader.tsx
 * @description Section title + optional "See all" action — Premium Light 3D.
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  actionLabel = 'See all',
  onActionPress,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onActionPress ? (
        <Pressable
          style={styles.action}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          hitSlop={8}
        >
          <Text style={styles.actionText} numberOfLines={1}>
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 12,
    minHeight: 32,
    gap: 2,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
