/**
 * @file app/(admin)/vendors/index.tsx
 * @description Admin vendor list with status filtering and search.
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
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Caption } from '../../../components/ui/Typography';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { useAdminVendors } from '../../../hooks/admin/useAdminVendors';
import type { AdminVendor } from '../../../types/admin';

type VendorStatus = 'pending' | 'approved' | 'rejected';

const STATUS_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as VendorStatus },
  { label: 'Approved', value: 'approved' as VendorStatus },
  { label: 'Rejected', value: 'rejected' as VendorStatus },
];

function VendorAvatar({
  vendor,
}: {
  vendor: AdminVendor;
}): React.ReactElement {
  const initial = (vendor.name ?? 'V').charAt(0).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

function VendorRow({ vendor }: { vendor: AdminVendor }): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/vendors/${vendor.id}`)}
      activeOpacity={0.78}
    >
      <VendorAvatar vendor={vendor} />
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {vendor.name}
          {vendor.is_verified && (
            <Text style={styles.verifiedInline}> ✓</Text>
          )}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {vendor.owner?.full_name ?? vendor.owner?.email ?? '—'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {vendor.total_packages} packages · ★ {vendor.avg_rating.toFixed(1)} ({vendor.total_reviews})
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Badge status={vendor.status} size="sm" />
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function VendorRowSkeleton(): React.ReactElement {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={styles.rowMain}>
        <Skeleton width={'70%'} height={14} />
        <Skeleton width={'40%'} height={11} style={{ marginTop: 6 }} />
        <Skeleton width={'55%'} height={11} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.rowRight}>
        <Skeleton width={64} height={20} radius={10} />
      </View>
    </View>
  );
}

function ItemSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

export default function AdminVendorsScreen(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminVendors({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page: 1,
    limit: 30,
  });

  const items = data?.items ?? [];

  return (
    <ScreenLayout
      title="Vendors"
      subtitle={data ? `${data.total} total` : undefined}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      error={isError ? (error?.message ?? 'Failed to load vendors') : undefined}
      onRetry={() => void refetch()}
    >
      <View style={styles.toolbar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search vendors by name or owner…"
        />
      </View>

      <StatusFilterTabs
        tabs={STATUS_TABS}
        selected={statusFilter}
        onSelect={setStatusFilter}
      />

      {isLoading ? (
        <View>
          <VendorRowSkeleton />
          <ItemSeparator />
          <VendorRowSkeleton />
          <ItemSeparator />
          <VendorRowSkeleton />
          <ItemSeparator />
          <VendorRowSkeleton />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VendorRow vendor={item} />}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={
            <EmptyState
              icon="—"
              title="No vendors found"
              subtitle={
                search
                  ? 'Try adjusting your search or filter.'
                  : 'No vendors match the current filter.'
              }
            />
          }
          ListFooterComponent={
            items.length > 0 && data ? (
              <View style={styles.footer}>
                <Caption color={Colors.textLight} align="center">
                  {data.total} {data.total === 1 ? 'vendor' : 'vendors'} total
                </Caption>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 72,
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  verifiedInline: {
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowMeta: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textLight,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
