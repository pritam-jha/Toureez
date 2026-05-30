/**
 * @file app/(tabs)/search.tsx
 * @description NEXTTRP package search screen.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SearchHeader } from '../../components/search/SearchHeader';
import { FilterBottomSheet } from '../../components/search/FilterBottomSheet';
import { ActiveFilters, buildActiveFilterChips } from '../../components/search/ActiveFilters';
import { PackageList } from '../../components/search/PackageList';
import { ResultsHeader } from '../../components/search/ResultsHeader';
import { SortModal } from '../../components/search/SortModal';
import { useLocations } from '../../hooks/useHomeData';
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
import type { Location } from '../../types';

const DESTINATION_DEBOUNCE_MS = 400;
const DESTINATION_IMAGES = [
  'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=500&q=80',
];

function paramsToFilters(params: Record<string, string | string[]>): SearchScreenFilters {
  const get = (key: string): string | undefined => {
    const value = params[key];
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  };

  const filters: SearchScreenFilters = {};
  const destination = get('destination');
  const state = get('state');
  const category = get('category');
  const isFeatured = get('is_featured');
  const minPrice = get('min_price');
  const maxPrice = get('max_price');
  const minRating = get('min_rating');
  const sort = get('sort') as SortOption | undefined;

  if (destination) filters.destination = destination;
  if (state) filters.state = state;
  if (category) filters.category = category;
  if (isFeatured === 'true') filters.is_featured = true;
  if (minPrice && !Number.isNaN(Number(minPrice))) filters.min_price = Number(minPrice);
  if (maxPrice && !Number.isNaN(Number(maxPrice))) filters.max_price = Number(maxPrice);
  if (minRating && !Number.isNaN(Number(minRating))) filters.min_rating = Number(minRating);
  if (sort) filters.sort = sort;

  return filters;
}

function destinationImage(index: number): string {
  return DESTINATION_IMAGES[index % DESTINATION_IMAGES.length] ?? DESTINATION_IMAGES[0];
}

function DestinationGrid({
  locations,
  onPress,
}: {
  locations: Location[];
  onPress: (location: Location) => void;
}): React.ReactElement | null {
  if (locations.length === 0) return null;

  return (
    <View style={styles.destinationGrid}>
      {locations.slice(0, 6).map((location, index) => (
        <Pressable
          key={location.id}
          style={styles.destinationCell}
          onPress={() => onPress(location)}
          accessibilityRole="button"
          accessibilityLabel={`Search ${location.city}`}
        >
          <Image
            source={{ uri: destinationImage(index) }}
            style={styles.destinationImage}
            resizeMode="cover"
          />
          <View style={styles.destinationOverlay} pointerEvents="none" />
          <Text style={styles.destinationCity} numberOfLines={1}>
            {location.city}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SearchScreen(): React.ReactElement {
  const params = useLocalSearchParams<Record<string, string>>();
  const slideUp = useSlideUp();
  const { data: locations } = useLocations(true);

  const [filters, setFilters] = useState<SearchScreenFilters>(() => paramsToFilters(params));
  const [destinationInput, setDestinationInput] = useState(filters.destination ?? '');
  const [sort, setSort] = useState<SortOption>(filters.sort ?? 'best_match');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Manali',
    'Goa',
    'Kashmir',
  ]);
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilters = useMemo<SearchScreenFilters>(
    () => ({ ...filters, sort }),
    [filters, sort]
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
  const activeChips = useMemo(() => buildActiveFilterChips(activeFilters), [activeFilters]);
  const activeFilterCount = useMemo(() => countActiveFilters(activeFilters), [activeFilters]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const commitDestination = useCallback((text: string) => {
    const trimmed = text.trim();
    setFilters((prev) => ({
      ...prev,
      destination: trimmed || undefined,
    }));
    if (trimmed) {
      setRecentSearches((current) => [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, 5));
    }
  }, []);

  const handleDestinationChange = useCallback(
    (text: string) => {
      setDestinationInput(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => commitDestination(text), DESTINATION_DEBOUNCE_MS);
    },
    [commitDestination]
  );

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    commitDestination(destinationInput);
  }, [commitDestination, destinationInput]);

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

  const handleRemoveFilter = useCallback((key: ActiveFilterChip['key']) => {
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
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setDestinationInput('');
    setSort('best_match');
  }, []);

  const handleSortSelect = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  const handleRecentPress = useCallback(
    (term: string) => {
      setDestinationInput(term);
      commitDestination(term);
    },
    [commitDestination]
  );

  const handleRemoveRecent = useCallback((term: string) => {
    setRecentSearches((current) => current.filter((item) => item !== term));
  }, []);

  const handleDestinationPress = useCallback((location: Location) => {
    setDestinationInput(location.city);
    setFilters((prev) => ({
      ...prev,
      destination: location.city,
      state: location.state,
    }));
  }, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        {recentSearches.length > 0 ? (
          <View style={styles.recentBlock}>
            <Text style={styles.blockTitle}>Recent searches</Text>
            <View style={styles.recentChips}>
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  style={styles.recentChip}
                  onPress={() => handleRecentPress(term)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${term}`}
                >
                  <Text style={styles.recentText}>{term}</Text>
                  <Pressable
                    onPress={() => handleRemoveRecent(term)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${term}`}
                  >
                    <Ionicons name="close" size={13} color={Colors.textSecondary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.destinationBlock}>
          <Text style={styles.blockTitle}>Destinations</Text>
          <DestinationGrid locations={locations ?? []} onPress={handleDestinationPress} />
        </View>

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
      handleDestinationPress,
      handleRecentPress,
      handleRemoveFilter,
      handleRemoveRecent,
      isLoading,
      locations,
      recentSearches,
      sort,
      total,
    ]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.animatedRoot, slideUp.animatedStyle]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Find Packages</Text>
          <Text style={styles.headerSubtitle}>Discover India's best trips</Text>
          <View style={[styles.searchWrap, Shadows.soft]}>
            <SearchHeader
              value={destinationInput}
              onChangeText={handleDestinationChange}
              onSubmit={handleSearchSubmit}
              onFilterPress={() => setFilterSheetOpen(true)}
              activeFilterCount={activeFilterCount}
              canGoBack={false}
            />
          </View>
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
      </Animated.View>

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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  animatedRoot: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: Colors.background,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerTitle: {
    color: Colors.navy,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  searchWrap: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    marginTop: 16,
  },
  listHeader: {
    paddingHorizontal: 20,
  },
  recentBlock: {
    marginTop: 4,
  },
  blockTitle: {
    color: Colors.navy,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    alignItems: 'center',
    backgroundColor: Colors.primaryUltraLight,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recentText: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  destinationBlock: {
    marginTop: 20,
  },
  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationCell: {
    borderRadius: 14,
    height: 110,
    overflow: 'hidden',
    position: 'relative',
    width: '31.8%',
  },
  destinationImage: {
    height: '100%',
    width: '100%',
  },
  destinationOverlay: {
    backgroundColor: Colors.overlayLight,
    bottom: 0,
    height: 56,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  destinationCity: {
    bottom: 10,
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '800',
    left: 10,
    position: 'absolute',
    right: 10,
  },
});
