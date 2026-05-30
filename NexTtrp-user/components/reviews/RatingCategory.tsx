/**
 * @file components/reviews/RatingCategory.tsx
 * @description A single rating category row used on the Write Review screen.
 *
 * Shows:
 *   - Category label (bold)
 *   - Subtitle (descriptive hint)
 *   - Interactive StarRating (1–5)
 *   - "Optional" pill when no rating is set
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';
import { Colors } from '../../constants/colors';

export interface RatingCategoryProps {
  label: string;
  subtitle: string;
  rating: number;
  onRate: (rating: number) => void;
  /** When true, shows an "Optional" pill. Defaults to true when rating === 0. */
  optional?: boolean;
}

export function RatingCategory({
  label,
  subtitle,
  rating,
  onRate,
  optional,
}: RatingCategoryProps): React.ReactElement {
  const showOptional = optional ?? rating === 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            {showOptional ? (
              <View style={styles.optionalPill}>
                <Text style={styles.optionalText} numberOfLines={1}>
                  Optional
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <StarRating
          rating={rating}
          size="medium"
          interactive
          onRate={onRate}
          accessibilityLabel={`${label} rating, currently ${rating} out of 5`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelWrap: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 3,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  optionalPill: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  optionalText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
});
