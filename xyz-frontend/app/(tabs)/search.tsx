/**
 * @file app/(tabs)/search.tsx
 * @description Search screen — all existing hooks, filters, and logic preserved.
 * UI updated to match the reference: clean header, pill search bar, filter chips.
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

  const [filters, setFilters] = useState<SearchScreenFilters>(() =>
    paramsToFilters(params)
  );
  const [destinationInput, setDestinationInput] = useState(
    filters.destination ?? ''
  );
  const [sort, setSort] = useState<SortOption>(filters.sort ?? 'best_match');

  const activeFilters = useMemo<SearchScreenFilters>(
    () => ({ ...filters, sort }),
    [filters, sort]
  );

  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDestinationChange = useCallback((text: string) => {
    setDestinationInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        destination: text.trim() || undefined,
      }));
    }, DESTINATION_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleFilterApply = useCallback((newFilters: SearchScreenFilters) => {
    const { sort: newSort, ...rest } = newFilters;
    if (newSort) setSort(newSort);
    setFilters(rest);
    setDestinationInput(rest.destination ?? '');
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterSheetOpen(false);
  }, []);

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
      if (key === 'destination') setDestinationInput('');
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

  const handleSortSelect = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setFilters((prev) => ({
      ...prev,
      destination: destinationInput.trim() || undefined,
    }));
  }, [destinationInput]);

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
    [total, isLoading, sort, activeChips, handleRemoveFilter, handleClearAllFilters]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

      <FilterBottomSheet
        visible={isFilterSheetOpen}
        filters={activeFilters}
        onApply={handleFilterApply}
        onClose={handleFilterClose}
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
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  headerContainer: {
    backgroundColor: Colors.backgroundBase,
    paddingHorizontal: 20,
  },
  listHeader: {
    paddingHorizontal: 20,
  },
});
