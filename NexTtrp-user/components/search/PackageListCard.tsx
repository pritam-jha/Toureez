/**
 * @file components/search/PackageListCard.tsx
 * @description NEXTTRP full-width package result card.
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

export interface PackageListCardProps {
  item: PackageListItem;
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

export function PackageListCard({
  item,
  onCompareFull,
}: PackageListCardProps): React.ReactElement {
  const card3D = use3DCard();
  const heart = useHeartBounce();
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(item.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } = useToggleWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const inCompare = isInCompare(item.id);

  /**
   * Three-tier image priority — same strategy as PackageCard:
   *   [0] Keyword destination image  — guaranteed correct location photo
   *   [1] Cloudinary cover_image     — only if no keyword match
   *   [2] PACKAGE_DEFAULT_IMAGE      — absolute last resort, never blank
   */
  const imageSources = useMemo((): string[] => {
    const sources: string[] = [];
    const keywordImage = getPackageKeywordImage(item);
    const cloudinaryImage = getCloudinaryUrl(item.cover_image, 900, 506);
    if (keywordImage) sources.push(keywordImage);
    if (cloudinaryImage && cloudinaryImage !== keywordImage) sources.push(cloudinaryImage);
    sources.push(PACKAGE_DEFAULT_IMAGE);
    return sources;
  }, [item]);

  const [imageIndex, setImageIndex] = useState(0);

  const handleImageError = useCallback(() => {
    setImageIndex((prev) => prev + 1);
  }, []);

  const coverImage = imageSources[Math.min(imageIndex, imageSources.length - 1)];

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

  useEffect(() => {
    setImageIndex(0);
  }, [item.id]);

  const handleCardPress = useCallback(() => {
    router.push({ pathname: '/package/[id]' as never, params: { id: item.id } });
  }, [item.id]);

  const handleWishlistPress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    heart.trigger();
    toggleWishlist({ packageId: item.id });
  }, [heart, item.id, toggleWishlist]);

  const handleComparePress = useCallback(() => {
    if (inCompare) {
      removeFromCompare(item.id);
      return;
    }
    const result = addToCompare(item);
    if (result === 'tray_full') onCompareFull?.();
  }, [addToCompare, inCompare, item, onCompareFull, removeFromCompare]);

  return (
    <Animated.View style={card3D.animatedStyle}>
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

          <View style={styles.badgesRow}>
            {item.is_featured ? <Badge type="FEATURED" /> : null}
            {item.is_bestseller ? <Badge type="BESTSELLER" /> : null}
          </View>

          <Animated.View style={[styles.wishlistWrap, heart.animatedStyle]}>
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
                size={20}
                color={isWishlisted ? Colors.error : Colors.navy}
              />
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.body}>
          <View style={styles.companyRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.company.name}
            </Text>
            {item.company.is_verified ? (
              <Badge type="VERIFIED" />
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location.city}, {item.location.state}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.duration_days}D/{item.duration_nights}N</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.min_group_size}-{item.max_group_size} pax</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <StarRating rating={item.avg_rating} size={14} />
            <Text style={styles.ratingValue}>{item.avg_rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({item.review_count.toLocaleString('en-IN')} reviews)
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.priceBlock}>
              {finalPrice === null ? (
                <Text style={styles.priceOnRequest}>Price on request</Text>
              ) : (
                <>
                  {discountedPrice !== null && basePrice !== null ? (
                    <Text style={styles.basePrice}>{formatPrice(basePrice)}</Text>
                  ) : null}
                  <Text style={styles.finalPrice}>{formatPrice(finalPrice)}</Text>
                  <Text style={styles.perPerson}>per person</Text>
                </>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.compareButton, inCompare && styles.compareButtonActive]}
                onPress={handleComparePress}
                accessibilityRole="button"
                accessibilityLabel={inCompare ? 'Remove from compare' : 'Add to compare'}
                accessibilityState={{ selected: inCompare }}
              >
                <Ionicons
                  name={inCompare ? 'checkmark' : 'git-compare-outline'}
                  size={14}
                  color={inCompare ? Colors.textWhite : Colors.primary}
                />
                <Text style={[styles.compareText, inCompare && styles.compareTextActive]}>
                  {inCompare ? 'Added' : 'Compare'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.viewButton}
                onPress={handleCardPress}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.title}`}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
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
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.backgroundSoft,
    position: 'relative',
    width: '100%',
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
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
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
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  body: {
    padding: 16,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  companyName: {
    color: Colors.textLight,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: Colors.navy,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  metaText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
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
  footerRow: {
    alignItems: 'flex-end',
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  priceBlock: {
    flex: 1,
    marginRight: 12,
  },
  priceOnRequest: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  basePrice: {
    color: Colors.textLight,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  perPerson: {
    color: Colors.textLight,
    fontSize: 11,
  },
  actionButtons: {
    alignItems: 'flex-end',
    gap: 8,
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  compareButtonActive: {
    backgroundColor: Colors.primary,
  },
  compareText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  compareTextActive: {
    color: Colors.textWhite,
  },
  viewButton: {
    backgroundColor: Colors.navy,
    borderRadius: 10,
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  viewButtonText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
});
