/**
 * @file app/package/[id].tsx
 * @description Package detail screen.
 *
 * Layout: ScrollView with all sections stacked vertically.
 * StickyActionBar is absolutely positioned outside the ScrollView
 * and animates in once the pricing section scrolls off screen.
 *
 * State owned here:
 * - selectedTierId: which pricing tier the user has tapped
 * - pricingVisible: drives the sticky bar slide-in animation
 * - toast: "Enquire Now" coming-soon message
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PhotoGallery } from '../../components/package/PhotoGallery';
import { PackageHeader } from '../../components/package/PackageHeader';
import { PricingSection } from '../../components/package/PricingSection';
import { HighlightsSection } from '../../components/package/HighlightsSection';
import { ItinerarySection } from '../../components/package/ItinerarySection';
import { InclusionsSection } from '../../components/package/InclusionsSection';
import { AmenitiesSection } from '../../components/package/AmenitiesSection';
import { CompanySection } from '../../components/package/CompanySection';
import { StickyActionBar } from '../../components/package/StickyActionBar';
import { ReviewsList } from '../../components/reviews/ReviewsList';
import { Toast } from '../../components/ui/Toast';
import { usePackageDetail } from '../../hooks/usePackage';
import { useCompare } from '../../hooks/useCompare';
import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function useShimmer(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonBlock({
  height,
  width = '100%',
  borderRadius = 8,
  marginBottom = 10,
}: {
  height: number;
  width?: string | number;
  borderRadius?: number;
  marginBottom?: number;
}): React.ReactElement {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        skeletonStyles.block,
        { height, width, borderRadius, marginBottom, opacity },
      ]}
      accessibilityElementsHidden
    />
  );
}

function DetailSkeleton(): React.ReactElement {
  return (
    <View style={skeletonStyles.container}>
      {/* Gallery */}
      <SkeletonBlock height={260} borderRadius={0} marginBottom={0} />
      {/* Header */}
      <View style={skeletonStyles.section}>
        <SkeletonBlock height={14} width="40%" marginBottom={12} />
        <SkeletonBlock height={28} width="90%" marginBottom={8} />
        <SkeletonBlock height={20} width="60%" marginBottom={12} />
        <SkeletonBlock height={16} width="50%" marginBottom={8} />
        <SkeletonBlock height={16} width="70%" marginBottom={0} />
      </View>
      {/* Pricing */}
      <View style={skeletonStyles.section}>
        <SkeletonBlock height={20} width="50%" marginBottom={14} />
        <View style={skeletonStyles.row}>
          <SkeletonBlock height={120} width={160} marginBottom={0} />
          <View style={{ width: 12 }} />
          <SkeletonBlock height={120} width={160} marginBottom={0} />
        </View>
      </View>
      {/* Highlights */}
      <View style={skeletonStyles.section}>
        <SkeletonBlock height={20} width="50%" marginBottom={14} />
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} height={16} width={`${75 + (i % 3) * 8}%`} marginBottom={10} />
        ))}
      </View>
      {/* Itinerary */}
      <View style={skeletonStyles.section}>
        <SkeletonBlock height={20} width="60%" marginBottom={14} />
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} height={52} marginBottom={8} />
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBase,
  },
  section: {
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    padding: 16,
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
  },
  block: {
    backgroundColor: Colors.backgroundLayer2,
  },
});

// ── Error states ──────────────────────────────────────────────────────────────

