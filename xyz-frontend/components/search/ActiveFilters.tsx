/**
 * @file components/search/ActiveFilters.tsx
 * @description Horizontally scrollable row of active filter chips.
 * Each chip shows a label and an X button to remove that filter.
 * The row animates in/out when filters are added or cleared.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { SearchScreenFilters } from '../../hooks/useSearch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActiveFilterChip {
  key: keyof SearchScreenFilters | 'price_range';
  label: string;
}

export interface ActiveFiltersProps {
  chips: ActiveFilterChip[];
  onRemove: (key: ActiveFilterChip['key']) => void;
  onClearAll: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds the list of active filter chips from the current filter state.
 * Called in the parent screen so this component stays purely presentational.
 */
export function buildActiveFilterChips(
  filters: SearchScreenFilters
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.destination?.trim()) {
    chips.push({ key: 'destination', label: filters.destination.trim() });
  }

  if (filters.state?.trim()) {
    chips.push({ key: 'state', label: filters.state.trim() });
  }

  if (filters.category?.trim()) {
    chips.push({ key: 'category', label: filters.category.trim() });
  }

  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    const min = filters.min_price ?? 0;
    const max = filters.max_price;
    const label =
      max !== undefined
        ? `₹${(min / 1000).toFixed(0)}k – ₹${(max / 1000).toFixed(0)}k`
        : `From ₹${(min / 1000).toFixed(0)}k`;
    chips.push({ key: 'price_range', label });
  }

  if (filters.duration_bucket) {
    const labels: Record<string, string> = {
      '1-3': '1–3 Nights',
      '4-6': '4–6 Nights',
      '7-10': '7–10 Nights',
      '10+': '10+ Nights',
    };
    chips.push({
      key: 'duration_bucket',
      label: labels[filters.duration_bucket] ?? filters.duration_bucket,
    });
  }

  if (filters.min_rating !== undefined) {
    chips.push({
      key: 'min_rating',
      label: `${filters.min_rating}+ Stars`,
    });
  }

  if (filters.is_featured) {
    chips.push({ key: 'is_featured', label: 'Featured' });
  }

  return chips;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActiveFilters({
  chips,
  onRemove,
  onClearAll,
}: ActiveFiltersProps): React.ReactElement | null {
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hasChips = chips.length > 0;

  useEffect(() => {
    if (hasChips) {
      Animated.parallel([
        Animated.timing(height, {
          toValue: 48,
          duration: 220,
          useNativeDriver: false, // height cannot use native driver
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(height, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [hasChips, height, opacity]);

  if (!hasChips) {
    // Keep the Animated.View mounted so the collapse animation plays
    return <Animated.View style={[styles.container, { height, opacity }]} />;
  }

  return (
    <Animated.View style={[styles.container, { height, opacity }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((chip) => (
          <FilterChip key={chip.key} chip={chip} onRemove={onRemove} />
        ))}

        {chips.length > 1 && (
          <Pressable
            style={styles.clearAllChip}
            onPress={onClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={styles.clearAllText} numberOfLines={1}>
              Clear all
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ── FilterChip sub-component ──────────────────────────────────────────────────

interface FilterChipProps {
  chip: ActiveFilterChip;
  onRemove: (key: ActiveFilterChip['key']) => void;
}

function FilterChip({ chip, onRemove }: FilterChipProps): React.ReactElement {
  const handleRemove = useCallback(() => {
    onRemove(chip.key);
  }, [chip.key, onRemove]);

  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel} numberOfLines={1}>
        {chip.label}
      </Text>
      <Pressable
        style={styles.chipRemove}
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${chip.label} filter`}
        hitSlop={6}
      >
        <Ionicons name="close" size={13} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginRight: 5,
    maxWidth: 120,
  },
  chipRemove: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllChip: {
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
});
