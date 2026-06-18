/**
 * @file components/compare/RatingRow.tsx
 * @description Rating cells — highest rated column highlighted blue.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CompareRowCells } from './CompareRow';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

export interface RatingCellsProps {
  packages: PackageListItem[];
}

export function RatingCells({ packages }: RatingCellsProps): React.ReactElement {
  const bestIndex = useMemo(() => {
    const qualifying = packages
      .map((p, i) => ({ r: p.avg_rating, i }))
      .filter((e) => e.r >= 4.0);
    if (qualifying.length === 0) return null;
    const max = Math.max(...qualifying.map((e) => e.r));
    return qualifying.find((e) => e.r === max)?.i ?? null;
  }, [packages]);

  const cells = packages.map((pkg) => {
    const full = Math.floor(pkg.avg_rating);
    const hasHalf = pkg.avg_rating - full >= 0.5;

    return (
      <View>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => {
            const filled = i < full;
            const half = !filled && i === full && hasHalf;
            return (
              <Ionicons
                key={i}
                name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                size={14}
                color={Colors.star}
              />
            );
          })}
        </View>
        <Text style={styles.score}>{pkg.avg_rating.toFixed(1)}</Text>
        <Text style={styles.reviews}>
          {pkg.review_count.toLocaleString('en-IN')} reviews
        </Text>
      </View>
    );
  });

  return (
    <CompareRowCells
      cells={cells}
      highlightIndex={bestIndex}
      highlightColor={Colors.infoLight}
      minHeight={80}
    />
  );
}

const styles = StyleSheet.create({
  starsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  score: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  reviews: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 2,
  },
});
