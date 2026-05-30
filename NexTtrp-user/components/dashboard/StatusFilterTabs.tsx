/**
 * @file components/dashboard/StatusFilterTabs.tsx
 * @description Horizontal scrollable pill-tabs for filtering by status.
 *
 * Used on vendor list, package list, booking list, review list, etc.
 * Fires onSelect(value) when a tab is pressed; 'all' clears the filter.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface StatusTab<T extends string> {
  label: string;
  value: T | 'all';
  count?: number;
}

interface StatusFilterTabsProps<T extends string> {
  tabs: StatusTab<T>[];
  selected: T | 'all';
  onSelect: (value: T | 'all') => void;
}

export function StatusFilterTabs<T extends string>({
  tabs,
  selected,
  onSelect,
}: StatusFilterTabsProps<T>): React.ReactElement {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const active = tab.value === selected;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onSelect(tab.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
                {tab.count !== undefined && (
                  <Text style={[styles.count, active && styles.countActive]}>
                    {' '}
                    {tab.count}
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textWhite,
    fontWeight: '600',
  },
  count: {
    color: Colors.textLight,
    fontWeight: '400',
  },
  countActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});
