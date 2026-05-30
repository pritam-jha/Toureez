/**
 * @file components/ui/Stat.tsx
 * @description KPI / metric card used by the dashboard.
 *
 *   <Stat
 *     label="Total Users"
 *     value={metrics.total_users}
 *     sublabel="+12 this month"
 *     delta={+8.2}
 *     accent={Colors.secondary}
 *   />
 */

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Shadows, Spacing } from '../../constants/theme';
import { Skeleton } from './Skeleton';
import { Card } from './Card';

interface StatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  delta?: number;
  accent?: string;
  loading?: boolean;
  onPress?: () => void;
  format?: (v: string | number) => string;
  style?: StyleProp<ViewStyle>;
}

function defaultFormat(v: string | number): string {
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return v;
}

export function Stat({
  label,
  value,
  sublabel,
  delta,
  accent = Colors.primary,
  loading = false,
  onPress,
  format,
  style,
}: StatProps): React.ReactElement {
  const display = (format ?? defaultFormat)(value);
  const hasDelta = delta !== undefined;
  const positive = (delta ?? 0) >= 0;

  return (
    <Card
      variant="default"
      padding="md"
      onPress={onPress}
      style={[styles.card, Shadows.sm, style]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      {loading ? (
        <View style={styles.content}>
          <Skeleton width={90} height={26} />
          <Skeleton width={60} height={10} style={{ marginTop: Spacing.sm }} />
          {sublabel !== undefined && (
            <Skeleton width={80} height={10} style={{ marginTop: Spacing.xs }} />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <Text
            style={styles.value}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {display}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {(hasDelta || sublabel !== undefined) && (
            <View style={styles.footer}>
              {hasDelta && (
                <Text
                  style={[
                    styles.delta,
                    { color: positive ? Colors.success : Colors.error },
                  ]}
                >
                  {positive ? '↑' : '↓'} {Math.abs(delta ?? 0).toLocaleString('en-IN')}
                </Text>
              )}
              {sublabel !== undefined && (
                <Text style={styles.sublabel} numberOfLines={1}>
                  {sublabel}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    minHeight: 116,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
  },
  content: { gap: 4 },
  value: {
    fontSize: 25,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  delta: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  sublabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
  },
});
