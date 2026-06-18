/**
 * @file components/vendor/PackageCard.tsx
 * @description Package list item card for the vendor packages screen.
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PackageStatusBadge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { VendorPackageListItem } from '../../types';

interface PackageCardProps {
  pkg: VendorPackageListItem;
  onPress: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onPress }) => {
  const lowestPrice = pkg.lowest_price;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Shadows.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Package: ${pkg.title}`}
    >
      {/* Cover image */}
      <View style={styles.imageContainer}>
        {pkg.cover_image != null ? (
          <Image source={{ uri: pkg.cover_image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={Colors.textLight} />
          </View>
        )}
        <View style={styles.statusOverlay}>
          <PackageStatusBadge status={pkg.status} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {pkg.title}
        </Text>

        <View style={styles.meta}>
          {pkg.location != null && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {pkg.location.city}, {pkg.location.state}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {pkg.duration_days}D / {pkg.duration_nights}N
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={12} color={Colors.star} />
              <Text style={styles.statText}>
                {pkg.avg_rating > 0 ? pkg.avg_rating.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textLight} />
              <Text style={styles.statText}>{pkg.total_bookings} bookings</Text>
            </View>
          </View>

          {lowestPrice != null && (
            <Text style={styles.price}>
              ₹{lowestPrice.toLocaleString('en-IN')}
              <Text style={styles.priceSuffix}>/person</Text>
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceSuffix: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
});
