/**
 * @file app/(tabs)/wishlist.tsx
 * @description Wishlist tab backed by the shared wishlist store and API query.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { PackageListCard } from '../../components/search/PackageListCard';
import { useWishlistPackages } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { Location } from '../../types';

interface DestinationWishlistCardProps {
  destination: Location;
  onRemove: (destinationId: string) => void;
}

function DestinationWishlistCard({
  destination,
  onRemove,
}: DestinationWishlistCardProps): React.ReactElement {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search' as never,
      params: { destination: destination.city, state: destination.state },
    });
  }, [destination.city, destination.state]);

  const handleRemove = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      onRemove(destination.id);
    },
    [destination.id, onRemove]
  );

  return (
    <Pressable
      style={[styles.destinationCard, Shadows.card]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Explore saved destination ${destination.city}`}
    >
      <View style={styles.destinationIcon}>
        <Ionicons name="location" size={22} color={Colors.primary} />
      </View>

      <View style={styles.destinationBody}>
        <Text style={styles.destinationTitle} numberOfLines={1}>
          {destination.city}
        </Text>
        <Text style={styles.destinationMeta} numberOfLines={1}>
          {[destination.state, destination.region].filter(Boolean).join(', ')}
        </Text>
      </View>

      <Pressable
        style={styles.removeButton}
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${destination.city} from wishlist`}
        hitSlop={8}
      >
        <Ionicons name="heart" size={20} color={Colors.error} />
      </Pressable>
    </Pressable>
  );
}

export default function WishlistScreen(): React.ReactElement {
  const wishlistPackagesQuery = useWishlistPackages();
  const packageCount = useWishlistStore((state) => state.wishlistedIds.size);
  const destinations = useWishlistStore((state) => state.wishlistedDestinations);
  const removeDestinationFromWishlist = useWishlistStore(
    (state) => state.removeDestinationFromWishlist
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const packages = wishlistPackagesQuery.data ?? [];
  const destinationCount = destinations.length;
  const totalCount = packageCount + destinationCount;
  const hasPackagePlaceholders =
    packageCount > 0 && packages.length === 0 && !wishlistPackagesQuery.isLoading;

  const handleBrowse = useCallback(() => {
    router.push('/(tabs)/search' as never);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await wishlistPackagesQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [wishlistPackagesQuery]);

  return (
    <ScreenWrapper withPadding={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Wishlist</Text>
            <Text style={styles.subtitle}>
              {totalCount === 0
                ? 'Save packages and destinations for later'
                : `${totalCount} saved item${totalCount === 1 ? '' : 's'}`}
            </Text>
          </View>

          {totalCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalCount}</Text>
            </View>
          ) : null}
        </View>

        {totalCount === 0 && wishlistPackagesQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading wishlist...</Text>
          </View>
        ) : null}

        {totalCount === 0 && !wishlistPackagesQuery.isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart on a package or destination to keep it here.
            </Text>
            <View style={styles.emptyButtonWrap}>
              <Button
                label="Browse packages"
                onPress={handleBrowse}
                size="small"
                variant="navy"
                fullWidth
                leftIcon={<Ionicons name="search-outline" size={16} color={Colors.textWhite} />}
                style={styles.emptyButton}
              />
            </View>
          </View>
        ) : null}

        {totalCount > 0 ? (
          <View style={styles.sections}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Packages</Text>
              <Text style={styles.sectionCount}>{packageCount}</Text>
            </View>

            {wishlistPackagesQuery.isLoading && packageCount > 0 ? (
              <View style={styles.inlineState}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.inlineStateText}>Loading saved packages...</Text>
              </View>
            ) : null}

            {wishlistPackagesQuery.isError ? (
              <View style={styles.inlineState}>
                <Ionicons name="cloud-offline-outline" size={22} color={Colors.textTertiary} />
                <Text style={styles.inlineStateText}>Saved packages could not be loaded.</Text>
                <Button
                  label="Retry"
                  variant="outline"
                  size="small"
                  onPress={() => void wishlistPackagesQuery.refetch()}
                />
              </View>
            ) : null}

            {!wishlistPackagesQuery.isLoading &&
            !wishlistPackagesQuery.isError &&
            hasPackagePlaceholders ? (
              <View style={styles.inlineState}>
                <Ionicons name="sync-outline" size={22} color={Colors.textTertiary} />
                <Text style={styles.inlineStateText}>
                  Saved packages will appear here after sync.
                </Text>
              </View>
            ) : null}

            {packages.map((pkg) => (
              <PackageListCard key={pkg.id} item={pkg} />
            ))}

            {destinationCount > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Destinations</Text>
                  <Text style={styles.sectionCount}>{destinationCount}</Text>
                </View>

                {destinations.map((destination) => (
                  <DestinationWishlistCard
                    key={destination.id}
                    destination={destination}
                    onRemove={removeDestinationFromWishlist}
                  />
                ))}
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 128,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 22,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 6,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    maxWidth: 340,
    paddingHorizontal: 20,
    paddingTop: 118,
    width: '100%',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: 18,
    width: 52,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 7,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
    maxWidth: 280,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 18,
  },
  emptyButtonWrap: {
    alignSelf: 'center',
    width: 226,
  },
  sections: {
    paddingBottom: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  sectionCount: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '700',
  },
  inlineState: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
    padding: 18,
  },
  inlineStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  destinationCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  destinationIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  destinationBody: {
    flex: 1,
  },
  destinationTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  destinationMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 2,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    marginLeft: 12,
    width: 34,
  },
});
