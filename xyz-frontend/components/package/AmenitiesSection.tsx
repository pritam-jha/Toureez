/**
 * @file components/package/AmenitiesSection.tsx
 * @description 3-column grid of amenity chips, each with an icon and label.
 * Icons are mapped from known amenity strings; unknown ones fall back to
 * a generic checkmark so the grid never shows a broken icon.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

// ── Icon map ──────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const AMENITY_ICONS: Record<string, IoniconName> = {
  wifi: 'wifi-outline',
  'wi-fi': 'wifi-outline',
  ac: 'snow-outline',
  'air conditioning': 'snow-outline',
  pool: 'water-outline',
  swimming: 'water-outline',
  parking: 'car-outline',
  breakfast: 'restaurant-outline',
  meals: 'restaurant-outline',
  food: 'restaurant-outline',
  gym: 'barbell-outline',
  fitness: 'barbell-outline',
  spa: 'flower-outline',
  laundry: 'shirt-outline',
  tv: 'tv-outline',
  television: 'tv-outline',
  guide: 'person-outline',
  guided: 'person-outline',
  transport: 'bus-outline',
  transfers: 'bus-outline',
  pickup: 'bus-outline',
  camera: 'camera-outline',
  photography: 'camera-outline',
  medical: 'medkit-outline',
  insurance: 'shield-checkmark-outline',
  stay: 'bed-outline',
  accommodation: 'bed-outline',
  hotel: 'bed-outline',
  comfort: 'bed-outline',
  curated: 'star-outline',
  support: 'headset-outline',
  assistance: 'headset-outline',
};

function getAmenityIcon(amenity: string): IoniconName {
  const lower = amenity.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'checkmark-circle-outline';
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AmenitiesSectionProps {
  amenities: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AmenitiesSection({
  amenities,
}: AmenitiesSectionProps): React.ReactElement | null {
  if (amenities.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Amenities
      </Text>

      <View style={styles.grid}>
        {amenities.map((amenity, index) => (
          <View key={index} style={styles.chip}>
            <Ionicons
              name={getAmenityIcon(amenity)}
              size={18}
              color={Colors.primary}
              style={styles.chipIcon}
            />
            <Text style={styles.chipLabel} numberOfLines={2}>
              {amenity}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    margin: 5,
    minHeight: 76,
    paddingHorizontal: 8,
    paddingVertical: 12,
    width: '30%',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  chipIcon: {
    marginBottom: 6,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
  },
});
