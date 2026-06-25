/**
 * @file app/(vendor)/packages/index.tsx
 * @description Vendor package list screen.
 *
 * Shows all packages for the vendor with status filter chips and a search bar.
 * Tapping a package navigates to the detail/edit screen.
 * FAB navigates to the new package form.
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVendorPackages } from '../../../hooks/useVendorPackages';
import { useVendorStore } from '../../../store/vendorStore';
import { PackageCard } from '../../../components/vendor/PackageCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ListLoader } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import type { PackageStatus, VendorPackageListItem } from '../../../types';

const STATUS_FILTERS: Array<{ label: string; value: PackageStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Draft', value: 'draft' },
  { label: 'Rejected', value: 'rejected' },
];

export default function PackagesScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { packageFilters, setPackageFilters } = useVendorStore();
  const [page] = useState(1);

  const { data, isLoading, isFetching, refetch, isError } = useVendorPackages(page);

  const activeStatus = packageFilters.status ?? '';

  const handleStatusFilter = useCallback(
    (status: PackageStatus | '') => {
      setPackageFilters({ status: status || undefined });
    },
    [setPackageFilters],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setPackageFilters({ search: text || undefined });
    },
    [setPackageFilters],
  );

  const renderItem = useCallback(
    ({ item }: { item: VendorPackageListItem }) => (
      <PackageCard
        pkg={item}
        onPress={() => router.push({ pathname: '/(vendor)/packages/[id]', params: { id: item.id } })}
      />
    ),
    [],
  );

  const packages = data?.items ?? [];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Packages</Text>
        <Text style={styles.count}>{data?.total ?? 0} total</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrapper, Shadows.sm]}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search packages…"
          placeholderTextColor={Colors.textLight}
          value={packageFilters.search ?? ''}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Status filter chips */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, activeStatus === item.value && styles.chipActive]}
            onPress={() => handleStatusFilter(item.value)}
          >
            <Text style={[styles.chipText, activeStatus === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Package list */}
      {isLoading ? (
        <ListLoader />
      ) : isError ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textLight} />
          <Text style={styles.errorText}>Failed to load packages.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : packages.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title={activeStatus ? 'No packages found' : 'No packages yet'}
          description={
            activeStatus
              ? `You have no ${activeStatus} packages.`
              : 'Create your first travel package to start attracting bookings.'
          }
          actionLabel="Create Package"
          onAction={() => router.push('/(vendor)/packages/new')}
        />
      ) : (
        <FlatList
          data={packages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
        />
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, Shadows.primary, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/(vendor)/packages/new')}
        accessibilityRole="button"
        accessibilityLabel="Create new package"
      >
        <Ionicons name="add" size={26} color={Colors.textWhite} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    height: 44,
    marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.backgroundWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textWhite,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
});
