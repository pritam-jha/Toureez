/**
 * @file app/(tabs)/index.tsx
 * @description NEXTTRP home screen.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { GestureResponderEvent, ListRenderItem } from 'react-native';

import { Avatar } from '../../components/ui/Avatar';
import { Chip } from '../../components/ui/Chip';
import { PackageCard } from '../../components/home/PackageCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import {
  useCategories,
  useFeaturedPackages,
  useLocations,
} from '../../hooks/useHomeData';
import { useWishlistIds } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { use3DCard, useHeartBounce, useSlideUp } from '../../utils/animations';
import type { Location, PackageListItem } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PACKAGE_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.76);
const PACKAGE_CARD_GAP = 16;
const DESTINATION_CARD_WIDTH = 155;
const DESTINATION_CARD_HEIGHT = 215;

const CATEGORY_PILLS = [
  'All',
  'Pilgrimage',
  'Adventure',
  'Leisure',
  'Honeymoon',
  'Family',
  'Wildlife',
];

interface DestinationImageRule {
  keywords: string[];
  url: string;
}

const DEFAULT_DESTINATION_IMAGE =
  'https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=600&q=80';

const DESTINATION_IMAGE_RULES: DestinationImageRule[] = [
  {
    keywords: ['srinagar', 'dal lake', 'kashmir'],
    url: 'https://images.unsplash.com/photo-1768147765107-5eef8e032a62?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['alleppey', 'alappuzha', 'kerala', 'backwater', 'backwaters', 'kumarakom'],
    url: 'https://images.unsplash.com/photo-1707893013488-51672ef83425?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['leh', 'ladakh', 'pangong', 'nubra'],
    url: 'https://images.unsplash.com/photo-1673947692587-d39df79fa52c?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['goa', 'baga', 'calangute', 'anjuna'],
    url: 'https://images.unsplash.com/photo-1757702244726-00198554c4a0?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'pushkar', 'amber', 'hawa mahal'],
    url: 'https://images.unsplash.com/photo-1743399112594-0843ea59e995?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['mumbai', 'bombay', 'gateway of india', 'marine drive'],
    url: 'https://images.unsplash.com/photo-1720151722527-706786f70a01?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['agra', 'taj mahal'],
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['delhi', 'new delhi', 'india gate'],
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
  },
  {
    keywords: ['manali', 'himachal', 'shimla', 'spiti'],
    url: 'https://images.unsplash.com/photo-1722915767859-08a59870d70b?auto=format&fit=crop&w=600&q=80',
  },
];

function normalizeDestinationText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function getDestinationImage(location: Location): string {
  const searchable = normalizeDestinationText(`${location.city} ${location.state} ${location.region}`);
  const match = DESTINATION_IMAGE_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchable.includes(keyword))
  );

  return match?.url ?? DEFAULT_DESTINATION_IMAGE;
}

function HomeSectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll: () => void;
}): React.ReactElement {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={`See all ${title}`}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

function DestinationCard({
  item,
  liked,
  onPress,
  onToggleLike,
}: {
  item: Location;
  liked: boolean;
  onPress: (location: Location) => void;
  onToggleLike: (location: Location) => void;
}): React.ReactElement {
  const card3D = use3DCard();
  const heart = useHeartBounce();

  const handleToggleLike = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    heart.trigger();
    onToggleLike(item);
  }, [heart, item, onToggleLike]);

  return (
    <Animated.View style={card3D.animatedStyle}>
      <Pressable
        style={[styles.destinationCard, Shadows.card]}
        onPress={() => onPress(item)}
        onPressIn={card3D.onPressIn}
        onPressOut={card3D.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Explore ${item.city}`}
      >
        <Image
          source={{ uri: getDestinationImage(item) }}
          style={styles.destinationImage}
          resizeMode="cover"
          accessibilityLabel={`${item.city} destination`}
        />
        <View style={styles.destinationOverlay} pointerEvents="none" />
        <View style={styles.destinationBadge}>
          <Text style={styles.destinationBadgeText}>Popular</Text>
        </View>
        <Animated.View style={[styles.destinationHeartWrap, heart.animatedStyle]}>
          <Pressable
            style={[styles.destinationHeart, Shadows.soft]}
            onPress={handleToggleLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Remove destination from wishlist' : 'Add destination to wishlist'}
            accessibilityState={{ checked: liked }}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={17}
              color={liked ? Colors.error : Colors.navy}
            />
          </Pressable>
        </Animated.View>
        <View style={styles.destinationContent}>
          <Text style={styles.destinationCity} numberOfLines={1}>
            {item.city}
          </Text>
          <Text style={styles.destinationState} numberOfLines={1}>
            {item.state}
          </Text>
          <View style={styles.destinationRating}>
            <Ionicons name="star" size={11} color={Colors.star} />
            <Text style={styles.destinationRatingText}>4.8</Text>
          </View>
        </View>
        <View style={styles.destinationStrip}>
          <Text style={styles.destinationStripText}>Explore</Text>
          <Ionicons name="arrow-forward" size={12} color={Colors.textWhite} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DestinationSkeleton(): React.ReactElement {
  return (
    <View style={styles.skeletonRow}>
      {[0, 1, 2].map((item) => (
        <SkeletonLoader
          key={item}
          width={DESTINATION_CARD_WIDTH}
          height={DESTINATION_CARD_HEIGHT}
          borderRadius={20}
          style={styles.destinationSkeleton}
        />
      ))}
    </View>
  );
}

function PackageSkeleton(): React.ReactElement {
  return (
    <View style={styles.skeletonRow}>
      {[0, 1].map((item) => (
        <SkeletonLoader
          key={item}
          width={PACKAGE_CARD_WIDTH}
          height={330}
          borderRadius={20}
          style={styles.packageSkeleton}
        />
      ))}
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const slideUp = useSlideUp();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.trim().split(' ')[0] ?? 'Traveller';
  const { data: locations, isLoading: locationsLoading, refetch: refetchLocations } = useLocations(true);
  const { refetch: refetchCategories } = useCategories();
  const { data: packages, isLoading: packagesLoading, refetch: refetchFeaturedPackages } = useFeaturedPackages();
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);
  const wishlistedDestinationIds = useWishlistStore(
    (state) => state.wishlistedDestinationIds
  );
  const toggleDestinationWishlist = useWishlistStore(
    (state) => state.toggleDestinationWishlist
  );

  useWishlistIds();

  const heroInsetStyle = useMemo(
    () => StyleSheet.create({ value: { paddingTop: insets.top + 16 } }).value,
    [insets.top]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchLocations(), refetchCategories(), refetchFeaturedPackages()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories, refetchFeaturedPackages, refetchLocations]);

  const handleSearchPress = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  const handleDestinationPress = useCallback((location: Location) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { destination: location.city, state: location.state },
    });
  }, []);

  const handleToggleDestinationLike = useCallback((location: Location) => {
    toggleDestinationWishlist(location);
  }, [toggleDestinationWishlist]);

  const handleCategoryPress = useCallback((label: string) => {
    if (label === 'All') {
      router.push('/(tabs)/search');
      return;
    }
    // Navigate to the dedicated category screen — no search bar, no recent
    // searches, just a clean package listing filtered by this category.
    router.push(`/category/${label.toLowerCase()}`);
  }, []);

  const renderCategory = useCallback(
    ({ item }: { item: string }) => (
      <Chip
        label={item}
        active={item === 'All'}
        onPress={() => handleCategoryPress(item)}
      />
    ),
    [handleCategoryPress]
  );

  const renderDestination: ListRenderItem<Location> = useCallback(
    ({ item }) => (
      <DestinationCard
        item={item}
        liked={wishlistedDestinationIds.has(item.id)}
        onPress={handleDestinationPress}
        onToggleLike={handleToggleDestinationLike}
      />
    ),
    [handleDestinationPress, handleToggleDestinationLike, wishlistedDestinationIds]
  );

  const renderPackage: ListRenderItem<PackageListItem> = useCallback(
    ({ item }) => <PackageCard item={item} width={PACKAGE_CARD_WIDTH} />,
    []
  );

  return (
    <View style={styles.root}>
      <View style={[styles.hero, heroInsetStyle]}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Ionicons name="airplane" size={13} color={Colors.primary} />
            </View>
            <Text style={styles.logo}>{firstName}</Text>
            <Text style={styles.tagline}>Travel More, Spend Less</Text>
          </View>

          <Avatar
            uri={user?.avatar_url}
            name={user?.full_name}
            size="md"
            onPress={() => router.push('/(tabs)/profile' as never)}
          />
        </View>
      </View>

      <Animated.View style={[styles.contentWrap, slideUp.animatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <FlatList
            data={CATEGORY_PILLS}
            horizontal
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            ItemSeparatorComponent={PillSeparator}
          />

          <HomeSectionHeader
            title="Popular Destinations"
            onSeeAll={handleSearchPress}
          />
          {locationsLoading ? (
            <DestinationSkeleton />
          ) : (
            <FlatList
              data={locations ?? []}
              horizontal
              renderItem={renderDestination}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destinationList}
              ItemSeparatorComponent={DestinationSeparator}
            />
          )}

          <HomeSectionHeader
            title="Trending Packages"
            onSeeAll={handleSearchPress}
          />
          {packagesLoading ? (
            <PackageSkeleton />
          ) : (
            <FlatList
              data={packages ?? []}
              horizontal
              renderItem={renderPackage}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.packageList}
              ItemSeparatorComponent={PackageSeparator}
              snapToInterval={PACKAGE_CARD_WIDTH + PACKAGE_CARD_GAP}
              decelerationRate="fast"
            />
          )}

        </ScrollView>
      </Animated.View>

      <Pressable
        style={({ pressed }) => [styles.chatFab, pressed ? styles.chatFabPressed : null]}
        onPress={() => router.push('/chat' as never)}
        accessibilityRole="button"
        accessibilityLabel="Open travel assistant chat"
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={Colors.textWhite} />
      </Pressable>
    </View>
  );
}

function PillSeparator(): React.ReactElement {
  return <View style={styles.pillSeparator} />;
}

function DestinationSeparator(): React.ReactElement {
  return <View style={styles.destinationSeparator} />;
}

function PackageSeparator(): React.ReactElement {
  return <View style={styles.packageSeparator} />;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  chatFabPressed: {
    opacity: 0.85,
  },
  hero: {
    backgroundColor: Colors.background,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  heroLeft: {
    flex: 1,
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  logo: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  contentWrap: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  pillSeparator: {
    width: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    color: Colors.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  destinationList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 12,
  },
  destinationSeparator: {
    width: 12,
  },
  destinationCard: {
    borderRadius: 20,
    height: DESTINATION_CARD_HEIGHT,
    overflow: 'hidden',
    width: DESTINATION_CARD_WIDTH,
  },
  destinationImage: {
    height: '100%',
    width: '100%',
  },
  destinationOverlay: {
    backgroundColor: Colors.overlayLight,
    bottom: 0,
    height: 96,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  destinationBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    left: 12,
    opacity: 0.9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 12,
  },
  destinationBadgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
  },
  destinationHeartWrap: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  destinationHeart: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  destinationContent: {
    bottom: 36,
    left: 0,
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  destinationCity: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  destinationState: {
    color: Colors.textWhite,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.75,
  },
  destinationRating: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  destinationRatingText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  destinationStrip: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    bottom: 0,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
  },
  destinationStripText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingLeft: 20,
    paddingTop: 12,
  },
  destinationSkeleton: {
    marginRight: 12,
  },
  packageSkeleton: {
    marginRight: PACKAGE_CARD_GAP,
  },
  packageList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 12,
  },
  packageSeparator: {
    width: PACKAGE_CARD_GAP,
  },
});
