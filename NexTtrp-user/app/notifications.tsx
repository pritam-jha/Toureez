/**
 * @file app/notifications.tsx
 * @description Authenticated grouped notifications inbox.
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyNotifications } from '../components/notifications/EmptyNotifications';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors } from '../constants/colors';
import {
  useMarkAllRead,
  useMarkAsRead,
  useNotifications,
} from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';
import type { AppNotification, NotificationSection } from '../types';

type NotificationListRow =
  | {
      key: string;
      kind: 'section';
      title: NotificationSection['title'];
    }
  | {
      key: string;
      kind: 'notification';
      notification: AppNotification;
    };

function rowsFromSections(
  sections: NotificationSection[]
): NotificationListRow[] {
  return sections.flatMap((section) => [
    {
      key: `section-${section.key}`,
      kind: 'section' as const,
      title: section.title,
    },
    ...section.notifications.map((notification) => ({
      key: notification.id,
      kind: 'notification' as const,
      notification,
    })),
  ]);
}

function countUnread(sections: NotificationSection[]): number {
  return sections.reduce(
    (count, section) =>
      count +
      section.notifications.filter((notification) => !notification.is_read)
        .length,
    0
  );
}

function readDataString(
  notification: AppNotification,
  key: string
): string | null {
  const value = notification.data[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function openRelatedEntity(notification: AppNotification): void {
  if (notification.related_type === 'booking' && notification.related_id) {
    router.push({
      pathname: '/booking/detail/[id]' as never,
      params: { id: notification.related_id },
    });
    return;
  }

  if (notification.related_type === 'package' && notification.related_id) {
    router.push({
      pathname: '/package/[id]' as never,
      params: { id: notification.related_id },
    });
    return;
  }

  const reviewPackageId =
    notification.type === 'review_received'
      ? readDataString(notification, 'package_id')
      : null;

  if (reviewPackageId) {
    router.push({
      pathname: '/package/[id]' as never,
      params: { id: reviewPackageId },
    });
  }
}

function LoadingState(): React.ReactElement {
  return (
    <View style={styles.state}>
      <LoadingSpinner />
      <Text style={styles.stateTitle}>Loading notifications</Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="cloud-offline-outline" size={30} color={Colors.textTertiary} />
      </View>
      <Text style={styles.stateTitle}>Notifications could not be loaded</Text>
      <Text style={styles.stateCopy}>{message}</Text>
      <Button label="Retry" variant="outline" onPress={onRetry} />
    </View>
  );
}

function AuthState(): React.ReactElement {
  const handleLogin = useCallback(() => {
    router.replace('/(auth)/login' as never);
  }, []);

  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="lock-closed-outline" size={30} color={Colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Login to view notifications</Text>
      <Button label="Login" onPress={handleLogin} style={styles.loginButton} />
    </View>
  );
}

export default function NotificationsScreen(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const notificationsQuery = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();
  const sections = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data]
  );
  const rows = useMemo(() => rowsFromSections(sections), [sections]);
  const unreadCount = useMemo(() => countUnread(sections), [sections]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)' as never);
  }, []);

  const handleRefresh = useCallback(() => {
    void notificationsQuery.refetch();
  }, [notificationsQuery]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsRead.mutate(notificationId);
    },
    [markAsRead]
  );

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      if (!notification.is_read) {
        markAsRead.mutate(notification.id);
      }

      openRelatedEntity(notification);
    },
    [markAsRead]
  );

  const renderRow: ListRenderItem<NotificationListRow> = useCallback(
    ({ item }) => {
      if (item.kind === 'section') {
        return <Text style={styles.sectionTitle}>{item.title}</Text>;
      }

      return (
        <NotificationItem
          notification={item.notification}
          onMarkAsRead={handleMarkAsRead}
          onPress={handleNotificationPress}
        />
      );
    },
    [handleMarkAsRead, handleNotificationPress]
  );

  const renderEmpty = useCallback(() => {
    if (authLoading || notificationsQuery.isLoading) {
      return <LoadingState />;
    }

    if (!user) {
      return <AuthState />;
    }

    if (notificationsQuery.isError) {
      return (
        <ErrorState
          message={notificationsQuery.error.message}
          onRetry={handleRefresh}
        />
      );
    }

    return <EmptyNotifications />;
  }, [
    authLoading,
    handleRefresh,
    notificationsQuery.error,
    notificationsQuery.isError,
    notificationsQuery.isLoading,
    user,
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={21} color={Colors.textPrimary} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          Notifications
        </Text>

        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.markAllButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={handleMarkAllRead}
            disabled={markAllRead.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            accessibilityState={{ disabled: markAllRead.isPending }}
          >
            <Text style={styles.markAllText} numberOfLines={2}>
              Mark all as read
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <FlatList
        data={notificationsQuery.isLoading ? [] : rows}
        renderItem={renderRow}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              notificationsQuery.isRefetching && !notificationsQuery.isLoading
            }
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundBase,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginHorizontal: 12,
    letterSpacing: -0.4,
  },
  markAllButton: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: 98,
    minHeight: 40,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
  },
  headerSpacer: {
    width: 42,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 9,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  stateTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 6,
    textAlign: 'center',
  },
  stateCopy: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 18,
    marginTop: 7,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 18,
    minWidth: 160,
  },
  pressed: {
    opacity: 0.78,
  },
});
