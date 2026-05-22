/**
 * @file app/(tabs)/index.tsx
 * @description Home screen — Premium Light 3D design.
 * Warm white background, deep navy headings, gold accents, 3D card depth.
 * All hooks, stores, and API calls preserved.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CategoryRow } from '../../components/home/CategoryRow';
import { FeaturedPackages } from '../../components/home/FeaturedPackages';
import { PopularLocations } from '../../components/home/PopularLocations';
import {
  useCategories,
  useFeaturedPackages,
  useLocations,
} from '../../hooks/useHomeData';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useWishlistIds } from '../../hooks/useWishlist';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';

export default function HomeScreen(): React.ReactElement {
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const { refetch: refetchLocations } = useLocations(true);
  const { refetch: refetchCategories } = useCategories();
  const { refetch: refetchFeaturedPackages } = useFeaturedPackages();
  const [refreshing, setRefreshing] = useState(false);

  useWishlistIds();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = useMemo(() => {
    if (!user?.full_name) return null;
    return user.full_name.split(' ')[0] ?? null;
  }, [user?.full_name]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchLocations(),
        refetchCategories(),
        refetchFeaturedPackages(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchFeaturedPackages, refetchLocations]);

  const handleNotificationsPress = useCallback(() => {
    router.push('/notifications' as never);
  }, []);

  const handleSearchFocus = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting}{firstName ? `, ${firstName}` : ''} 👋
            </Text>
            <Text style={styles.heading} numberOfLines={2}>
              Discover India's{'\n'}Best Trips
            </Text>
          </View>

          {/* Notification bell */}
          <Pressable
            style={styles.notifButton}
            onPress={handleNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            hitSlop={8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.textPrimary}
            />
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText} numberOfLines={1}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* ── Search Bar — 3D elevated pill ── */}
        <Pressable
          style={styles.searchBar}
          onPress={handleSearchFocus}
          accessibilityRole="button"
          accessibilityLabel="Search destinations"
        >
          <View style={styles.searchIconWrap}>
            <Ionicons name="search-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.searchPlaceholder}>
            Where do you want to go?
          </Text>
          <View style={styles.searchCta}>
            <Text style={styles.searchCtaText}>Search</Text>
          </View>
        </Pressable>

        {/* ── Popular Destinations ── */}
        <PopularLocations />

        {/* ── Browse by Category ── */}
        <CategoryRow />

        {/* ── Trending Packages ── */}
        <FeaturedPackages />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  notifButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
    // 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.error,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.backgroundBase,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },

  // ── Search Bar ───────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
    // 3D depth shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  searchCta: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    // Button glow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  searchCtaText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  bottomSpacer: {
    height: 104,
  },
});
