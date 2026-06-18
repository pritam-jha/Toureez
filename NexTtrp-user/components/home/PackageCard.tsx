/**
 * @file components/home/PackageCard.tsx
 * @description Toureez trending package card.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Badge } from '../ui/Badge';
import { StarRating } from '../ui/StarRating';
import { useCompare } from '../../hooks/useCompare';
import { useToggleWishlist } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { use3DCard, useHeartBounce } from '../../utils/animations';
import { getPackageKeywordImage, PACKAGE_DEFAULT_IMAGE } from '../../utils/packageImages';
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

function getBadge(item: PackageListItem): 'FEATURED' | 'BESTSELLER' | null {
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
    () => StyleSheet.create({ cardWidth: { width } }).cardWidth,
    [width]
  );
  const card3D = use3DCard();
  const heartBounce = useHeartBounce();

  const isWishlisted = useWishlistStore((state) => state.isWishlisted(item.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } = useToggleWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const inCompare = isInCompare(item.id);
  const badge = getBadge(item);
  const firstPricing = item.pricing[0] ?? null;
  const basePrice = firstPricing?.base_price ?? null;
  const discountedPrice =
    firstPricing?.discounted_price !== null &&
    firstPricing?.discounted_price !== undefined &&
    basePrice !== null &&
    firstPricing.discounted_price < basePrice
      ? firstPricing.discounted_price
      : null;
  const finalPrice = discountedPrice ?? basePrice;

  /**
   * Image priority order — guarantees the correct destination photo is shown:
   *   [0] Keyword-matched destination image  → always the right location
   *   [1] Cloudinary cover_image from DB     → only if no keyword match
   *   [2] PACKAGE_DEFAULT_IMAGE             → last resort, never blank
   *
   * On each onError we advance to the next source so no card ever shows gray.
   */
  const imageSources = useMemo((): string[] => {
    const sources: string[] = [];
    const keywordImage = getPackageKeywordImage(item);
    const cloudinaryImage = getCloudinaryUrl(item.cover_image, 900, 600);
    if (keywordImage) sources.push(keywordImage);
    if (cloudinaryImage && cloudinaryImage !== keywordImage) sources.push(cloudinaryImage);
    sources.push(PACKAGE_DEFAULT_IMAGE);
    return sources;
  }, [item]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [item.id]);

  const coverImage = imageSources[Math.min(imageIndex, imageSources.length - 1)];

  const handleImageError = useCallback(() => {
    setImageIndex((prev) => prev + 1);
  }, []);

  const handleCardPress = useCallback(() => {
    router.push({ pathname: '/package/[id]' as never, params: { id: item.id } });
  }, [item.id]);

  const handleWishlistPress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    heartBounce.trigger();
    toggleWishlist({ packageId: item.id });
  }, [heartBounce, item.id, toggleWishlist]);

  const handleComparePress = useCallback(() => {
    if (inCompare) {
      removeFromCompare(item.id);
      return;
    }
    const result = addToCompare(item);
    if (result === 'tray_full') onCompareFull?.();
  }, [addToCompare, inCompare, item, onCompareFull, removeFromCompare]);

  return (
    <Animated.View style={[card3D.animatedStyle, widthStyle]}>
      <Pressable
        style={[styles.card, Shadows.card]}
        onPress={handleCardPress}
        onPressIn={card3D.onPressIn}
        onPressOut={card3D.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`View package ${item.title}`}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
            accessibilityLabel={`Cover image for ${item.title}`}
            onError={handleImageError}
          />

          <View style={styles.imageScrim} pointerEvents="none" />

          {badge ? (
            <View style={styles.badgeWrap}>
              <Badge type={badge} />
            </View>
          ) : null}

          <Animated.View style={[styles.wishlistWrap, heartBounce.animatedStyle]}>
            <Pressable
              style={[styles.wishlistButton, Shadows.soft]}
              onPress={handleWishlistPress}
              disabled={isWishlistPending}
              accessibilityRole="button"
              accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              accessibilityState={{ checked: isWishlisted, disabled: isWishlistPending }}
              hitSlop={HIT_SLOP}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={isWishlisted ? Colors.error : Colors.navy}
              />
            </Pressable>
          </Animated.View>

          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>
              {item.category.label}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location.city}, {item.location.state}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.statText} numberOfLines={1}>
                {item.duration_days}D/{item.duration_nights}N
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.statText} numberOfLines={1}>
                {item.min_group_size}-{item.max_group_size}
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <StarRating rating={item.avg_rating} size={13} />
            <Text style={styles.ratingValue}>{item.avg_rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.review_count})</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <View style={styles.priceBlock}>
              {finalPrice === null ? (
                <Text style={styles.priceValue}>On request</Text>
              ) : (
                <>
                  <Text style={styles.priceValue}>{formatPrice(finalPrice)}</Text>
                  <Text style={styles.perPerson}>per person</Text>
                  {discountedPrice !== null && basePrice !== null ? (
                    <Text style={styles.priceStrike}>{formatPrice(basePrice)}</Text>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.compareButton, inCompare && styles.compareButtonActive]}
                onPress={handleComparePress}
                accessibilityRole="button"
                accessibilityLabel={inCompare ? 'Remove from compare' : 'Add to compare'}
              >
                <Ionicons
                  name={inCompare ? 'checkmark' : 'git-compare-outline'}
                  size={13}
                  color={inCompare ? Colors.textWhite : Colors.primary}
                />
              </Pressable>
              <Pressable
                style={styles.bookButton}
                onPress={handleCardPress}
                accessibilityRole="button"
                accessibilityLabel={`Book ${item.title}`}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const HIT_SLOP = {
  bottom: 8,
  left: 8,
  right: 8,
  top: 8,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageWrap: {
    backgroundColor: Colors.backgroundSoft,
    height: 185,
    position: 'relative',
  },
  coverImage: {
    height: '100%',
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    flex: 1,
    justifyContent: 'center',
  },
  imageScrim: {
    backgroundColor: Colors.overlayLight,
    bottom: 0,
    height: 78,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  badgeWrap: {
    left: 12,
    position: 'absolute',
    top: 12,
  },
  wishlistWrap: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  wishlistButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  categoryPill: {
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
  },
  categoryPillText: {
    color: Colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    backgroundColor: Colors.surface,
    padding: 14,
  },
  title: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  ratingValue: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCount: {
    color: Colors.textLight,
    fontSize: 12,
  },
  divider: {
    backgroundColor: Colors.divider,
    height: 1,
    marginTop: 10,
  },
  footerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceBlock: {
    flex: 1,
  },
  priceValue: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  perPerson: {
    color: Colors.textLight,
    fontSize: 11,
  },
  priceStrike: {
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 2,
    textDecorationLine: 'line-through',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  compareButtonActive: {
    backgroundColor: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.navy,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
});
