/**
 * @file app/package/[id].tsx
 * @description NEXTTRP package detail screen.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StarRating } from '../../components/ui/StarRating';
import { ReviewsList } from '../../components/reviews/ReviewsList';
import { Toast } from '../../components/ui/Toast';
import { usePackageDetail } from '../../hooks/usePackage';
import { useCompare } from '../../hooks/useCompare';
import { useToggleWishlist } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { useHeartBounce, useSlideUp } from '../../utils/animations';
import type { PackageDetail, PackageListItem } from '../../types';

const PHOTO_HEIGHT = 300;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}

function buildCompareItem(pkg: PackageDetail): PackageListItem {
  return {
    id: pkg.id,
    company_id: pkg.company_id,
    location_id: pkg.location_id,
    category_id: pkg.category_id,
    title: pkg.title,
    slug: pkg.slug,
    description: pkg.description,
    highlights: pkg.highlights,
    duration_days: pkg.duration_days,
    duration_nights: pkg.duration_nights,
    min_group_size: pkg.min_group_size,
    max_group_size: pkg.max_group_size,
    inclusions: pkg.inclusions,
    exclusions: pkg.exclusions,
    amenities: pkg.amenities,
    status: pkg.status,
    is_featured: pkg.is_featured,
    is_bestseller: pkg.is_bestseller,
    avg_rating: pkg.avg_rating,
    review_count: pkg.review_count,
    total_bookings: pkg.total_bookings,
    created_at: pkg.created_at,
    updated_at: pkg.updated_at,
    cover_image: pkg.images.find((image) => image.is_cover)?.url ?? pkg.images[0]?.url ?? null,
    company: {
      id: pkg.company.id,
      name: pkg.company.name,
      logo_url: pkg.company.logo_url,
      is_verified: pkg.company.is_verified,
    },
    location: {
      id: pkg.location.id,
      city: pkg.location.city,
      state: pkg.location.state,
    },
    category: {
      id: pkg.category.id,
      name: pkg.category.name,
      label: pkg.category.label,
      icon: pkg.category.icon,
    },
    pricing: pkg.pricing.map((tier) => ({
      base_price: tier.base_price,
      discounted_price: tier.discounted_price,
      currency: tier.currency,
    })),
    badges: [],
  };
}

function DetailSkeleton(): React.ReactElement {
  return (
    <View style={styles.skeletonRoot}>
      <SkeletonLoader height={PHOTO_HEIGHT} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <SkeletonLoader width="40%" height={14} />
        <SkeletonLoader width="90%" height={28} style={styles.skeletonGap} />
        <SkeletonLoader width="70%" height={18} style={styles.skeletonGap} />
        <SkeletonLoader width="100%" height={90} style={styles.skeletonGapLarge} />
      </View>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>We couldn't load this package.</Text>
        <Button label="Retry" onPress={onRetry} />
        <Button label="Go Back" variant="ghost" onPress={() => router.back()} style={styles.backLinkButton} />
      </View>
    </SafeAreaView>
  );
}

type DetailTab = 'overview' | 'itinerary' | 'inclusions' | 'reviews';

function DetailContent({ pkg }: { pkg: PackageDetail }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const slideUp = useSlideUp();
  const heart = useHeartBounce();
  const { addToCompare, removeFromCompare, isInCompare, isTrayFull } = useCompare();
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(pkg.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } = useToggleWishlist();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  const heroImage = pkg.images.find((image) => image.is_cover)?.url ?? pkg.images[0]?.url ?? null;
  const tier = pkg.pricing[0] ?? null;
  const price = tier ? tier.discounted_price ?? tier.base_price : null;
  const inCompare = isInCompare(pkg.id);
  const compareDisabled = isTrayFull && !inCompare;
  const topControlsStyle = useMemo(
    () => StyleSheet.create({ value: { top: insets.top + 12 } }).value,
    [insets.top]
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${pkg.title} on NEXTTRP - Travel More, Spend Less\nnexttrp://package/${pkg.id}`,
        title: pkg.title,
      });
    } catch {
      // Share cancelled.
    }
  }, [pkg.title, pkg.id]);

  const handleWishlist = useCallback(() => {
    heart.trigger();
    toggleWishlist({ packageId: pkg.id });
  }, [heart, pkg.id, toggleWishlist]);

  const handleCompare = useCallback(() => {
    if (inCompare) {
      removeFromCompare(pkg.id);
      return;
    }
    const result = addToCompare(buildCompareItem(pkg));
    if (result === 'tray_full') {
      setToast({
        visible: true,
        message: 'Compare tray is full. Remove a package to add another.',
        type: 'info',
      });
    }
  }, [addToCompare, inCompare, pkg, removeFromCompare]);

  const handleBook = useCallback(() => {
    router.push({ pathname: '/booking/[packageId]' as never, params: { packageId: pkg.id } });
  }, [pkg.id]);

  const handleEnquire = useCallback(() => {
    router.push({
      pathname: '/enquiry/new' as never,
      params: { packageId: pkg.id, packageTitle: pkg.title },
    });
  }, [pkg.id, pkg.title]);

  const renderTabContent = (): React.ReactElement => {
    if (activeTab === 'itinerary') {
      return (
        <View style={styles.tabPanel}>
          {pkg.itineraries.length > 0 ? (
            pkg.itineraries.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineBadge}>
                  <Text style={styles.timelineBadgeText}>{item.day_number}</Text>
                </View>
                <View style={styles.timelineTextWrap}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  {item.description ? <Text style={styles.bodyText}>{item.description}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.bodyText}>Itinerary details will be shared by the operator.</Text>
          )}
        </View>
      );
    }

    if (activeTab === 'inclusions') {
      return (
        <View style={styles.tabPanel}>
          <Text style={styles.panelTitle}>Included</Text>
          {pkg.inclusions.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={17} color={Colors.success} />
              <Text style={styles.bodyText}>{item}</Text>
            </View>
          ))}
          <Text style={styles.panelTitle}>Excluded</Text>
          {pkg.exclusions.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Ionicons name="close-circle" size={17} color={Colors.error} />
              <Text style={styles.bodyText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'reviews') {
      return <ReviewsList packageId={pkg.id} />;
    }

    return (
      <View style={styles.tabPanel}>
        <Text style={styles.bodyText}>
          {pkg.description || 'A curated travel experience from a verified operator.'}
        </Text>
        {pkg.highlights.length > 0 ? (
          <>
            <Text style={styles.panelTitle}>Highlights</Text>
            {pkg.highlights.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Ionicons name="sparkles-outline" size={17} color={Colors.primary} />
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoWrap}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons name="image-outline" size={48} color={Colors.textLight} />
            </View>
          )}
          <View style={[styles.topControls, topControlsStyle]}>
            <Pressable
              style={[styles.circleButton, Shadows.soft]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.navy} />
            </Pressable>
            <View style={styles.topRightControls}>
              <Pressable
                style={[styles.circleButton, Shadows.soft]}
                onPress={() => void handleShare()}
                accessibilityRole="button"
                accessibilityLabel="Share package"
              >
                <Ionicons name="share-outline" size={20} color={Colors.navy} />
              </Pressable>
              <Animated.View style={heart.animatedStyle}>
                <Pressable
                  style={[styles.circleButton, Shadows.soft]}
                  onPress={handleWishlist}
                  disabled={isWishlistPending}
                  accessibilityRole="button"
                  accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  accessibilityState={{ checked: isWishlisted, disabled: isWishlistPending }}
                >
                  <Ionicons
                    name={isWishlisted ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isWishlisted ? Colors.error : Colors.navy}
                  />
                </Pressable>
              </Animated.View>
            </View>
          </View>
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>1 / {Math.max(pkg.images.length, 1)}</Text>
          </View>
        </View>

        <Animated.View style={[styles.contentCard, slideUp.animatedStyle]}>
          <View style={styles.badgesRow}>
            {pkg.is_featured ? <Badge type="FEATURED" /> : null}
            {pkg.is_bestseller ? <Badge type="BESTSELLER" /> : null}
            {pkg.company.is_verified ? <Badge type="VERIFIED" /> : null}
          </View>

          <Text style={styles.title}>{pkg.title}</Text>

          <View style={styles.locationRatingRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={15} color={Colors.primary} />
              <Text style={styles.locationText}>
                {pkg.location.city}, {pkg.location.state}
              </Text>
            </View>
            <View style={styles.ratingGroup}>
              <StarRating rating={pkg.avg_rating} size={14} />
              <Text style={styles.ratingValue}>{pkg.avg_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({pkg.review_count})</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsPills}
          >
            <View style={styles.statPill}>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
              <Text style={styles.statPillText}>{pkg.duration_days} Days</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="people-outline" size={14} color={Colors.primary} />
              <Text style={styles.statPillText}>{pkg.min_group_size}-{pkg.max_group_size} People</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
              <Text style={styles.statPillText}>{pkg.category.label}</Text>
            </View>
          </ScrollView>

          <View style={styles.tabs}>
            {DETAIL_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabButton}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
                </Pressable>
              );
            })}
          </View>

          {renderTabContent()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.stickyBottom, Shadows.soft]}>
        <View style={styles.bottomPrice}>
          <Text style={styles.stickyPrice}>{price !== null ? formatPrice(price) : 'On request'}</Text>
          <Text style={styles.stickyPerPerson}>per person</Text>
        </View>
        <Pressable
          style={styles.enquireButton}
          onPress={handleEnquire}
          accessibilityRole="button"
          accessibilityLabel="Enquire about this package"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
        </Pressable>
        <Button
          label="Compare"
          variant="outline"
          onPress={handleCompare}
          disabled={compareDisabled}
          size="small"
          style={styles.compareButton}
        />
        <Button
          label="Book Now"
          variant="navy"
          onPress={handleBook}
          size="small"
          style={styles.bookButton}
        />
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </View>
  );
}

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'inclusions', label: 'Inclusions' },
  { key: 'reviews', label: 'Reviews' },
];

export default function PackageDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  const rawId = params.id;
  const packageId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] ?? '' : '';
  const { data, isLoading, isError, refetch } = usePackageDetail(packageId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <DetailContent pkg={data} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 116,
  },
  photoWrap: {
    backgroundColor: Colors.backgroundSoft,
    height: PHOTO_HEIGHT,
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  photoFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  topControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  imageCounter: {
    backgroundColor: Colors.navy,
    borderRadius: 999,
    bottom: 38,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    right: 16,
  },
  imageCounterText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  contentCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: Colors.navy,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29,
  },
  locationRatingRow: {
    gap: 8,
    marginTop: 10,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 14,
  },
  ratingGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ratingValue: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCount: {
    color: Colors.textLight,
    fontSize: 13,
  },
  statsPills: {
    gap: 8,
    paddingTop: 16,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statPillText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabs: {
    borderBottomColor: Colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginTop: 20,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 2,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    paddingBottom: 10,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabUnderline: {
    backgroundColor: Colors.transparent,
    borderRadius: 2,
    height: 3,
    width: '70%',
  },
  tabUnderlineActive: {
    backgroundColor: Colors.primary,
  },
  tabPanel: {
    paddingTop: 16,
  },
  bodyText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  panelTitle: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  timelineBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  timelineBadgeText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineTitle: {
    color: Colors.navy,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stickyBottom: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    left: 0,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  bottomPrice: {
    flex: 1,
  },
  stickyPrice: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  stickyPerPerson: {
    color: Colors.textLight,
    fontSize: 11,
  },
  enquireButton: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  compareButton: {
    minWidth: 92,
  },
  bookButton: {
    minWidth: 104,
  },
  skeletonRoot: {
    flex: 1,
  },
  skeletonContent: {
    padding: 20,
  },
  skeletonGap: {
    marginTop: 12,
  },
  skeletonGapLarge: {
    marginTop: 18,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: Colors.navy,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  backLinkButton: {
    marginTop: 8,
  },
});
