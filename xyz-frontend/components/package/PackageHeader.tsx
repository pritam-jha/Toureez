/**
 * @file components/package/PackageHeader.tsx
 * @description Title, badges, category, location, rating, duration,
 * group size, and wishlist button for the package detail screen.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useToggleWishlist } from '../../hooks/useWishlist';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PackageHeaderProps {
  pkg: PackageDetail;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PackageHeader({ pkg }: PackageHeaderProps): React.ReactElement {
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(pkg.id));
  const { mutate: toggleWishlist, isPending } = useToggleWishlist();

  const handleWishlist = useCallback(() => {
    toggleWishlist({ packageId: pkg.id });
  }, [pkg.id, toggleWishlist]);

  const fullStars = Math.floor(pkg.avg_rating);
  const hasHalf = pkg.avg_rating - fullStars >= 0.5;

  return (
    <View style={styles.container}>
      {/* Badges row */}
      {(pkg.is_featured || pkg.is_bestseller) && (
        <View style={styles.badgesRow}>
          {pkg.is_featured && (
            <View style={[styles.badge, styles.badgeFeatured]}>
              <Text style={styles.badgeText} numberOfLines={1}>FEATURED</Text>
            </View>
          )}
          {pkg.is_bestseller && (
            <View style={[styles.badge, styles.badgeBestseller]}>
              <Text style={styles.badgeText} numberOfLines={1}>BESTSELLER</Text>
            </View>
          )}
        </View>
      )}

      {/* Title + wishlist */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{pkg.title}</Text>
        <Pressable
          style={styles.wishlistButton}
          onPress={handleWishlist}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          accessibilityState={{ checked: isWishlisted, disabled: isPending }}
          hitSlop={8}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={isWishlisted ? Colors.error : Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Category pill */}
      <View style={styles.categoryPill}>
        <Text style={styles.categoryIcon} numberOfLines={1}>
          {pkg.category.icon}
        </Text>
        <Text style={styles.categoryLabel} numberOfLines={1}>
          {pkg.category.label}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
        <Text style={styles.metaText} numberOfLines={1}>
          {pkg.location.city}, {pkg.location.state}
          {pkg.location.region ? `, ${pkg.location.region}` : ''}
        </Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingRow}>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < fullStars;
          const half = !filled && i === fullStars && hasHalf;
          return (
            <Ionicons
              key={i}
              name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
              size={16}
              color={Colors.star}
            />
          );
        })}
        <Text style={styles.ratingScore} numberOfLines={1}>
          {pkg.avg_rating.toFixed(1)}
        </Text>
        <Text style={styles.reviewCount} numberOfLines={1}>
          ({pkg.review_count.toLocaleString('en-IN')} reviews)
        </Text>
      </View>

      {/* Duration + group size */}
      <View style={styles.detailsRow}>
        <View style={styles.detailChip}>
          <Ionicons name="time-outline" size={15} color={Colors.primary} />
          <Text style={styles.detailChipText} numberOfLines={1}>
            {pkg.duration_days} Days / {pkg.duration_nights} Nights
          </Text>
        </View>
        <View style={styles.detailChip}>
          <Ionicons name="people-outline" size={15} color={Colors.primary} />
          <Text style={styles.detailChipText} numberOfLines={1}>
            {pkg.min_group_size}–{pkg.max_group_size} People
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  badge: {
    borderRadius: 6,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 30,
    marginRight: 12,
  },
  wishlistButton: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginTop: 2,
    width: 44,
  },
  categoryPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 20,
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryIcon: {
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  metaText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginLeft: 5,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  ratingScore: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginLeft: 6,
  },
  reviewCount: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailChip: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 6,
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailChipText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 6,
  },
});
