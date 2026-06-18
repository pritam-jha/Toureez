/**
 * @file components/reviews/ReviewCard.tsx
 * @description Displays a single review with user info, ratings, and body text.
 *
 * Features:
 *   - User avatar (initials fallback)
 *   - Overall star rating
 *   - VerifiedBadge
 *   - Formatted date ("March 2025")
 *   - Bold title
 *   - Body text (3 lines, expandable via "Read more")
 *   - Collapsible sub-category ratings
 */

import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StarRating } from './StarRating';
import { VerifiedBadge } from './VerifiedBadge';
import { Colors } from '../../constants/colors';
import { formatReviewDate } from '../../hooks/useReviews';
import type { Review } from '../../types';

// ── Avatar ────────────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }): React.ReactElement {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Deterministic background colour from name
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 13) % 360;
  const backgroundColor = `hsl(${hue}, 55%, 45%)`;

  return (
    <View
      style={[styles.avatar, { backgroundColor }]}
      accessibilityRole="image"
      accessibilityLabel={`${name}'s avatar`}
    >
      <Text style={styles.avatarText} numberOfLines={1}>
        {initials || '?'}
      </Text>
    </View>
  );
}

// ── Sub-ratings row ───────────────────────────────────────────────────────────

interface SubRatingsProps {
  review: Review;
}

const SUB_RATING_LABELS: {
  key: keyof Pick<
    Review,
    'rating_guide' | 'rating_hotel' | 'rating_food' | 'rating_transport' | 'rating_value'
  >;
  label: string;
}[] = [
  { key: 'rating_guide', label: 'Guide' },
  { key: 'rating_hotel', label: 'Hotel' },
  { key: 'rating_food', label: 'Food' },
  { key: 'rating_transport', label: 'Transport' },
  { key: 'rating_value', label: 'Value' },
];

function SubRatings({ review }: SubRatingsProps): React.ReactElement | null {
  const provided = SUB_RATING_LABELS.filter(
    ({ key }) => review[key] !== null && review[key] !== undefined
  );

  if (provided.length === 0) return null;

  return (
    <View style={styles.subRatings}>
      {provided.map(({ key, label }) => (
        <View key={key} style={styles.subRatingRow}>
          <Text style={styles.subRatingLabel} numberOfLines={1}>
            {label}
          </Text>
          <StarRating
            rating={review[key] as number}
            size="small"
            interactive={false}
          />
          <Text style={styles.subRatingValue} numberOfLines={1}>
            {(review[key] as number).toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

export interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps): React.ReactElement {
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [ratingsExpanded, setRatingsExpanded] = useState(false);

  const toggleBody = useCallback(() => setBodyExpanded((v) => !v), []);
  const toggleRatings = useCallback(() => setRatingsExpanded((v) => !v), []);

  const hasSubRatings = SUB_RATING_LABELS.some(
    ({ key }) => review[key] !== null && review[key] !== undefined
  );

  const bodyIsLong = (review.body?.length ?? 0) > 160;

  return (
    <View style={styles.card}>
      {/* Header row: avatar + name + date */}
      <View style={styles.header}>
        <UserAvatar name={review.user.display_name} />
        <View style={styles.headerText}>
          <Text style={styles.userName} numberOfLines={1}>
            {review.user.display_name}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {formatReviewDate(review.created_at)}
          </Text>
        </View>
      </View>

      {/* Overall rating + verified badge */}
      <View style={styles.ratingRow}>
        <StarRating
          rating={review.overall_rating}
          size="small"
          interactive={false}
        />
        <Text style={styles.overallValue} numberOfLines={1}>
          {review.overall_rating.toFixed(1)}
        </Text>
        <VerifiedBadge is_verified={review.is_verified} />
      </View>

      {/* Title */}
      {review.title ? (
        <Text style={styles.title} numberOfLines={2}>
          {review.title}
        </Text>
      ) : null}

      {/* Body */}
      {review.body ? (
        <>
          <Text
            style={styles.body}
            numberOfLines={bodyExpanded ? undefined : 3}
          >
            {review.body}
          </Text>
          {bodyIsLong ? (
            <Pressable
              onPress={toggleBody}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={bodyExpanded ? 'Show less' : 'Read more'}
            >
              <Text style={styles.readMore}>
                {bodyExpanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {/* Photos */}
      {review.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoRow}
          contentContainerStyle={styles.photoRowContent}
        >
          {review.images.map((img) => (
            <Image key={img.public_id} source={{ uri: img.url }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}

      {/* Sub-ratings toggle */}
      {hasSubRatings ? (
        <>
          <Pressable
            onPress={toggleRatings}
            style={styles.ratingsToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              ratingsExpanded ? 'Hide category ratings' : 'Show category ratings'
            }
          >
            <Text style={styles.ratingsToggleText}>
              {ratingsExpanded ? 'Hide ratings ▲' : 'Category ratings ▼'}
            </Text>
          </Pressable>
          {ratingsExpanded ? <SubRatings review={review} /> : null}
        </>
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
    marginBottom: 12,
    padding: 16,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  date: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 1,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  overallValue: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 4,
  },
  readMore: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  photoRow: {
    marginTop: 8,
  },
  photoRowContent: {
    gap: 8,
  },
  photo: {
    borderRadius: 10,
    height: 72,
    width: 72,
  },
  ratingsToggle: {
    marginTop: 8,
  },
  ratingsToggleText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  subRatings: {
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 8,
    paddingTop: 10,
  },
  subRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  subRatingLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    width: 72,
  },
  subRatingValue: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginLeft: 2,
  },
});
