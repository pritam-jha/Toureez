/**
 * @file components/ui/EmptyState.tsx
 * @description Centered placeholder shown when a list/section has no data.
 *
 *   <EmptyState
 *     icon="📋"
 *     title="No bookings yet"
 *     subtitle="Bookings will appear here once travellers start booking."
 *     action={{ label: 'Refresh', onPress: refetch }}
 *   />
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import { Button } from './Button';
import { Body, H4 } from './Typography';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  compact?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  compact = false,
  style,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <H4 align="center" style={styles.title}>
        {title}
      </H4>
      {subtitle !== undefined && (
        <Body color={Colors.textSecondary} align="center" style={styles.subtitle}>
          {subtitle}
        </Body>
      )}
      {action !== undefined && (
        <View style={styles.actionWrap}>
          <Button variant="primary" size="md" onPress={action.onPress}>
            {action.label}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  compact: {
    flex: 0,
    paddingVertical: Spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  icon: { fontSize: 30 },
  title: { marginTop: 4 },
  subtitle: { maxWidth: 320, marginTop: 2 },
  actionWrap: { marginTop: Spacing.md },
});
