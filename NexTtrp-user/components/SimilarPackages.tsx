/**
 * @file components/SimilarPackages.tsx
 * @description Horizontal scroll strip of similar packages shown on the package detail screen.
 */

import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSimilarPackages } from '../hooks/useSimilarPackages';
import type { PackageListItem } from '../types';

function formatPrice(item: PackageListItem): string {
  const price = item.pricing?.[0]?.discounted_price ?? item.pricing?.[0]?.base_price ?? null;
  if (price === null) return '';
  return `₹${price.toLocaleString('en-IN')}`;
}

function PackageCard({ pkg }: { pkg: PackageListItem }): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/package/${pkg.id}` as never)}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: pkg.cover_image ?? undefined }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{pkg.title}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {pkg.location?.city}, {pkg.location?.state}
        </Text>
        <View style={styles.footer}>
          {pkg.avg_rating > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={11} color={Colors.star} />
              <Text style={styles.ratingText}>{pkg.avg_rating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.price}>{formatPrice(pkg)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

interface Props {
  packageId: string;
}

export function SimilarPackages({ packageId }: Props): React.ReactElement | null {
  const { data: similar, isLoading } = useSimilarPackages(packageId);

  if (isLoading || !similar || similar.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>You might also like</Text>
      <FlatList
        data={similar}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PackageCard pkg={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: 20 },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary ?? '#1A1A2E',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16 },
  card: {
    width: 180,
    backgroundColor: Colors.backgroundWhite ?? '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pressed: { opacity: 0.8 },
  image: { width: '100%', height: 110 },
  info: { padding: 10, gap: 4 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.navy ?? '#1A1A2E', lineHeight: 18 },
  location: { fontSize: 11, color: Colors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  price: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
