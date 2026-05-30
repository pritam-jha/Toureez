/**
 * @file components/compare/AmenitiesRow.tsx
 * @description Amenities tick/cross grid cells.
 * Returns an array of row-cell arrays — one per amenity.
 * The screen renders each amenity as a separate row with its own label.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CompareRowCells } from './CompareRow';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

export interface AmenitiesData {
  amenity: string;
  cells: React.ReactElement;
  mostInclusiveIndex: number | null;
}

/**
 * Computes all amenity rows data.
 * Returns one entry per unique amenity across all packages.
 */
export function useAmenitiesData(packages: PackageListItem[]): AmenitiesData[] {
  return useMemo(() => {
    // Build union of unique amenities
    const seen = new Set<string>();
    const amenities: string[] = [];
    packages.forEach((pkg) => {
      pkg.amenities.forEach((a) => {
        const key = a.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          amenities.push(a);
        }
      });
    });

    // Most inclusive index
    const counts = packages.map((p) => p.inclusions.length + p.amenities.length);
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    const mostInclusiveIndex = counts.findIndex((c) => c === max);

    return amenities.map((amenity) => {
      const cells = packages.map((pkg) => {
        const has = pkg.amenities.some(
          (a) => a.toLowerCase().trim() === amenity.toLowerCase().trim()
        );
        return (
          <View style={styles.iconWrap}>
            <Ionicons
              name={has ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={has ? Colors.success : Colors.error}
            />
          </View>
        );
      });

      return {
        amenity,
        cells: (
          <CompareRowCells
            cells={cells}
            highlightIndex={mostInclusiveIndex >= 0 ? mostInclusiveIndex : null}
            highlightColor={Colors.successLight}
            minHeight={52}
          />
        ),
        mostInclusiveIndex: mostInclusiveIndex >= 0 ? mostInclusiveIndex : null,
      };
    });
  }, [packages]);
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
