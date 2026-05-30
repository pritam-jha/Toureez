/**
 * @file components/dashboard/MetricTile.tsx
 * @description Reusable KPI tile for admin and vendor dashboards.
 *
 * Displays a metric value, label, optional delta (MoM change), and
 * an accent colour. Renders a skeleton placeholder while loading.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface MetricTileProps {
  label: string;
  value: number | string;
  /** Optional sub-label or period description */
  sublabel?: string;
  /** Positive = green, negative = red, undefined = no delta */
  delta?: number;
  /** Colour accent on the left border */
  accent?: string;
  /** Show skeleton loading state */
  loading?: boolean;
  /** Format function for the value */
  format?: (v: number | string) => string;
}

function SkeletonBox({ width, height = 14 }: { width: number | string; height?: number }) {
  return (
    <View
      style={[
        styles.skeleton,
        { width: width as number, height },
      ]}
    />
  );
}

export function MetricTile({
  label,
  value,
  sublabel,
  delta,
  accent = Colors.primary,
  loading = false,
  format,
}: MetricTileProps): React.ReactElement {
  const displayValue = format
    ? format(value)
    : typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  const hasDelta = delta !== undefined;
  const deltaPositive = delta !== undefined && delta >= 0;

  return (
    <View style={[styles.tile, { borderLeftColor: accent }]}>
      {loading ? (
        <>
          <SkeletonBox width={60} height={28} />
          <SkeletonBox width={80} />
          {sublabel !== undefined && <SkeletonBox width={50} />}
        </>
      ) : (
        <>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {displayValue}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {(sublabel !== undefined || hasDelta) && (
            <View style={styles.footer}>
              {hasDelta && (
                <Text
                  style={[
                    styles.delta,
                    { color: deltaPositive ? Colors.success : Colors.error },
                  ]}
                >
                  {deltaPositive ? '▲' : '▼'} {Math.abs(delta!).toLocaleString('en-IN')}
                </Text>
              )}
              {sublabel !== undefined && (
                <Text style={styles.sublabel}>{sublabel}</Text>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 12,
    marginBottom: 12,
    shadowColor: Colors.shadowNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  delta: {
    fontSize: 11,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textLight,
  },
  skeleton: {
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginBottom: 6,
  },
});
