/**
 * @file app/(admin)/bookings/index.tsx
 * Admin bookings list with status filtering.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { FontWeight, Spacing } from '../../../constants/theme';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Caption } from '../../../components/ui/Typography';
import { useAdminBookings } from '../../../hooks/admin/useAdminBookings';
import type { AdminBooking } from '../../../types/admin';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const INR = '\u20B9';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as BookingStatus },
  { label: 'Confirmed', value: 'confirmed' as BookingStatus },
  { label: 'Completed', value: 'completed' as BookingStatus },
  { label: 'Cancelled', value: 'cancelled' as BookingStatus },
];

function BookingRow({ booking }: { booking: AdminBooking }): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/bookings/${booking.id}`)}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Open booking ${booking.booking_reference}`}
    >
      <View style={styles.rowMain}>
        <View style={styles.refRow}>
          <Text style={styles.ref} numberOfLines={1}>{booking.booking_reference}</Text>
          <Badge status={booking.status} size="sm" />
        </View>
        <Text style={styles.pkg} numberOfLines={1}>
          {booking.package?.title ?? 'Package'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {booking.user?.full_name ?? 'Unknown customer'} / {booking.num_travelers} pax / {new Date(booking.travel_date).toLocaleDateString('en-IN')}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.amount}>
            {INR}{booking.total_amount.toLocaleString('en-IN')}
          </Text>
          <Badge status={booking.payment_status} label={`Payment: ${booking.payment_status}`} size="sm" />
        </View>
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </TouchableOpacity>
  );
}

function ItemSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

export default function AdminBookingsScreen(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  const items = data?.items ?? [];

  return (
    <ScreenLayout
      title="Bookings"
      subtitle={data ? `${data.total} total` : undefined}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      loading={isLoading && items.length === 0}
      error={isError ? (error?.message ?? 'Failed to load bookings') : undefined}
      onRetry={() => void refetch()}
    >
      <View style={styles.toolbar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search booking reference"
        />
      </View>

      <StatusFilterTabs tabs={STATUS_TABS} selected={statusFilter} onSelect={setStatusFilter} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: AdminBooking }) => <BookingRow booking={item} />}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="!"
            title="No bookings found"
            subtitle={search ? 'Try another booking reference.' : 'Bookings matching this filter will appear here.'}
          />
        }
        ListFooterComponent={
          data && items.length > 0 ? (
            <View style={styles.footer}>
              <Caption color={Colors.textLight} align="center">
                {data.total} {data.total === 1 ? 'booking' : 'bookings'} total
              </Caption>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 96,
    gap: Spacing.md,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 4 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  ref: {
    flex: 1,
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
    fontFamily: 'monospace',
  },
  pkg: { fontSize: 14, color: Colors.text, fontWeight: FontWeight.semibold },
  meta: { fontSize: 12, color: Colors.textSecondary },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: 2,
  },
  amount: { fontSize: 14, fontWeight: FontWeight.bold, color: Colors.primary },
  chevron: {
    fontSize: 17,
    color: Colors.textLight,
    fontWeight: FontWeight.bold,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
