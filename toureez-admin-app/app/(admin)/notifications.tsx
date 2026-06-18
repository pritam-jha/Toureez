/**
 * @file app/(admin)/notifications.tsx
 * @description Admin notifications inbox with mark-read and mark-all-read actions.
 */

import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  useAdminNotifications,
  useMarkAdminNotificationRead,
  useMarkAllAdminNotificationsRead,
} from '../../hooks/admin/useAdminNotifications';
import type { AdminNotification } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Notification row ──────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: AdminNotification;
  onPress: (id: string) => void;
}

function NotificationRow({ notification, onPress }: NotificationRowProps): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.row, !notification.is_read && styles.rowUnread]}
      onPress={() => onPress(notification.id)}
      accessibilityRole="button"
    >
      <View style={[styles.dot, notification.is_read && styles.dotRead]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, !notification.is_read && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeTime(notification.created_at)}</Text>
        </View>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminNotificationsScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminNotifications();
  const markRead = useMarkAdminNotificationRead();
  const markAllRead = useMarkAllAdminNotificationsRead();

  const notifications = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handlePress = useCallback(
    (id: string) => {
      markRead.mutate(id);
    },
    [markRead],
  );

  const handleMarkAll = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  return (
    <ScreenLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      loading={isLoading && notifications.length === 0}
      error={isError ? (error?.message ?? 'Failed to load notifications') : undefined}
      onRetry={() => void refetch()}
      headerRight={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onPress={handleMarkAll}
            disabled={markAllRead.isPending}
            loading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        ) : undefined
      }
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: AdminNotification }) => (
          <NotificationRow notification={item} onPress={handlePress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🔔"
              title="No notifications"
              subtitle="Admin notifications will appear here."
            />
          ) : null
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  rowUnread: {
    backgroundColor: Colors.primaryUltraLight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  dotRead: {
    backgroundColor: Colors.borderLight,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  rowTitleUnread: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  rowTime: {
    fontSize: 11,
    color: Colors.textLight,
    flexShrink: 0,
  },
  rowMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
});
