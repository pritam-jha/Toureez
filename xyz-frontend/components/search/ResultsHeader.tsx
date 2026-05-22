/**
 * @file components/search/ResultsHeader.tsx
 * @description Shows result count, sort button, and view toggle row.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SORT_OPTIONS } from '../../hooks/useSearch';
import { Colors } from '../../constants/colors';
import type { SortOption } from '../../hooks/useSearch';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ResultsHeaderProps {
  total: number;
  isLoading: boolean;
  selectedSort: SortOption;
  onSortPress: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultsHeader({
  total,
  isLoading,
  selectedSort,
  onSortPress,
}: ResultsHeaderProps): React.ReactElement {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === selectedSort)?.label ?? 'Best Match';

  const countLabel = isLoading
    ? 'Searching…'
    : `${total.toLocaleString('en-IN')} package${total !== 1 ? 's' : ''} found`;

  return (
    <View style={styles.container}>
      <Text style={styles.count} numberOfLines={1}>
        {countLabel}
      </Text>

      <View style={styles.actions}>
        {/* Sort button */}
        <Pressable
          style={styles.sortButton}
          onPress={onSortPress}
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortLabel}`}
          hitSlop={8}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={15}
            color={Colors.primary}
          />
          <Text style={styles.sortText} numberOfLines={1}>
            {sortLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={Colors.primary}
          />
        </Pressable>

        {/* Grid toggle — Phase 1: list only, grid greyed out */}
        <View style={styles.viewToggle}>
          <View style={[styles.toggleButton, styles.toggleButtonActive]}>
            <Ionicons name="list-outline" size={18} color={Colors.primary} />
          </View>
          <View style={[styles.toggleButton, styles.toggleButtonDisabled]}>
            <Ionicons name="grid-outline" size={18} color={Colors.textTertiary} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingTop: 4,
  },
  count: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginRight: 12,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sortButton: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 10,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  sortText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    maxWidth: 120,
  },
  viewToggle: {
    flexDirection: 'row',
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  toggleButtonDisabled: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    marginLeft: 6,
    opacity: 0.5,
  },
});
