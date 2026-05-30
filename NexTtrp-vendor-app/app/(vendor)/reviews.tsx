/**
 * @file app/(vendor)/reviews.tsx
 * @description Vendor reviews screen — shows all published reviews for the
 * vendor's packages with star ratings and review body text.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useVendorReviews } from '../../hooks/useVendorReviews';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListLoader } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { VendorReview } from '../../types';

// ── Star rating display ───────────────────────────────────────────────────────

interface StarRatingProps {
  rating: number;
  size?: number;
}

function StarRating({ rating, size = 14 }: StarRatingProps): React.ReactElement {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={Colors.star}
        />
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});

// ── Sub-rating bar ────────────────────────────────────────────────────────────

interface SubRatingProps {
  label: string;
  rating: number | null;
}

function SubRating({ label, rating }: SubRatingProps): React.ReactElement | null {
  if (rating == null) return null;
  const pct = (rating / 5) * 100;
  return (
    <View style={subStyles.row}>
      <Text style={subStyles.label}>{label}</Text>
      <View style={subStyles.track}>
        <View style={[subStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={subStyles.value}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const subStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { width: 72, fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.star,
    borderRadius: 2,
  },
  value: { width: 28, fontSize: 11, fontWeight: '600', color: Colors.navy, textAlign: 'right' },
});

// ── Review card ───────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review: VendorReview;
}

function ReviewCard({ review }: ReviewCardProps): React.ReactElement {
  const date = new Date(review.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={[cardStyles.card, Shadows.sm]}>
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarInitial}>
            {(review.user.display_name[0] ?? 'T').toUpperCase()}
          </Text>
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.reviewerName}>{review.user.display_name}</Text>
          <Text style={cardStyles.packageName} numberOfLines={1}>{review.package.title}</Text>
        </View>
        <View style={cardStyles.ratingWrapper}>
          <StarRating rating={review.overall_rating} />
          <Text style={cardStyles.date}>{date}</Text>
        </View>
      </View>

      {/* Title */}
      {review.title != null && (
        <Text style={cardStyles.title}>{review.title}</Text>
      )}

      {/* Body */}
      {review.body != null && (
        <Text style={cardStyles.body}>{review.body}</Text>
      )}

      {/* Sub-ratings */}
      {(review.rating_guide ?? review.rating_hotel ?? review.rating_food ?? review.rating_transport ?? review.rating_value) != null && (
        <View style={cardStyles.subRatings}>
          <SubRating label="Guide" rating={review.rating_guide} />
          <SubRating label="Hotel" rating={review.rating_hotel} />
          <SubRating label="Food" rating={review.rating_food} />
          <SubRating label="Transport" rating={review.rating_transport} />
          <SubRating label="Value" rating={review.rating_value} />
        </View>
      )}

      {/* Verified badge */}
      {review.is_verified && (
        <View style={cardStyles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
          <Text style={cardStyles.verifiedText}>Verified Booking</Text>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerInfo: { flex: 1 },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  packageName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  ratingWrapper: {
    alignItems: 'flex-end',
    gap: 3,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  subRatings: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReviewsScreen(): React.ReactElement {
  const { data, isLoading, isFetching, refetch, isError } = useVendorReviews(1);

  const renderItem = useCallback(
    ({ item }: { item: VendorReview }) => <ReviewCard review={item} />,
    [],
  );

  const reviews = data?.items ?? [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviews.length
    : 0;

  return (
    <View style={styles.flex}>
      <Header title="Reviews" showBack />
      {isLoading ? (
        <ListLoader />
      ) : isError ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textLight} />
          <Text style={styles.errorText}>Failed to load reviews.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
          ListHeaderComponent={
            reviews.length > 0 ? (
              <View style={[styles.summaryCard, Shadows.card]}>
                <Text style={styles.summaryRating}>{avgRating.toFixed(1)}</Text>
                <StarRating rating={avgRating} size={20} />
                <Text style={styles.summaryCount}>{reviews.length} reviews</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="star-outline"
              title="No reviews yet"
              description="Reviews from travelers will appear here once they complete their trip."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryRating: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.navy,
    letterSpacing: -2,
  },
  summaryCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
});
