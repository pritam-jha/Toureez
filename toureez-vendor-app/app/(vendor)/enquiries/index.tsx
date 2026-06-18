/**
 * @file app/(vendor)/enquiries/index.tsx
 * @description Vendor enquiry inbox — traveler questions about packages,
 * relayed through Toureez without sharing personal contact details.
 */

import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Header } from '../../../components/ui/Header';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ListLoader } from '../../../components/ui/LoadingSpinner';
import { useScreenBack } from '../../../hooks/useScreenBack';
import { useVendorEnquiries } from '../../../hooks/useVendorEnquiries';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import type { EnquirySummary } from '../../../types';

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
      style={({ pressed }) => [styles.row, Shadows.sm, pressed && styles.pressed]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Enquiry from traveler about ${item.package?.title ?? 'a package'}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.package?.title ?? item.subject}
          </Text>
          <Text style={styles.rowTime}>{formatTimestamp(item.last_message_at)}</Text>
        </View>
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

export default function VendorEnquiriesScreen(): React.ReactElement {
  const onBack = useScreenBack();
  const enquiriesQuery = useVendorEnquiries();
  const enquiries = enquiriesQuery.data ?? [];

  const handleOpen = useCallback((id: string) => {
    router.push({ pathname: '/(vendor)/enquiries/[id]', params: { id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: EnquirySummary }) => <EnquiryRow item={item} onPress={handleOpen} />,
    [handleOpen],
  );

  return (
    <View style={styles.flex}>
      <Header title="Enquiries" showBack onBack={onBack} />
      {enquiriesQuery.isLoading ? (
        <ListLoader />
      ) : enquiriesQuery.isError ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textLight} />
          <Text style={styles.errorText}>Failed to load enquiries.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void enquiriesQuery.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={enquiries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={enquiriesQuery.isFetching && !enquiriesQuery.isLoading}
          onRefresh={() => void enquiriesQuery.refetch()}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No enquiries yet"
              description="When travelers ask about your packages, their messages will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    marginBottom: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
  },
  rowTime: {
    fontSize: 11,
    color: Colors.textLight,
  },
  rowPreview: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textLight,
  },
  rowPreviewUnread: {
    color: Colors.text,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: { opacity: 0.7 },
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
