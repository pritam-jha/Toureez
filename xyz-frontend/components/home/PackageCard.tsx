/**
 * @file components/home/PackageCard.tsx
 * @description Premium Light 3D package card.
 *
 * - Full-bleed image top (200px) with rounded top corners
 * - White card body with multi-layer 3D shadow
 * - Inner top highlight strip (light source)
 * - Heart: white circle top-right of image with shadow
 * - Badge: navy/gold pill top-left of image
 * - Title, location (navy pin), duration, rating (gold stars), price (navy), compare
 *
 * ✅ All existing logic preserved — hooks, navigation, compare, wishlist untouched.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useCompare } from '../../hooks/useCompare';
import { useToggleWishlist } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

export interface PackageCardProps {
  item: PackageListItem;
  width: number;
  onCompareFull?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function formatPrice(amount: number): string {
  return currencyFormatter.format(amount);
}

function getCloudinaryUrl(
  url: string | null,
  width: number,
  height: number
): string | null {
  if (!url) return null;
  const marker = '/image/upload/';
  if (!url.includes(marker)) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace(marker, `${marker}c_fill,w_${width},h_${height},f_auto,q_auto/`);
}

function getBadgeLabel(item: PackageListItem): 'FEATURED' | 'BESTSELLER' | null {
  if (item.is_featured) return 'FEATURED';
  if (item.is_bestseller) return 'BESTSELLER';
  return null;
}

export function PackageCard({
  item,
  width,
  onCompareFull,
}: PackageCardProps): React.ReactElement {
  const widthStyle = useMemo(
    () => StyleSheet.create({ value: { width } }).value,
    [width]
  );

  const isWishlisted = useWishlistStore((state) => state.isWishlisted(item.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } = useToggleWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const inCompare = isInCompare(item.id);
  const coverImage = getCloudinaryUrl(item.cover_image, 900, 600);
  const badgeLabel = getBadgeLabel(item);
  const firstPricing = item.pricing[0] ?? null;
  const basePrice = firstPricing?.base_price ?? null;
  const discountedPrice =
    firstPricing?.discounted_price !== null &&
    firstPricing?.discounted_price !== undefined &&
    basePrice !== null &&
    firstPricing.discounted_price < basePrice
      ? firstPricing.discounted_price
      : null;

  const handleCardPress = useCallback(() => {
    router.push({ pathname: '/package/[id]' as never, params: { id: item.id } });
  }, [item.id]);

  const handleWishlistPress = useCallback(() => {
    toggleWishlist({ packageId: item.id });
  }, [item.id, toggleWishlist]);

  const handleComparePress = useCallback(() => {
    if (inCompare) {
      removeFromCompare(item.id);
      return;
    }
    const result = addToCompare(item);
    if (result === 'tray_full') onCompareFull?.();
  }, [addToCompare, inCompare, item, onCompareFull, removeFromCompare]);

  return (
    <Pressable
      style={[styles.card, widthStyle]}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View package ${item.title}`}
    >
      {/* ── Image ── */}
      <View style={styles.imageWrap}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
            accessibilityLabel={`Cover image for ${item.title}`}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
          </View>
        )}

        {/* Subtle dark gradient at bottom of image for text legibility */}
        <View style={styles.imageGradient} pointerEvents="none" />

        {/* Badge top-left */}
        {badgeLabel ? (
          <View
            style={[
              styles.badge,
              badgeLabel === 'FEATURED' ? styles.badgeFeatured : styles.badgeBestseller,
            ]}
          >
            {badgeLabel === 'FEATURED' ? (
              <Ionicons name="star" size={9} color={Colors.white} style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="flame" size={9} color={Colors.gold} style={{ marginRight: 4 }} />
            )}
            <Text style={[
              styles.badgeText,
              badgeLabel === 'FEATURED' ? styles.badgeTextFeatured : styles.badgeTextBestseller,
            ]}>
              {badgeLabel}
            </Text>
          </View>
        ) : null}

        {/* Wishlist heart top-right */}
        <Pressable
          style={[styles.wishlistButton, isWishlisted && styles.wishlistButtonActive]}
          onPress={handleWishlistPress}
          disabled={isWishlistPending}
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          accessibilityState={{ checked: isWishlisted, disabled: isWishlistPending }}
          hitSlop={8}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={17}
            color={isWishlisted ? Colors.wishlistActive : Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* ── Card Body ── */}
      <View style={styles.body}>
        {/* Inner top highlight — 3D light source */}
        <View style={styles.bodyTopEdge} pointerEvents="none" />

        {/* Category chip */}
        {item.category?.label ? (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{item.category.icon} {item.category.label}</Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location.city}, {item.location.state}
          </Text>
        </View>

        {/* Duration + Group size */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Ionicons name="time-outline" size={11} color={Colors.primary} />
            </View>
            <Text style={styles.metaText}>
              {item.duration_days}D / {item.duration_nights}N
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <View style={styles.metaIconWrap}>
              <Ionicons name="people-outline" size={11} color={Colors.primary} />
            </View>
            <Text style={styles.metaText}>
              {item.min_group_size}–{item.max_group_size} pax
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(item.avg_rating) ? 'star' : 'star-outline'}
              size={11}
              color={Colors.star}
            />
          ))}
          <Text style={styles.ratingText}>
            {item.avg_rating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>({item.review_count})</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Price + Compare */}
        <View style={styles.footerRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceFrom}>Starting from</Text>
            {basePrice === null ? (
              <Text style={styles.priceValue}>On request</Text>
            ) : discountedPrice !== null ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceStrike}>{formatPrice(basePrice)}</Text>
                <Text style={styles.priceValue}>{formatPrice(discountedPrice)}</Text>
              </View>
            ) : (
              <Text style={styles.priceValue}>{formatPrice(basePrice)}</Text>
            )}
            <Text style={styles.pricePer}>per person</Text>
          </View>

          <Pressable
            style={[styles.compareButton, inCompare && styles.compareButtonActive]}
            onPress={handleComparePress}
            accessibilityRole="button"
            accessibilityLabel={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            <Ionicons
              name={inCompare ? 'checkmark' : 'git-compare-outline'}
              size={12}
              color={inCompare ? Colors.white : Colors.primary}
            />
            <Text style={[styles.compareText, inCompare && styles.compareTextActive]}>
              {inCompare ? 'Added' : 'Compare'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    // Premium 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  imageWrap: {
    height: 200,
    backgroundColor: Colors.backgroundLayer3,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLayer2,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(15,21,53,0.35)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeFeatured: {
    backgroundColor: Colors.primary,
  },
  badgeBestseller: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badgeTextFeatured: {
    color: Colors.white,
  },
  badgeTextBestseller: {
    color: Colors.gold,
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  wishlistButtonActive: {
    backgroundColor: 'rgba(229,62,62,0.08)',
  },
  body: {
    padding: 16,
    backgroundColor: Colors.surfacePrimary,
    position: 'relative',
  },
  bodyTopEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 5,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceBlock: {
    flex: 1,
  },
  priceFrom: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 2,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceStrike: {
    fontSize: 12,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  pricePer: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
    fontWeight: '500',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
    backgroundColor: Colors.backgroundLayer2,
  },
  compareButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compareText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  compareTextActive: {
    color: Colors.white,
  },
});
