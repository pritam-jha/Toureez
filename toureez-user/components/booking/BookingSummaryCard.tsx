/**
 * @file components/booking/BookingSummaryCard.tsx
 * @description Package + company summary card shown on the review screen.
 *
 * Displays: cover image, title, company (with verified badge),
 * location, duration, category, and travel date.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingSummaryCardProps {
  pkg: PackageDetail;
  travelDate: string;
  numTravelers: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingSummaryCard({
  pkg,
  travelDate,
  numTravelers,
}: BookingSummaryCardProps): React.ReactElement {
  const coverImage =
    pkg.images.find((img) => img.is_cover)?.url ?? pkg.images[0]?.url ?? null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Package Details</Text>

      {/* Cover image + title row */}
      <View style={styles.packageRow}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
            accessibilityLabel={`Cover image for ${pkg.title}`}
          />
        ) : (
          <View style={[styles.coverImage, styles.coverImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color={Colors.textTertiary} />
          </View>
        )}

        <View style={styles.packageInfo}>
          <Text style={styles.packageTitle} numberOfLines={2}>
            {pkg.title}
          </Text>

          {/* Company row */}
          <View style={styles.companyRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {pkg.company.name}
            </Text>
            {pkg.company.is_verified && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.info}
                accessibilityLabel="Verified company"
              />
            )}
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {pkg.location.city}, {pkg.location.state}
            </Text>
          </View>

          {/* Duration */}
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {pkg.duration_days}D / {pkg.duration_nights}N
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Travel details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={Colors.primary}
          />
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailLabel}>Travel Date</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {formatDisplayDate(travelDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name="people-outline"
            size={16}
            color={Colors.primary}
          />
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailLabel}>Travelers</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {numTravelers} person{numTravelers > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name="grid-outline"
            size={16}
            color={Colors.primary}
          />
          <View style={styles.detailTextWrap}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {pkg.category.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  packageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coverImage: {
    borderRadius: 12,
    height: 80,
    width: 80,
  },
  coverImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    justifyContent: 'center',
  },
  packageInfo: {
    flex: 1,
    gap: 4,
  },
  packageTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  companyName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  divider: {
    backgroundColor: Colors.surfaceBorder,
    height: 1,
    marginVertical: 14,
  },
  detailsGrid: {
    gap: 10,
  },
  detailItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 1,
  },
});
