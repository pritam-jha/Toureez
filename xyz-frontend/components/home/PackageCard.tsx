/**
 * @file components/home/PackageCard.tsx
 * @description Reusable package card for featured and search result lists.
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
import { Colors } from '../../constants/colors';
import { useWishlistStore } from '../../store/wishlistStore';
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
  if (!url) {
    return null;
  }

  const marker = '/image/upload/';

  if (!url.includes(marker)) {
    return url;
  }

  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }

  return url.replace(
    marker,
    `${marker}c_fill,w_${width},h_${height},f_auto,q_auto/`
  );
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
    () =>
      StyleSheet.create({
        value: {
          width,
        },
      }).value,
    [width]
  );
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(item.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } =
    useToggleWishlist();
  const {
    addToCompare,
    removeFromCompare,
    isInCompare,
  } = useCompare();

  const inCompare = isInCompare(item.id);
  const coverImage = getCloudinaryUrl(item.cover_image, 900, 506);
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
    router.push({
      pathname: '/package/[id]' as never,
      params: { id: item.id },
    });
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

    if (result === 'tray_full') {
      onCompareFull?.();
    }
  }, [addToCompare, inCompare, item, onCompareFull, removeFromCompare]);

  return (
    <Pressable
      style={[styles.card, widthStyle]}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View package ${item.title}`}
    >
      <View style={styles.imageWrap}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
            accessibilityLabel={`Cover image for ${item.title}`}
          />
        ) : (
          <View
            style={styles.imageFallback}
            accessibilityLabel="Illustration of a mountain travel package"
          >
            <Ionicons name="image-outline" size={34} color={Colors.muted} />
          </View>
        )}

        {badgeLabel ? (
          <View
            style={[
              styles.badge,
              badgeLabel === 'FEATURED'
                ? styles.badgeFeatured
                : styles.badgeBestseller,
            ]}
          >
            <Text style={styles.badgeText} numberOfLines={1}>
              {badgeLabel}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={styles.wishlistButton}
          onPress={handleWishlistPress}
          disabled={isWishlistPending}
          accessibilityRole="button"
          accessibilityLabel={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
          accessibilityState={{ checked: isWishlisted, disabled: isWishlistPending }}
          hitSlop={8}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={isWishlisted ? Colors.error : Colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.companyRow}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.company.name}
          </Text>
          {item.company.is_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.secondary} />
              <Text style={styles.verifiedText} numberOfLines={1}>
                Verified
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.location.city}, {item.location.state}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.duration_days} days / {item.duration_nights} nights
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.star} />
            <Text style={styles.ratingText} numberOfLines={1}>
              {item.avg_rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewText} numberOfLines={1}>
              ({item.review_count})
            </Text>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon} numberOfLines={1}>
            {item.category.icon}
          </Text>
          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category.label}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.priceBlock}>
            {basePrice === null ? (
              <Text style={styles.priceValue} numberOfLines={1}>
                Price on request
              </Text>
            ) : discountedPrice !== null ? (
              <View style={styles.discountRow}>
                <Text style={styles.basePrice} numberOfLines={1}>
                  {formatPrice(basePrice)}
                </Text>
                <Text style={styles.priceValue} numberOfLines={1}>
                  {formatPrice(discountedPrice)}
                </Text>
              </View>
            ) : (
              <Text style={styles.priceValue} numberOfLines={1}>
                {formatPrice(basePrice)}
              </Text>
            )}
            <Text style={styles.priceCaption} numberOfLines={1}>
              per person
            </Text>
          </View>

          <Pressable
            style={[styles.compareButton, inCompare && styles.compareButtonActive]}
            onPress={handleComparePress}
            accessibilityRole="button"
            accessibilityLabel={inCompare ? 'Remove from compare' : 'Add to compare'}
            accessibilityState={{ selected: inCompare }}
          >
            <Ionicons
              name={inCompare ? 'checkmark' : 'git-compare-outline'}
              size={15}
              color={inCompare ? Colors.white : Colors.primary}
            />
            <Text
              style={[
                styles.compareText,
                inCompare && styles.compareTextActive,
              ]}
              numberOfLines={1}
            >
              {inCompare ? 'Selected' : 'Compare'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
    position: 'relative',
    width: '100%',
  },
  coverImage: {
    height: '100%',
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  badge: {
    borderRadius: 6,
    left: 10,
    maxWidth: 116,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
    top: 10,
  },
  badgeFeatured: {
    backgroundColor: Colors.primary,
  },
  badgeBestseller: {
    backgroundColor: Colors.secondary,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  wishlistButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 36,
  },
  body: {
    padding: 12,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  companyName: {
    color: Colors.textTertiary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  verifiedBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  verifiedText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    marginLeft: 3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 8,
  },
  metaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginLeft: 4,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  detailText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginLeft: 4,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ratingText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginLeft: 3,
  },
  reviewText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginLeft: 2,
  },
  categoryBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 6,
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  categoryIcon: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
    marginRight: 5,
    maxWidth: 20,
  },
  categoryText: {
    color: Colors.textSecondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  footerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBlock: {
    flex: 1,
    marginRight: 10,
  },
  discountRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  basePrice: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginRight: 6,
    textDecorationLine: 'line-through',
  },
  priceValue: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  priceCaption: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 1,
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 104,
    paddingHorizontal: 10,
  },
  compareButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  compareText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginLeft: 5,
  },
  compareTextActive: {
    color: Colors.white,
  },
});
