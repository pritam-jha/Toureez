/**
 * @file components/compare/BadgeRow.tsx
 * @description Badge cells for the Awards row.
 * Exports BadgeCells — rendered inside the shared horizontal scroll by the screen.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CompareRowCells } from './CompareRow';
import { Colors } from '../../constants/colors';
import type { Badge, PackageListItem } from '../../types';

interface BadgeConfig {
  emoji: string;
  label: string;
  bg: string;
  color: string;
}

const BADGE_CONFIG: Record<Badge['type'], BadgeConfig> = {
  best_value: { emoji: '🏆', label: 'Best Value', bg: Colors.warningLight, color: Colors.warning },
  highest_rated: { emoji: '⭐', label: 'Top Rated', bg: Colors.infoLight, color: Colors.info },
  most_inclusive: { emoji: '✅', label: 'Most Inclusive', bg: Colors.successLight, color: Colors.success },
};

export interface BadgeCellsProps {
  packages: PackageListItem[];
}

export function BadgeCells({ packages }: BadgeCellsProps): React.ReactElement {
  const cells = packages.map((pkg) => {
    const pkgBadges = pkg.badges.filter((b) => b.package_id === pkg.id);

    if (pkgBadges.length === 0) {
      return (
        <Text style={styles.none} numberOfLines={1}>
          —
        </Text>
      );
    }

    return (
      <View style={styles.badgeStack}>
        {pkgBadges.map((badge) => {
          const cfg = BADGE_CONFIG[badge.type];
          return (
            <View key={badge.type} style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={styles.badgeEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.badgeLabel, { color: cfg.color }]} numberOfLines={1}>
                {cfg.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  });

  return <CompareRowCells cells={cells} minHeight={72} />;
}

const styles = StyleSheet.create({
  none: {
    color: Colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  badgeStack: {
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeEmoji: {
    fontSize: 12,
    lineHeight: 16,
    marginRight: 5,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
});
