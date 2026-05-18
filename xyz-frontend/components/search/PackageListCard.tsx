/**
 * @file components/search/PackageListCard.tsx
 * @description Vertical package card for the search results list.
 *
 * Differs from home/PackageCard (horizontal carousel card) in layout:
 * - Full-width vertical layout
 * - Inclusions preview chips
 * - Savings badge
 * - Larger action row with "View Details" CTA
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

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_INCLUSION_CHIPS = 3;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return url.replace(
    marker,
    `${marker}c_fill,w_${width},h_${height},f_auto,q_auto/`
  );
}

type BadgeType = 'FEATURED' | 'BESTSELLER' | 'best_value' | 'highest_rated' | 'most_inclusive';

interface BadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  FEATURED: {
    label: 'FEATURED',
    bgColor: Colors.primary,
    textColor: Colors.white,
  },
  BESTSELLER: {
    label: 'BESTSELLER',
    bgColor: Colors.secondary,
    textColor: Colors.white,
  },
  best_value: {
    label: 'Best Value',
    bgColor: Colors.success,
    textColor: Colors.white,
  },
  highest_rated: {
    label: 'Highest Rated',
    bgColor: Colors.star,
    textColor: Colors.white,
  },
  most_inclusive: {
    label: 'Most Inclusive',
    bgColor: Colors.info,
    textColor: Colors.white,
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PackageListCardProps {
  item: PackageListItem;
  onCompareFull?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PackageListCard({
  item,
  onCompareFull,
}: PackageListCardProps): React.ReactElement {
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(item.id));
  const { mutate: toggleWishlist, isPending: isWishlistPending } =
    useToggleWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const inCompare = isInCompare(item.id);

  // Pricing
  const firstPricing = item.pricing[0] ?? null;
  const basePrice = firstPricing?.base_price ?? null;
  const discountedPrice =
    firstPricing?.discounted_price !== null &&
    firstPricing?.discounted_price !== undefined &&
    basePrice !== null &&
    firstPricing.discounted_price < basePrice
      ? firstPricing.discounted_price
      : null;
  const savings =
    basePrice !== null && discountedPrice !== null
      ? basePrice - discountedPrice
      : null;

  // Cover image
  const coverImage = useMemo(
    () => getCloudinaryUrl(item.cover_image, 900, 506),
    [item.cover_image]
  );

  // Badges — combine is_featured / is_bestseller with backend-computed badges
  const badges = useMemo<BadgeType[]>(() => {
    const result: BadgeType[] = [];
    if (item.is_featured) result.push('FEATURED');
    if (item.is_bestseller) result.push('BESTSELLER');
    item.badges.forEach((b) => {
      if (
        b.type === 'best_value' ||
        b.type === 'highest_rated' ||
        b.type === 'most_inclusive'
      ) {
        result.push(b.type);
      }
    });
    return result;
  }, [item.is_featured, item.is_bestseller, item.badges]);

  // Inclusions preview
  const visibleInclusions = item.inclusions.slice(0, MAX_INCLUSION_CHIPS);
  const extraInclusionsCount = Math.max(
    0,
    item.inclusions.length - MAX_INCLUSION_CHIPS
  );

  // Handlers
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

  // Star rating display
  const fullStars = Math.floor(item.avg_rating);
  const hasHalfStar = item.avg_rating - fullStars >= 0.5;

  return (
    <Pressable
      style={styles.card}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View package ${item.title}`}
    >
      {/* ── Cover image ── */}
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
            <Ionicons name="image-outline" size={40} color={Colors.muted} />
          </View>
        )}

        {/* Badges row */}
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.slice(0, 3).map((badge) => {
              const config = BADGE_CONFIG[badge];
              return (
                <View
                  key={badge}
                  style={[styles.badge, { backgroundColor: config.bgColor }]}
                >
                  <Text
                    style={[styles.badgeText, { color: config.textColor }]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Wishlist button */}
        <Pressable
          style={styles.wishlistButton}
          onPress={handleWishlistPress}
          disabled={isWishlistPending}
          accessibilityRole="button"
          accessibilityLabel={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
          accessibilityState={{
            checked: isWishlisted,
            disabled: isWishlistPending,
          }}
          hitSlop={8}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={isWishlisted ? Colors.error : Colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Company row */}
        <View style={styles.companyRow}>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.company.name}
          </Text>
          {item.company.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={Colors.secondary}
              />
              <Text style={styles.verifiedText} numberOfLines={1}>
                Verified
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Location */}
        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.location.city}, {item.location.state}
          </Text>
        </View>

        {/* Duration + group size */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.duration_days}D / {item.duration_nights}N
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.min_group_size}–{item.max_group_size} pax
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }, (_, i) => {
            const filled = i < fullStars;
            const half = !filled && i === fullStars && hasHalfStar;
            return (
              <Ionicons
                key={i}
                name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                size={14}
                color={Colors.star}
              />
            );
          })}
          <Text style={styles.ratingValue} numberOfLines={1}>
            {item.avg_rating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount} numberOfLines={1}>
            ({item.review_count.toLocaleString('en-IN')} reviews)
          </Text>
        </View>

        {/* Inclusions preview */}
        {visibleInclusions.length > 0 && (
          <View style={styles.inclusionsRow}>
            {visibleInclusions.map((inclusion, index) => (
              <View key={index} style={styles.inclusionChip}>
                <Ionicons
                  name="checkmark"
                  size={11}
                  color={Colors.secondary}
                />
                <Text style={styles.inclusionText} numberOfLines={1}>
                  {inclusion}
                </Text>
              </View>
            ))}
            {extraInclusionsCount > 0 && (
              <View style={styles.inclusionChipMore}>
                <Text style={styles.inclusionMoreText} numberOfLines={1}>
                  +{extraInclusionsCount} more
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Price + actions */}
        <View style={styles.footerRow}>
          {/* Price block */}
          <View style={styles.priceBlock}>
            {basePrice === null ? (
              <Text style={styles.priceOnRequest} numberOfLines={1}>
                Price on request
              </Text>
            ) : (
              <>
                {discountedPrice !== null && (
                  <Text style={styles.basePrice} numberOfLines={1}>
                    {formatPrice(basePrice)}
                  </Text>
                )}
                <Text style={styles.finalPrice} numberOfLines={1}>
                  {formatPrice(discountedPrice ?? basePrice)}
                </Text>
                {savings !== null && savings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText} numberOfLines={1}>
                      Save {formatPrice(savings)}
                    </Text>
                  </View>
                )}
                <Text style={styles.perPerson} numberOfLines={1}>
                  per person
                </Text>
              </>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {/* Compare */}
            <Pressable
              style={[
                styles.compareButton,
                inCompare && styles.compareButtonActive,
              ]}
              onPress={handleComparePress}
              accessibilityRole="button"
              accessibilityLabel={
                inCompare ? 'Remove from compare' : 'Add to compare'
              }
              accessibilityState={{ selected: inCompare }}
            >
              <Ionicons
                name={inCompare ? 'checkmark' : 'git-compare-outline'}
                size={14}
                color={inCompare ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.compareText,
                  inCompare && styles.compareTextActive,
                ]}
                numberOfLines={1}
              >
                {inCompare ? 'Added' : 'Compare'}
              </Text>
            </Pressable>

            {/* View Details */}
            <Pressable
              style={styles.viewButton}
              onPress={handleCardPress}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${item.title}`}
            >
              <Text style={styles.viewButtonText} numberOfLines={1}>
                View Details
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    left: 10,
    position: 'absolute',
    top: 10,
  },
  badge: {
    borderRadius: 6,
    marginBottom: 4,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
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
    padding: 14,
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
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginLeft: 4,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratingValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginLeft: 5,
  },
  reviewCount: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 3,
  },
  inclusionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  inclusionChip: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 6,
    flexDirection: 'row',
    marginBottom: 6,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inclusionText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginLeft: 4,
    maxWidth: 100,
  },
  inclusionChipMore: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inclusionMoreText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  footerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBlock: {
    flex: 1,
    marginRight: 12,
  },
  priceOnRequest: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  basePrice: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: 6,
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  savingsText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  perPerson: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 2,
  },
  actionButtons: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  compareButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  compareText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginLeft: 4,
  },
  compareTextActive: {
    color: Colors.white,
  },
  viewButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
  },
  viewButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
});