function NotFoundState(): React.ReactElement {
  return (
    <SafeAreaView style={errorStyles.safeArea} edges={['top', 'left', 'right']}>
      <View style={errorStyles.container}>
        <Ionicons name="map-outline" size={48} color={Colors.textTertiary} />
        <Text style={errorStyles.title} numberOfLines={1}>
          Package not found
        </Text>
        <Text style={errorStyles.subtitle} numberOfLines={2}>
          This package may have been removed or is no longer available.
        </Text>
        <Pressable
          style={errorStyles.button}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={errorStyles.buttonText} numberOfLines={1}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <SafeAreaView style={errorStyles.safeArea} edges={['top', 'left', 'right']}>
      <View style={errorStyles.container}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={errorStyles.title} numberOfLines={1}>
          Something went wrong
        </Text>
        <Text style={errorStyles.subtitle} numberOfLines={2}>
          We couldn't load this package. Please check your connection and try again.
        </Text>
        <Pressable
          style={errorStyles.button}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={errorStyles.buttonText} numberOfLines={1}>Retry</Text>
        </Pressable>
        <Pressable
          style={errorStyles.backLink}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Text style={errorStyles.backLinkText} numberOfLines={1}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const errorStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

// ── Detail content ────────────────────────────────────────────────────────────

interface DetailContentProps {
  pkg: PackageDetail;
}

function DetailContent({ pkg }: DetailContentProps): React.ReactElement {
  const { addToCompare, removeFromCompare, isInCompare, isTrayFull } = useCompare();

  // Selected pricing tier — default to first active tier
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    () => pkg.pricing[0]?.id ?? null
  );

  // Whether the pricing section is still visible (drives sticky bar)
  const [pricingVisible, setPricingVisible] = useState(true);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  // Pricing section layout Y position in the scroll view
  const pricingSectionY = useRef(0);

  const selectedTier = useMemo(
    () => pkg.pricing.find((t) => t.id === selectedTierId) ?? null,
    [pkg.pricing, selectedTierId]
  );

  const inCompare = isInCompare(pkg.id);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectTier = useCallback(
    (tier: PackageDetail['pricing'][number]) => {
      setSelectedTierId(tier.id);
    },
    []
  );

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const scrollY = e.nativeEvent.contentOffset.y;
      // Pricing section scrolls off when scroll passes its bottom edge (~300px below its top)
      const pricingBottom = pricingSectionY.current + 300;
      setPricingVisible(scrollY < pricingBottom);
    },
    []
  );

  const handleComparePress = useCallback(() => {
    if (inCompare) {
      removeFromCompare(pkg.id);
      return;
    }

    // Build a PackageListItem-compatible shape from PackageDetail
    const listItem = {
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
      cover_image: pkg.images.find((i) => i.is_cover)?.url ?? pkg.images[0]?.url ?? null,
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
      pricing: pkg.pricing.map((p) => ({
        base_price: p.base_price,
        discounted_price: p.discounted_price,
        currency: p.currency,
      })),
      badges: [],
    };

    const result = addToCompare(listItem);

    if (result === 'tray_full') {
      setToast({
        visible: true,
        message: 'Compare tray is full. Remove a package to add another.',
        type: 'info',
      });
    } else if (result === 'added') {
      setToast({
        visible: true,
        message: `${pkg.title} added to compare.`,
        type: 'success',
      });
    }
  }, [addToCompare, inCompare, pkg, removeFromCompare]);

  const handleEnquirePress = useCallback(() => {
    if (!selectedTier) {
      setToast({
        visible: true,
        message: 'Please select a pricing tier first.',
        type: 'info',
      });
      return;
    }
    router.push({
      pathname: '/booking/[packageId]' as never,
      params: { packageId: pkg.id },
    });
  }, [pkg.id, selectedTier]);

  const handleToastHide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Photo gallery — no horizontal padding, full bleed */}
        <PhotoGallery
          images={pkg.images}
          packageTitle={pkg.title}
          packageId={pkg.id}
        />

        {/* 2. Package header */}
        <PackageHeader pkg={pkg} />

        {/* 3. Pricing — capture Y position for sticky bar trigger */}
        <View
          onLayout={(e) => {
            pricingSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <PricingSection
            pricing={pkg.pricing}
            selectedTierId={selectedTierId}
            onSelectTier={handleSelectTier}
          />
        </View>

        {/* 4. Highlights */}
        <HighlightsSection highlights={pkg.highlights} />

        {/* 5. Itinerary */}
        <ItinerarySection itineraries={pkg.itineraries} />

        {/* 6. Inclusions & Exclusions */}
        <InclusionsSection
          inclusions={pkg.inclusions}
          exclusions={pkg.exclusions}
        />

        {/* 7. Amenities */}
        <AmenitiesSection amenities={pkg.amenities} />

        {/* 8. Company */}
        <CompanySection company={pkg.company} />

        {/* 9. Reviews & Ratings */}
        <ReviewsList packageId={pkg.id} />

        {/* Bottom padding so last section clears the sticky bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 9. Sticky action bar */}
      <StickyActionBar
        selectedTier={selectedTier}
        pricingVisible={pricingVisible}
        isTrayFull={isTrayFull}
        isInCompare={inCompare}
        onComparePress={handleComparePress}
        onEnquirePress={handleEnquirePress}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={handleToastHide}
      />
    </View>
  );
}

// ── Screen root ───────────────────────────────────────────────────────────────

export default function PackageDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const packageId = Array.isArray(id) ? id[0] : (id ?? '');

  const { data, isLoading, isError, error, refetch } =
    usePackageDetail(packageId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    const isNotFound =
      error?.message?.toLowerCase().includes('not found') ||
      error?.message?.includes('404');

    if (isNotFound) {
      return <NotFoundState />;
    }

    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <DetailContent pkg={data} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bottomPadding: {
    height: 120,
  },
});
