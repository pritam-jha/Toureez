/**
 * @file app/(vendor)/bookings/index.tsx
 * @description Vendor bookings list screen.
 *
 * Shows all bookings with status filter chips and pull-to-refresh.
 * Tapping a booking navigates to the detail screen.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVendorBookings } from '../../../hooks/useVendorBookings';
import { useVendorStore } from '../../../store/vendorStore';
import { BookingCard } from '../../../components/vendor/BookingCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ListLoader } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import type { BookingStatus, VendorBookingListItem } from '../../../types';

const STATUS_FILTERS: Array<{ label: string; value: BookingStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { bookingFilters, setBookingFilters } = useVendorStore();
  const { status: initialStatus, from } = useLocalSearchParams<{ status?: BookingStatus; from?: string }>();
  const [page] = useState(1);

  // Apply initial status filter from navigation params (e.g. tapping a dashboard metric)
  useEffect(() => {
    if (initialStatus) {
      setBookingFilters({ status: initialStatus });
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isFetching, refetch, isError } = useVendorBookings(page);

  const activeStatus = bookingFilters.status ?? '';

  const handleStatusFilter = useCallback(
    (status: BookingStatus | '') => {
      setBookingFilters({ status: status || undefined });
    },
    [setBookingFilters],
  );

  const renderItem = useCallback(
    ({ item }: { item: VendorBookingListItem }) => (
      <BookingCard
        booking={item}
        onPress={() => router.push({ pathname: '/(vendor)/bookings/[id]', params: { id: item.id } })}
      />
    ),
    [],
  );

  const bookings = data?.items ?? [];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header — shows back button when opened from dashboard quick action */}
      <View style={styles.header}>
        {from === 'dashboard' && (
          <Pressable onPress={() => router.navigate('/(vendor)')} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.navy} />
          </Pressable>
        )}
        <Text style={styles.heading}>Bookings</Text>
        <Text style={styles.count}>{data?.total ?? 0} total</Text>
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

      {/* Booking list */}
      {isLoading ? (
        <ListLoader />
      ) : isError ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textLight} />
          <Text style={styles.errorText}>Failed to load bookings.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={activeStatus ? 'No bookings found' : 'No bookings yet'}
          description={
            activeStatus
              ? `You have no ${activeStatus} bookings.`
              : 'Once travelers book your packages, they will appear here.'
          }
        />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
        />
      )}
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
  backBtn: {
    marginRight: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSoft,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    flex: 1,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
