/**
 * @file components/dashboard/StatusFilterTabs.tsx
 * @description Horizontal scrollable pill tabs for filtering lists.
 *
 *   <StatusFilterTabs
 *     tabs={[{ label: 'All', value: 'all' }, ...]}
 *     selected={status}
 *     onSelect={setStatus}
 *   />
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
import { FontWeight, Radius, Spacing, TouchTarget } from '../../constants/theme';

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
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab) => {
          const active = tab.value === selected;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onSelect(tab.value)}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${tab.label} filter`}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countPill,
                    active && styles.countPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      active && styles.countTextActive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs + 2,
  },
  tabActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  tabText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0,
  },
  tabTextActive: {
    color: Colors.textWhite,
  },
  countPill: {
    minWidth: 20,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  countText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  countTextActive: {
    color: Colors.textWhite,
  },
});
