/**
 * @file components/compare/HighlightsRow.tsx
 * @description Highlights cells — first 3 bullet points per package.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CompareRowCells } from './CompareRow';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

export interface HighlightsCellsProps {
  packages: PackageListItem[];
}

export function HighlightsCells({ packages }: HighlightsCellsProps): React.ReactElement {
  const cells = packages.map((pkg) => {
    const visible = pkg.highlights.slice(0, 3);
    const extra = pkg.highlights.length - 3;

    if (visible.length === 0) {
      return <Text style={styles.none}>—</Text>;
    }

    return (
      <View style={styles.list}>
        {visible.map((h, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText} numberOfLines={2}>
              {h}
            </Text>
          </View>
        ))}
        {extra > 0 && (
          <Text style={styles.more}>+{extra} more</Text>
        )}
      </View>
    );
  });

  return <CompareRowCells cells={cells} minHeight={96} />;
}

const styles = StyleSheet.create({
  none: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    gap: 5,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  bullet: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    height: 6,
    marginRight: 7,
    marginTop: 6,
    width: 6,
  },
  bulletText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  more: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 2,
  },
});
