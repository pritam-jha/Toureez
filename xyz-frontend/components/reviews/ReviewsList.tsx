/**
 * @file components/reviews/ReviewsList.tsx
 * @description Reviews section for the package detail screen.
 *
 * Shows:
 *   - RatingSummary card (computed from loaded reviews)
 *   - First 3 ReviewCards inline
 *   - "Show all N reviews" button → Modal bottom sheet with full paginated list
 *   - "Write a Review" CTA (only when user is eligible)
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ReviewCard } from './ReviewCard';
import { RatingSummary } from './RatingSummary';
import { Colors } from '../../constants/colors';
import {
  usePackageReviews,
  useReviewEligibility,
} from '../../hooks/useReviews';
import type { RatingSummary as RatingSummaryType, Review } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Computes the RatingSummary from a flat list of reviews.
 * Averages only the non-null values for each sub-category.
 */
function computeSummary(reviews: Review[]): RatingSummaryType {
  if (reviews.length === 0) {
    return { overall: 0, review_count: 0, guide: 0, hotel: 0, food: 0, transport: 0, value: 0 };
  }

  const avg = (key: keyof Pick<Review, 'rating_guide' | 'rating_hotel' | 'rating_food' | 'rating_transport' | 'rating_value'>): number => {
    const values = reviews
      .map((r) => r[key])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  };

  const overallValues = reviews.map((r) => r.overall_rating).filter((v) => v > 0);
  const overall =
    overallValues.length > 0
      ? Math.round((overallValues.reduce((a, b) => a + b, 0) / overallValues.length) * 10) / 10
      : 0;

  return {
    overall,
    review_count: reviews.length,
    guide: avg('rating_guide'),
    hotel: avg('rating_hotel'),
    food: avg('rating_food'),
    transport: avg('rating_transport'),
    value: avg('rating_value'),
  };
}

// ── All Reviews Bottom Sheet ──────────────────────────────────────────────────

interface AllReviewsSheetProps {
  packageId: string;
  visible: boolean;
  onClose: () => void;
}

function AllReviewsSheet({
  packageId,
  visible,
  onClose,
}: AllReviewsSheetProps): React.ReactElement {
  const {
    reviews,
    totalCount,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isLoading,
  } = usePackageReviews(packageId);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderItem: ListRenderItem<Review> = useCallback(
    ({ item }) => <ReviewCard review={item} />,
    []
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={sheetStyles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={sheetStyles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.title} numberOfLines={1}>
            All Reviews ({totalCount.toLocaleString('en-IN')})
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close reviews"
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={sheetStyles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={sheetStyles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            initialNumToRender={8}
            windowSize={7}
            removeClippedSubviews
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});

// ── ReviewsList ───────────────────────────────────────────────────────────────

export interface ReviewsListProps {
  packageId: string;
}

export function ReviewsList({ packageId }: ReviewsListProps): React.ReactElement {
  const [sheetVisible, setSheetVisible] = useState(false);

  const { reviews, totalCount, isLoading, isError } = usePackageReviews(packageId);
  const { data: eligibility } = useReviewEligibility(packageId);

  const summary = useMemo(() => computeSummary(reviews), [reviews]);
  const previewReviews = useMemo(() => reviews.slice(0, 3), [reviews]);

  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);

  const handleWriteReview = useCallback(() => {
    if (eligibility?.booking_id) {
      router.push(`/review/${eligibility.booking_id}` as never);
    }
  }, [eligibility]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        <View style={styles.skeletonSummary} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        <Text style={styles.errorText}>
          Reviews could not be loaded. Pull to refresh.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reviews & Ratings</Text>

      {/* Rating summary card */}
      {totalCount > 0 ? (
        <RatingSummary summary={summary} />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share your experience
          </Text>
        </View>
      )}

      {/* Preview reviews */}
      {previewReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {/* Show all button */}
      {totalCount > 3 ? (
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={openSheet}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Show all ${totalCount} reviews`}
        >
          <Text style={styles.showAllText}>
            Show all {totalCount.toLocaleString('en-IN')} reviews
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      ) : null}

      {/* Write a Review CTA */}
      {eligibility?.can_review ? (
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={handleWriteReview}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Write a review for this package"
        >
          <Ionicons name="create-outline" size={18} color={Colors.white} />
          <Text style={styles.writeReviewText}>Share Your Experience</Text>
        </TouchableOpacity>
      ) : null}

      {/* All reviews bottom sheet */}
      <AllReviewsSheet
        packageId={packageId}
        visible={sheetVisible}
        onClose={closeSheet}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    paddingVertical: 28,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 10,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  showAllButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: Colors.primaryGlow,
  },
  showAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  writeReviewButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  writeReviewText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  skeletonSummary: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 16,
    height: 140,
    marginBottom: 16,
    opacity: 0.7,
  },
  skeletonCard: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 16,
    height: 100,
    marginBottom: 12,
    opacity: 0.5,
  },
});
