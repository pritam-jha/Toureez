/**
 * @file app/enquiry/index.tsx
 * @description Traveler's list of enquiry threads with vendors.
 */

import React, { useCallback } from 'react';
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

import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { useMyEnquiries } from '../../hooks/useEnquiries';
import { useAuthStore } from '../../store/authStore';
import type { EnquirySummary } from '../../types';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function EnquiryRow({ item, onPress }: { item: EnquirySummary; onPress: (id: string) => void }): React.ReactElement {
  const hasUnread = item.unread_count > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, Shadows.soft, pressed ? styles.pressed : null]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Enquiry with ${item.company.name}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowCompany} numberOfLines={1}>
            {item.company.name}
          </Text>
          <Text style={styles.rowTime}>{formatTimestamp(item.last_message_at)}</Text>
        </View>
        {item.package ? (
          <Text style={styles.rowSubject} numberOfLines={1}>
            {item.package.title}
          </Text>
        ) : null}
        <Text style={[styles.rowPreview, hasUnread && styles.rowPreviewUnread]} numberOfLines={1}>
          {item.last_message_preview ?? 'No messages yet'}
        </Text>
      </View>
      {hasUnread ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="chatbubbles-outline" size={30} color={Colors.primary} />
      </View>
      <Text style={styles.stateTitle}>No enquiries yet</Text>
      <Text style={styles.stateCopy}>
        Ask a vendor a question about a package and your conversation will show up here.
      </Text>
    </View>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <View style={styles.state}>
      <LoadingSpinner />
      <Text style={styles.stateTitle}>Loading enquiries</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): React.ReactElement {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="cloud-offline-outline" size={30} color={Colors.textTertiary} />
      </View>
      <Text style={styles.stateTitle}>Enquiries could not be loaded</Text>
      <Text style={styles.stateCopy}>{message}</Text>
      <Button label="Retry" variant="outline" onPress={onRetry} />
    </View>
  );
}

function AuthState(): React.ReactElement {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name="lock-closed-outline" size={30} color={Colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Login to view enquiries</Text>
      <Button label="Login" onPress={() => router.replace('/(auth)/login' as never)} style={styles.loginButton} />
    </View>
  );
}

export default function EnquiriesScreen(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const enquiriesQuery = useMyEnquiries();
  const enquiries = enquiriesQuery.data ?? [];

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile' as never);
  }, []);

  const handleRefresh = useCallback(() => {
    void enquiriesQuery.refetch();
  }, [enquiriesQuery]);

  const handleOpen = useCallback((id: string) => {
    router.push({ pathname: '/enquiry/[id]' as never, params: { id } });
  }, []);

  const renderItem: ListRenderItem<EnquirySummary> = useCallback(
    ({ item }) => <EnquiryRow item={item} onPress={handleOpen} />,
    [handleOpen]
  );

  const renderEmpty = useCallback(() => {
    if (authLoading || enquiriesQuery.isLoading) return <LoadingState />;
    if (!user) return <AuthState />;
    if (enquiriesQuery.isError) {
      return <ErrorState message={enquiriesQuery.error.message} onRetry={handleRefresh} />;
    }
    return <EmptyState />;
  }, [authLoading, enquiriesQuery.error, enquiriesQuery.isError, enquiriesQuery.isLoading, handleRefresh, user]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={21} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          My Enquiries
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={enquiriesQuery.isLoading ? [] : enquiries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={enquiriesQuery.isRefetching && !enquiriesQuery.isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
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
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCompany: {
    color: Colors.navy,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  rowTime: {
    color: Colors.textLight,
    fontSize: 11,
  },
  rowSubject: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rowPreview: {
    color: Colors.textLight,
    fontSize: 13,
    marginTop: 4,
  },
  rowPreviewUnread: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
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
});
