/**
 * @file components/search/PackageList.tsx
 * @description Infinite-scroll FlatList of search result cards.
 *
 * Handles:
 * - Skeleton loading state (3 placeholder cards on first load)
 * - Inline error state with retry
 * - Empty state with clear-filters CTA
 * - "Load more" footer spinner
 * - "No more results" end-of-list message
 * - Pull-to-refresh (resets to page 1 via refetch)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ListRenderItem } from 'react-native';

import { PackageListCard } from './PackageListCard';
import { Toast } from '../ui/Toast';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function useSkeletonOpacity(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return opacity;
}

function SkeletonCard(): React.ReactElement {
  const opacity = useSkeletonOpacity();

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLineLong} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonLineShort} />
      </View>
    </Animated.View>
  );
}

function SkeletonList(): React.ReactElement {
  return (
    <View accessibilityElementsHidden>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

interface ListFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  hasItems: boolean;
}

function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  hasItems,
}: ListFooterProps): React.ReactElement | null {
  if (!hasItems) return null;

  if (isFetchingNextPage) {
    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerText} numberOfLines={1}>
          Loading more…
        </Text>
      </View>
    );
  }

  if (!hasNextPage) {
    return (
      <View style={styles.footerContainer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerEndText} numberOfLines={1}>
          You've seen all packages
        </Text>
        <View style={styles.footerDivider} />
      </View>
    );
  }

  return null;
}

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={styles.emptyIllustration}
        accessibilityLabel="Illustration of an empty search result"
      >
        <Ionicons name="search-outline" size={36} color={Colors.muted} />
      </View>
      <Text style={styles.emptyTitle} numberOfLines={1}>
        No packages found
      </Text>
      <Text style={styles.emptySubtitle} numberOfLines={3}>
        {hasFilters
          ? 'Try removing some filters to see more results.'
          : 'Try a different destination or search term.'}
      </Text>
      {hasFilters && (
        <Pressable
          style={styles.clearFiltersButton}
          onPress={onClearFilters}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text style={styles.clearFiltersText} numberOfLines={1}>
            Clear Filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={36} color={Colors.muted} />
      <Text style={styles.errorTitle} numberOfLines={1}>
        Something went wrong
      </Text>
      <Text style={styles.errorSubtitle} numberOfLines={2}>
        Pull down to refresh or tap retry.
      </Text>
      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry search"
      >
        <Text style={styles.retryText} numberOfLines={1}>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PackageListProps {
  items: PackageListItem[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  hasFilters: boolean;
  onEndReached: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  /** Rendered above the list (ResultsHeader + ActiveFilters) */
  ListHeaderComponent: React.ReactElement;
}

// ── Main component ────────────────────────────────────────────────────────────

export function PackageList({
  items,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  hasFilters,
  onEndReached,
  onRefresh,
  isRefreshing,
  onRetry,
  onClearFilters,
  ListHeaderComponent,
}: PackageListProps): React.ReactElement {
  const [compareToastVisible, setCompareToastVisible] = React.useState(false);

  const handleCompareFull = useCallback(() => {
    setCompareToastVisible(true);
  }, []);

  const handleToastHide = useCallback(() => {
    setCompareToastVisible(false);
  }, []);

  const renderItem: ListRenderItem<PackageListItem> = useCallback(
    ({ item }) => (
      <PackageListCard item={item} onCompareFull={handleCompareFull} />
    ),
    [handleCompareFull]
  );

  const keyExtractor = useCallback(
    (item: PackageListItem) => item.id,
    []
  );

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      onEndReached();
    }
  }, [isFetchingNextPage, hasNextPage, onEndReached]);

  const renderFooter = useCallback(
    () => (
      <ListFooter
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={items.length > 0}
      />
    ),
    [isFetchingNextPage, hasNextPage, items.length]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return <SkeletonList />;
    if (isError) return <ErrorState onRetry={onRetry} />;
    return (
      <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
    );
  }, [isLoading, isError, hasFilters, onRetry, onClearFilters]);

  return (
    <>
      <FlatList
        data={isLoading ? [] : items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />

      <Toast
        visible={compareToastVisible}
        type="info"
        message="Compare tray is full. Remove a package to add another."
        onHide={handleToastHide}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  // ── Skeleton ──────────────────────────────────────────────
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  skeletonImage: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
    width: '100%',
  },
  skeletonBody: {
    padding: 14,
  },
  skeletonLineShort: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 12,
    marginBottom: 10,
    width: '40%',
  },
  skeletonLineLong: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 16,
    marginBottom: 10,
    width: '90%',
  },
  skeletonLineMedium: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 12,
    marginBottom: 10,
    width: '65%',
  },
  // ── Footer ────────────────────────────────────────────────
  footerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footerDivider: {
    backgroundColor: Colors.border,
    flex: 1,
    height: 1,
    marginHorizontal: 12,
  },
  footerEndText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  // ── Empty ─────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIllustration: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  clearFiltersButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  clearFiltersText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  // ── Error ─────────────────────────────────────────────────
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 6,
    marginTop: 14,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
});
