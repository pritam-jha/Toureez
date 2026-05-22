/**
 * @file components/reviews/RatingSummary.tsx
 * @description Overall rating breakdown card shown at the top of the reviews section.
 *
 * Shows:
 *   - Large overall rating number + stars
 *   - "Based on N reviews"
 *   - Per-category breakdown with labelled progress bars
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';
import { Colors } from '../../constants/colors';
import type { RatingSummary as RatingSummaryType } from '../../types';

// ── Category bar ──────────────────────────────────────────────────────────────

interface CategoryBarProps {
  label: string;
  value: number;
}

function CategoryBar({ label, value }: CategoryBarProps): React.ReactElement {
  // value is 0–5; convert to 0–100% for the bar
  const percent = Math.min(100, Math.max(0, (value / 5) * 100));

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={barStyles.track}>
        <View
          style={[barStyles.fill, { width: `${percent}%` }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 5, now: value }}
          accessibilityLabel={`${label}: ${value.toFixed(1)} out of 5`}
        />
      </View>
      <Text style={barStyles.value} numberOfLines={1}>
        {value > 0 ? value.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    width: 72,
  },
  track: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 4,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    height: '100%',
  },
  value: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'right',
    width: 28,
  },
});

// ── RatingSummary ─────────────────────────────────────────────────────────────

export interface RatingSummaryProps {
  summary: RatingSummaryType;
}

export function RatingSummary({ summary }: RatingSummaryProps): React.ReactElement {
  const categories: Array<{ label: string; value: number }> = [
    { label: 'Guide', value: summary.guide },
    { label: 'Hotel', value: summary.hotel },
    { label: 'Food', value: summary.food },
    { label: 'Transport', value: summary.transport },
    { label: 'Value', value: summary.value },
  ];

  return (
    <View style={styles.card}>
      {/* Overall score */}
      <View style={styles.overallRow}>
        <View style={styles.scoreWrap}>
          <Text style={styles.scoreNumber} numberOfLines={1}>
            {summary.overall > 0 ? summary.overall.toFixed(1) : '—'}
          </Text>
          <Text style={styles.scoreMax} numberOfLines={1}>
            /5
          </Text>
        </View>
        <View style={styles.scoreRight}>
          <StarRating
            rating={summary.overall}
            size="medium"
            interactive={false}
            accessibilityLabel={`Overall rating: ${summary.overall.toFixed(1)} out of 5`}
          />
          <Text style={styles.reviewCount} numberOfLines={1}>
            Based on {summary.review_count.toLocaleString('en-IN')}{' '}
            {summary.review_count === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </View>

      {/* Category breakdown */}
      {summary.review_count > 0 ? (
        <View style={styles.categories}>
          {categories.map((cat) => (
            <CategoryBar key={cat.label} label={cat.label} value={cat.value} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  overallRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  scoreWrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  scoreNumber: {
    color: Colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 50,
    letterSpacing: -1,
  },
  scoreMax: {
    color: Colors.textTertiary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 4,
  },
  scoreRight: {
    flex: 1,
    gap: 6,
  },
  reviewCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  categories: {
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
