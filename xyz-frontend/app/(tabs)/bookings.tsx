/**
 * @file app/(tabs)/bookings.tsx
 * @description My Bookings tab with status filters and booking history cards.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BookingCard } from '../../components/bookings/BookingCard';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import {
  useMyBookings,
  type MyBookingsFilter,
} from '../../hooks/useBookings';
import { useAuthStore } from '../../store/authStore';
import type { BookingSummary } from '../../types';

type BookingTab = 'all' | MyBookingsFilter;

const FILTER_TABS: { key: BookingTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_COPY: Record<BookingTab, string> = {
  all: 'No bookings yet. Start exploring packages!',
  upcoming: 'No upcoming trips',
  completed: 'No completed trips yet',
  cancelled: 'No cancelled bookings',
};

function SkeletonCard(): React.ReactElement {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonShortLine} />
        <View style={styles.skeletonTitleLine} />
        <View style={styles.skeletonMediumLine} />
        <View style={styles.skeletonMetaLine} />
      </View>
    </Animated.View>
  );
}

function LoadingSkeletons(): React.ReactElement {
  return (
    <View accessibilityElementsHidden>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

interface EmptyStateProps {
  tab: BookingTab;
}

function EmptyState({ tab }: EmptyStateProps): React.ReactElement {
  const browsePackages = useCallback(() => {
    router.push('/(tabs)/search' as never);
  }, []);

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>{EMPTY_COPY[tab]}</Text>
      {tab === 'all' ? (
        <Button
          label="Browse Packages"
          onPress={browsePackages}
          style={styles.emptyButton}
        />
      ) : null}
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cloud-offline-outline" size={32} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Bookings could not be loaded</Text>
      <Text style={styles.errorCopy}>Pull to refresh or try again.</Text>
      <Button label="Retry" variant="outline" onPress={onRetry} />
    </View>
  );
}

function AuthGuard(): React.ReactElement {
  const handleLogin = useCallback(() => {
    router.push('/(auth)/login' as never);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.guard}>
        <View style={styles.guardIcon}>
          <Ionicons name="lock-closed-outline" size={30} color={Colors.primary} />
        </View>
        <Text style={styles.guardTitle}>Login to view bookings</Text>
        <Button label="Login" onPress={handleLogin} style={styles.guardButton} />
      </View>
    </SafeAreaView>
  );
}

export default function MyBookingsScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<BookingTab>('all');
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const filter = activeTab === 'all' ? undefined : activeTab;
  const bookingsQuery = useMyBookings(filter);

  const handleRefresh = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery]);

  const handleRetry = useCallback(() => {
    void bookingsQuery.refetch();
  }, [bookingsQuery]);

  const renderBooking: ListRenderItem<BookingSummary> = useCallback(
    ({ item }) => <BookingCard booking={item} />,
    []
  );

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Bookings</Text>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {FILTER_TABS.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected ? styles.tabSelected : null,
                  pressed ? styles.tabPressed : null,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${tab.label} bookings`}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    selected ? styles.tabLabelSelected : null,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    ),
    [activeTab]
  );

  const renderEmpty = useCallback(() => {
    if (bookingsQuery.isLoading || authLoading) return <LoadingSkeletons />;
    if (bookingsQuery.isError) return <ErrorState onRetry={handleRetry} />;
    return <EmptyState tab={activeTab} />;
  }, [
    activeTab,
    authLoading,
    bookingsQuery.isError,
    bookingsQuery.isLoading,
    handleRetry,
  ]);

  if (!authLoading && !user) {
    return <AuthGuard />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={bookingsQuery.isLoading ? [] : bookingsQuery.data ?? []}
        renderItem={renderBooking}
        keyExtractor={(booking) => booking.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={bookingsQuery.isRefetching && !bookingsQuery.isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        initialNumToRender={6}
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
  listContent: {
    flexGrow: 1,
    paddingBottom: 128,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 16,
    paddingTop: 24,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  tabs: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 4,
  },
  tabSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 5,
  },
  tabPressed: {
    opacity: 0.8,
  },
  tabLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  tabLabelSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  skeletonCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 142,
    padding: 14,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  skeletonImage: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 12,
    height: 80,
    marginRight: 14,
    width: 80,
  },
  skeletonBody: {
    flex: 1,
  },
  skeletonShortLine: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 5,
    height: 10,
    marginBottom: 8,
    width: '34%',
  },
  skeletonTitleLine: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 5,
    height: 16,
    marginBottom: 8,
    width: '88%',
  },
  skeletonMediumLine: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 5,
    height: 11,
    marginBottom: 10,
    width: '55%',
  },
  skeletonMetaLine: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 5,
    height: 12,
    width: '70%',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 180,
  },
  errorCopy: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 18,
    textAlign: 'center',
  },
  guard: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  guardIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  guardTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 18,
    textAlign: 'center',
  },
  guardButton: {
    minWidth: 160,
  },
});
