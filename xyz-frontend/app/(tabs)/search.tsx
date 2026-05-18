/**
 * @file app/(tabs)/search.tsx
 * @description Search results screen for XYZ package discovery.
 *
 * Receives initial filters from URL params (destination, category, state,
 * is_featured) set by the home screen. All filter state lives here and is
 * synced to URL params so links are shareable.
 *
 * Architecture:
 * - All business logic in hooks (useInfiniteSearch, useCategories)
 * - Components are purely presentational
 * - Filter state is local; URL params are the source of truth on mount
 * - Debounced destination input to avoid a query on every keystroke
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { SearchHeader } from '../../components/search/SearchHeader';
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
import type { SearchScreenFilters, SortOption } from '../../hooks/useSearch';
import type { ActiveFilterChip } from '../../components/search/ActiveFilters';

// ── Constants ─────────────────────────────────────────────────────────────────

const DESTINATION_DEBOUNCE_MS = 400;

// ── URL param → filter helpers ────────────────────────────────────────────────

/**
 * Reads the initial filter state from Expo Router URL params.
 * All params are optional strings — we coerce them to the correct types here.
 */
function paramsToFilters(params: Record<string, string | string[]>): SearchScreenFilters {
  const get = (key: string): string | undefined => {
    const v = params[key];
    if (!v) return undefined;
    return Array.isArray(v) ? v[0] : v;
  };

  const filters: SearchScreenFilters = {};

  const destination = get('destination');
  if (destination) filters.destination = destination;

  const state = get('state');
  if (state) filters.state = state;

  const category = get('category');
  if (category) filters.category = category;

  const isFeatured = get('is_featured');
  if (isFeatured === 'true') filters.is_featured = true;

  const minPrice = get('min_price');
  if (minPrice) {
    const parsed = Number(minPrice);
    if (!Number.isNaN(parsed)) filters.min_price = parsed;
  }

  const maxPrice = get('max_price');
  if (maxPrice) {
    const parsed = Number(maxPrice);
    if (!Number.isNaN(parsed)) filters.max_price = parsed;
  }

  const minRating = get('min_rating');
  if (minRating) {
    const parsed = Number(minRating);
    if (!Number.isNaN(parsed)) filters.min_rating = parsed;
  }

  const sort = get('sort') as SortOption | undefined;
  if (sort) filters.sort = sort;

  return filters;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SearchScreen(): React.ReactElement {
  const params = useLocalSearchParams<Record<string, string>>();

  // ── Filter state ────────────────────────────────────────────────────────────

  // Committed filters — what the query actually runs against
  const [filters, setFilters] = useState<SearchScreenFilters>(() =>
    paramsToFilters(params)
  );

  // Destination input value — debounced before committing to filters
  const [destinationInput, setDestinationInput] = useState(
    filters.destination ?? ''
  );

  // Sort state — kept separate so the sort modal can update it independently
  const [sort, setSort] = useState<SortOption>(filters.sort ?? 'best_match');

  // Sync sort into filters whenever it changes
  const activeFilters = useMemo<SearchScreenFilters>(
    () => ({ ...filters, sort }),
    [filters, sort]
  );

  // ── UI state ────────────────────────────────────────────────────────────────

  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Destination debounce ────────────────────────────────────────────────────

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDestinationChange = useCallback((text: string) => {
    setDestinationInput(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        destination: text.trim() || undefined,
      }));
    }, DESTINATION_DEBOUNCE_MS);
  }, []);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ── Query ───────────────────────────────────────────────────────────────────

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

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // ── Filter sheet ────────────────────────────────────────────────────────────

  const handleFilterApply = useCallback((newFilters: SearchScreenFilters) => {
    // Extract sort from the filter sheet's draft and apply separately
    const { sort: newSort, ...rest } = newFilters;
    if (newSort) setSort(newSort);
    setFilters(rest);
    // Sync destination input if the sheet cleared it
    setDestinationInput(rest.destination ?? '');
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterSheetOpen(false);
  }, []);

  // ── Active filter chips ─────────────────────────────────────────────────────

  const activeChips = useMemo(
    () => buildActiveFilterChips(activeFilters),
    [activeFilters]
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(activeFilters),
    [activeFilters]
  );

  const handleRemoveFilter = useCallback(
    (key: ActiveFilterChip['key']) => {
      if (key === 'price_range') {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.min_price;
          delete next.max_price;
          return next;
        });
        return;
      }

      if (key === 'destination') {
        setDestinationInput('');
      }

      setFilters((prev) => {
        const next = { ...prev };
        delete next[key as keyof SearchScreenFilters];
        return next;
      });
    },
    []
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setDestinationInput('');
    setSort('best_match');
  }, []);

  // ── Sort ────────────────────────────────────────────────────────────────────

  const handleSortSelect = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  // ── Search submit ───────────────────────────────────────────────────────────

  const handleSearchSubmit = useCallback(() => {
    // Flush the debounce immediately on submit
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setFilters((prev) => ({
      ...prev,
      destination: destinationInput.trim() || undefined,
    }));
  }, [destinationInput]);

  // ── List header (rendered inside FlatList) ──────────────────────────────────

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
      total,
      isLoading,
      sort,
      activeChips,
      handleRemoveFilter,
      handleClearAllFilters,
    ]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Fixed header — does not scroll */}
      <View style={styles.headerContainer}>
        <SearchHeader
          value={destinationInput}
          onChangeText={handleDestinationChange}
          onSubmit={handleSearchSubmit}
          onFilterPress={() => setFilterSheetOpen(true)}
          activeFilterCount={activeFilterCount}
          canGoBack={false}
        />
      </View>

      {/* Scrollable results list */}
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

      {/* Filter bottom sheet */}
      <FilterBottomSheet
        visible={isFilterSheetOpen}
        filters={activeFilters}
        onApply={handleFilterApply}
        onClose={handleFilterClose}
      />

      {/* Sort modal */}
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
  headerContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
  },
});
