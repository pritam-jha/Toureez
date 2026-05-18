/**
 * @file app/(tabs)/index.tsx
 * @description Home screen for XYZ package discovery.
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
import { SearchBar } from '../../components/home/SearchBar';
import {
  useCategories,
  useFeaturedPackages,
  useLocations,
} from '../../hooks/useHomeData';
import { useAuth } from '../../hooks/useAuth';
import { useWishlistIds } from '../../hooks/useWishlist';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';

export default function HomeScreen(): React.ReactElement {
  const { user } = useAuth();
  const { refetch: refetchLocations } = useLocations(true);
  const { refetch: refetchCategories } = useCategories();
  const { refetch: refetchFeaturedPackages } = useFeaturedPackages();
  const [refreshing, setRefreshing] = useState(false);

  useWishlistIds();

  const locationLabel = useMemo(() => {
    if (user?.city && user.state) {
      return `${user.city}, ${user.state}`;
    }

    return user?.city ?? null;
  }, [user?.city, user?.state]);

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
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.logo} numberOfLines={1}>
              {Config.appName}
            </Text>
            {locationLabel ? (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={Colors.textSecondary}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
              </View>
            ) : (
              <Text style={styles.locationFallback} numberOfLines={1}>
                Compare travel packages across India
              </Text>
            )}
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={handleNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            hitSlop={8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </Pressable>
        </View>

        <SearchBar />
        <PopularLocations />
        <CategoryRow />
        <FeaturedPackages />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 18,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  logo: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 4,
  },
  locationFallback: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bottomSpacer: {
    height: 104,
  },
});
