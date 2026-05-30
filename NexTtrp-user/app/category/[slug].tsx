/**
 * @file app/category/[slug].tsx
 * @description Dedicated category package listing screen.
 *
 * Opened when the user taps a category chip (Pilgrimage, Adventure, etc.)
 * on the home screen. Shows ONLY packages for that category — no search bar,
 * no recent searches. Just a clean header, sort/filter controls, and the
 * package list.
 *
 * Route:  /category/:slug
 * Params: slug — lowercase category name, e.g. "pilgrimage", "adventure"
 */

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FilterBottomSheet } from '../../components/search/FilterBottomSheet';
import { ActiveFilters, buildActiveFilterChips } from '../../components/search/ActiveFilters';
import { PackageList } from '../../components/search/PackageList';
import { ResultsHeader } from '../../components/search/ResultsHeader';
import { SortModal } from '../../components/search/SortModal';
import {
  countActiveFilters,
  flattenSearchPages,
  getSearchTotal,
  useInfiniteSearch,
} from '../../hooks/useSearch';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { useSlideUp } from '../../utils/animations';
import type { SearchScreenFilters, SortOption } from '../../hooks/useSearch';
import type { ActiveFilterChip } from '../../components/search/ActiveFilters';

// ── Category metadata ─────────────────────────────────────────────────────────

interface CategoryMeta {
  display: string;
  icon: string;
  subtitle: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  pilgrimage: {
    display: 'Pilgrimage',
    icon: '🛕',
    subtitle: 'Sacred journeys & spiritual destinations',
  },
  adventure: {
    display: 'Adventure',
    icon: '🏔️',
    subtitle: 'Thrills, treks & outdoor escapes',
  },
  leisure: {
    display: 'Leisure',
    icon: '🌴',
    subtitle: 'Relaxing getaways & beach holidays',
  },
  honeymoon: {
    display: 'Honeymoon',
    icon: '💑',
    subtitle: 'Romantic escapes for couples',
  },
  family: {
    display: 'Family',
    icon: '👨‍👩‍👧',
    subtitle: 'Fun-filled trips for the whole family',
  },
  wildlife: {
    display: 'Wildlife',
    icon: '🦁',
    subtitle: 'Safari & nature experiences',
  },
};

function getCategoryMeta(slug: string): CategoryMeta {
  const key = slug.toLowerCase();
  return (
    CATEGORY_META[key] ?? {
      display: key.charAt(0).toUpperCase() + key.slice(1),
      icon: '🧳',
      subtitle: `Browse ${key} packages`,
    }
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CategoryScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const safeSlug = (slug ?? '').toLowerCase();
  const meta = getCategoryMeta(safeSlug);
  const slideUp = useSlideUp();

  // Extra filters the user may apply on top of the locked category
  const [extraFilters, setExtraFilters] = useState<SearchScreenFilters>({});
  const [sort, setSort] = useState<SortOption>('best_match');
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Category is always locked to the slug — never overridden by filter state
  const activeFilters = useMemo<SearchScreenFilters>(
    () => ({ ...extraFilters, category: safeSlug, sort }),
    [extraFilters, safeSlug, sort]
  );

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSearch(activeFilters);

  const items = useMemo(() => flattenSearchPages(data), [data]);
  const total = useMemo(() => getSearchTotal(data), [data]);

  // Build chips from filters EXCLUDING category — the page title already shows it
  const filtersWithoutCategory = useMemo<SearchScreenFilters>(() => {
    const { category: _omit, ...rest } = activeFilters;
    return rest;
  }, [activeFilters]);

  const activeChips = useMemo(
    () => buildActiveFilterChips(filtersWithoutCategory),
    [filtersWithoutCategory]
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(filtersWithoutCategory),
    [filtersWithoutCategory]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleFilterApply = useCallback(
    (newFilters: SearchScreenFilters) => {
      const { sort: newSort, category: newCategory, ...rest } = newFilters;
      if (newSort) setSort(newSort);

      // If user picked a different category inside the filter sheet, navigate
      // to that category's own screen instead of overriding this one.
      if (newCategory && newCategory.toLowerCase() !== safeSlug) {
        router.push(`/category/${newCategory.toLowerCase()}`);
        return;
      }

      setExtraFilters(rest);
    },
    [safeSlug]
  );

  const handleRemoveFilter = useCallback((key: ActiveFilterChip['key']) => {
    if (key === 'price_range') {
      setExtraFilters((prev) => {
        const next = { ...prev };
        delete next.min_price;
        delete next.max_price;
        return next;
      });
      return;
    }
    setExtraFilters((prev) => {
      const next = { ...prev };
      delete next[key as keyof SearchScreenFilters];
      return next;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setExtraFilters({});
    setSort('best_match');
  }, []);

  const handleSortSelect = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setSortModalOpen(false);
  }, []);

  // ── List header (results count + sort + active filter chips) ─────────────────

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <ResultsHeader
          total={total}
          isLoading={isLoading}
          selectedSort={sort}
          onSortPress={() => setSortModalOpen(true)}
        />
        <ActiveFilters
          chips={activeChips}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
      </View>
    ),
    [
      activeChips,
      handleClearAllFilters,
      handleRemoveFilter,
      isLoading,
      sort,
      total,
    ]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.animatedRoot, slideUp.animatedStyle]}>
        {/* ── Category header ─────────────────────────────────────────────── */}
        <View style={[styles.header, Shadows.soft]}>
          {/* Back button */}
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.navy} />
          </Pressable>

          {/* Title + subtitle */}
          <View style={styles.titleArea}>
            <Text style={styles.headerEmoji} accessibilityElementsHidden>
              {meta.icon}
            </Text>
            <View style={styles.titleText}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {meta.display}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {meta.subtitle}
              </Text>
            </View>
          </View>

          {/* Filter button with badge */}
          <Pressable
            style={[
              styles.filterButton,
              activeFilterCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => setFilterSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              activeFilterCount > 0
                ? `Filters, ${activeFilterCount} active`
                : 'Open filters'
            }
            hitSlop={8}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? Colors.primary : Colors.navy}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Package list ─────────────────────────────────────────────────── */}
        <PackageList
          items={items}
          isLoading={isLoading && !isRefreshing}
          isError={isError}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          hasFilters={activeFilterCount > 0}
          onEndReached={() => void fetchNextPage()}
          onRefresh={() => void handleRefresh()}
          isRefreshing={isRefreshing}
          onRetry={() => void refetch()}
          onClearFilters={handleClearAllFilters}
          ListHeaderComponent={listHeader}
        />
      </Animated.View>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <FilterBottomSheet
        visible={isFilterSheetOpen}
        filters={activeFilters}
        onApply={handleFilterApply}
        onClose={() => setFilterSheetOpen(false)}
      />

      <SortModal
        visible={isSortModalOpen}
        selectedSort={sort}
        onSelect={handleSortSelect}
        onClose={() => setSortModalOpen(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  animatedRoot: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomColor: Colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    marginRight: 10,
    width: 38,
  },
  titleArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  headerEmoji: {
    fontSize: 26,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: Colors.navy,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    marginLeft: 10,
    position: 'relative',
    width: 38,
  },
  filterButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 2,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  filterBadgeText: {
    color: Colors.textWhite,
    fontSize: 9,
    fontWeight: '800',
  },

  // ── List header ─────────────────────────────────────────────────────
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
