/**
 * @file components/compare/PriceRow.tsx
 * @description Price cells — best value column highlighted green.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CompareRowCells } from './CompareRow';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function fmt(value: number): string {
  return currencyFormatter.format(value);
}

function effectivePrice(pkg: PackageListItem): number | null {
  const prices = pkg.pricing.map((p) => p.discounted_price ?? p.base_price);
  const finite = prices.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.min(...finite);
}

export interface PriceCellsProps {
  packages: PackageListItem[];
}

export function PriceCells({ packages }: PriceCellsProps): React.ReactElement {
  const bestIndex = useMemo(() => {
    const prices = packages.map(effectivePrice);
    const finite = prices.filter((p): p is number => p !== null);
    if (finite.length === 0) return null;
    const min = Math.min(...finite);
    return prices.findIndex((p) => p === min);
  }, [packages]);

  const cells = packages.map((pkg) => {
    const first = pkg.pricing[0] ?? null;
    const base = first?.base_price ?? null;
    const disc = first?.discounted_price ?? null;
    const effective = effectivePrice(pkg);
    const savings = base !== null && disc !== null && disc < base ? base - disc : null;

    if (effective === null) {
      return <Text style={styles.onRequest}>Price on request</Text>;
    }

    return (
      <View>
        {disc !== null && base !== null && disc < base && (
          <Text style={styles.strikethrough}>{fmt(base)}</Text>
        )}
        <Text style={styles.price}>{fmt(effective)}</Text>
        <Text style={styles.perPerson}>per person</Text>
        {savings !== null && savings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {fmt(savings)}</Text>
          </View>
        )}
      </View>
    );
  });

  return (
    <CompareRowCells
      cells={cells}
      highlightIndex={bestIndex}
      highlightColor={Colors.successLight}
      minHeight={88}
    />
  );
}

const styles = StyleSheet.create({
  onRequest: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  strikethrough: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    textDecorationLine: 'line-through',
  },
  price: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  perPerson: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 6,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  savingsText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
});
