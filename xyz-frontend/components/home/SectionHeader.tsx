/**
 * @file components/home/SectionHeader.tsx
 * @description Reusable title and optional action row for home sections.
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
  actionLabel = 'See All',
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
          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.primary}
          />
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
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 12,
    minHeight: 32,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});
