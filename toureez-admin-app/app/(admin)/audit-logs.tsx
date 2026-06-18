/**
 * @file app/(admin)/audit-logs.tsx
 * Read-only admin audit log viewer with entity filtering and pagination.
 */

import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import { StatusFilterTabs } from '../../components/dashboard/StatusFilterTabs';
import { AuditLogItem } from '../../components/admin/AuditLogItem';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Caption } from '../../components/ui/Typography';
import { useAdminAuditLogs } from '../../hooks/admin/useAdminAuditLogs';
import type { AdminAuditLog } from '../../types/admin';

type EntityFilter = 'all' | 'vendor' | 'package' | 'booking' | 'review' | 'category' | 'location' | 'payout' | 'user';

const ENTITY_TABS = [
  { label: 'All', value: 'all' as EntityFilter },
  { label: 'Vendors', value: 'vendor' as EntityFilter },
  { label: 'Packages', value: 'package' as EntityFilter },
  { label: 'Bookings', value: 'booking' as EntityFilter },
  { label: 'Reviews', value: 'review' as EntityFilter },
  { label: 'Users', value: 'user' as EntityFilter },
  { label: 'Categories', value: 'category' as EntityFilter },
  { label: 'Locations', value: 'location' as EntityFilter },
  { label: 'Payouts', value: 'payout' as EntityFilter },
];

export default function AdminAuditLogsScreen(): React.ReactElement {
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      entity_type: entityFilter === 'all' ? undefined : entityFilter,
      page,
      limit: 30,
    }),
    [entityFilter, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminAuditLogs(queryParams);

  const logs = data?.items ?? [];
  const hasMore = data?.has_more ?? false;

  const handleFilterChange = useCallback((val: EntityFilter) => {
    setEntityFilter(val);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <ScreenLayout
      title="Audit Logs"
      subtitle={data ? `${data.total} actions recorded` : 'What admins have done'}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      loading={isLoading && logs.length === 0}
      error={isError ? (error?.message ?? 'Failed to load audit logs') : undefined}
      onRetry={refresh}
      headerRight={
        <Button
          variant="outline"
          size="sm"
          onPress={refresh}
          loading={isFetching && !isLoading}
          disabled={isFetching}
          label="Refresh"
        />
      }
    >
      <StatusFilterTabs
        tabs={ENTITY_TABS}
        selected={entityFilter}
        onSelect={handleFilterChange}
      />

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: AdminAuditLog }) => <AuditLogItem log={item} />}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="!"
            title="No audit records"
            subtitle={
              entityFilter === 'all'
                ? 'Audit entries will appear after admin actions are performed.'
                : 'Try selecting All to review the full activity trail.'
            }
          />
        }
        ListFooterComponent={
          logs.length > 0 ? (
            <View style={styles.footer}>
              {isFetching && (
                <View style={styles.fetchingRow}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Caption color={Colors.textSecondary}>Updating records</Caption>
                </View>
              )}
              {data && (
                <Caption color={Colors.textLight} align="center">
                  Page {page} / {data.total} total records
                </Caption>
              )}
              <View style={styles.paginationRow}>
                <Button
                  variant="outline"
                  size="md"
                  label="Previous"
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  style={styles.pageButton}
                />
                <Button
                  variant="primary"
                  size="md"
                  label="Next"
                  onPress={() => setPage((p) => p + 1)}
                  disabled={!hasMore || isFetching}
                  loading={isFetching && hasMore}
                  style={styles.pageButton}
                />
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: Colors.surface,
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  fetchingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  pageButton: {
    flex: 1,
    maxWidth: 160,
    borderRadius: Radius.md,
  },
});
