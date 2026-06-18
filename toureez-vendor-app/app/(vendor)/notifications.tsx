/**
 * @file app/(vendor)/notifications.tsx
 * @description Vendor notifications inbox.
 *
 * Shows paginated notifications, marks individual items read on tap,
 * and provides a "Mark all read" action in the header.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  useVendorNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useVendorNotifications';
import { useScreenBack } from '../../hooks/useScreenBack';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListLoader } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { VendorNotification } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
}

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes('booking')) return 'calendar-outline';
  if (type.includes('review')) return 'star-outline';
  if (type.includes('payout')) return 'wallet-outline';
  if (type.includes('package')) return 'briefcase-outline';
  if (type.includes('vendor')) return 'business-outline';
  return 'notifications-outline';
}

// ── Notification row ──────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: VendorNotification;
  onPress: (id: string) => void;
}

function NotificationRow({ notification, onPress }: NotificationRowProps): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [
        rowStyles.row,
        !notification.is_read && rowStyles.unread,
        pressed && rowStyles.pressed,
      ]}
      onPress={() => onPress(notification.id)}
      accessibilityRole="button"
    >
      <View style={[
        rowStyles.iconBg,
        { backgroundColor: notification.is_read ? Colors.backgroundSoft : Colors.primaryLight },
      ]}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={20}
          color={notification.is_read ? Colors.textSecondary : Colors.primary}
        />
      </View>

      <View style={rowStyles.body}>
        <Text style={[rowStyles.title, !notification.is_read && rowStyles.unreadTitle]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={rowStyles.message} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={rowStyles.time}>{formatRelativeTime(notification.created_at)}</Text>
      </View>

      {!notification.is_read && <View style={rowStyles.dot} />}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.backgroundWhite,
  },
  unread: {
    backgroundColor: Colors.primaryUltraLight,
  },
  pressed: { opacity: 0.75 },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, gap: 3 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  unreadTitle: {
    color: Colors.navy,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen(): React.ReactElement {
  const { data, isLoading, isFetching, refetch } = useVendorNotifications(1);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const onBack = useScreenBack();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handlePressNotification = useCallback((id: string) => {
    markRead.mutate(id);
  }, [markRead]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  return (
    <View style={styles.flex}>
      <Header
        title="Notifications"
        showBack
        onBack={onBack}
        rightAction={
          unreadCount > 0 ? (
            <Button
              label="Mark all read"
              variant="ghost"
              size="small"
              onPress={handleMarkAllRead}
              loading={markAllRead.isPending}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <ListLoader />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={handlePressNotification}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            notifications.length > 0 ? (
              <View style={styles.summary}>
                <Text style={styles.summaryText}>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up'}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              description="You'll see updates about bookings, reviews, and payouts here."
            />
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.backgroundWhite,
    ...Shadows.sm,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
