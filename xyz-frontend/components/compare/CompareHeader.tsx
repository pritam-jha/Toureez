/**
 * @file components/compare/CompareHeader.tsx
 * @description Sticky top row — package photo cards, horizontally scrollable.
 * The label spacer on the left is fixed; only the package columns scroll.
 */

import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ScrollView as ScrollViewType } from 'react-native';

import { AddPackageSlot, COLUMN_WIDTH, COLUMN_GAP } from './AddPackageSlot';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

// Width of the fixed left label column — exported so rows can match it
export const LABEL_WIDTH = 100;

export interface CompareHeaderProps {
  packages: PackageListItem[];
  canAddMore: boolean;
  scrollRef: React.RefObject<ScrollViewType>;
  onScroll: (x: number) => void;
  onRemove: (id: string) => void;
}

interface PackageColumnProps {
  pkg: PackageListItem;
  onRemove: (id: string) => void;
}

function PackageColumn({ pkg, onRemove }: PackageColumnProps): React.ReactElement {
  const handleRemove = useCallback(() => onRemove(pkg.id), [onRemove, pkg.id]);

  return (
    <View style={styles.column}>
      {/* Remove button */}
      <Pressable
        style={styles.removeBtn}
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${pkg.title}`}
        hitSlop={8}
      >
        <Ionicons name="close" size={13} color={Colors.white} />
      </Pressable>

      {/* Cover image */}
      {pkg.cover_image ? (
        <Image
          source={{ uri: pkg.cover_image }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={pkg.title}
        />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons name="image-outline" size={30} color={Colors.muted} />
        </View>
      )}

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {pkg.title}
      </Text>

      {/* Company + verified */}
      <View style={styles.companyRow}>
        <Text style={styles.company} numberOfLines={1}>
          {pkg.company.name}
        </Text>
        {pkg.company.is_verified && (
          <Ionicons
            name="checkmark-circle"
            size={13}
            color={Colors.secondary}
            style={styles.verifiedIcon}
          />
        )}
      </View>

      {/* Rating pill */}
      <View style={styles.ratingPill}>
        <Ionicons name="star" size={11} color={Colors.star} />
        <Text style={styles.ratingText} numberOfLines={1}>
          {pkg.avg_rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

export function CompareHeader({
  packages,
  canAddMore,
  scrollRef,
  onScroll,
  onRemove,
}: CompareHeaderProps): React.ReactElement {
  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      onScroll(e.nativeEvent.contentOffset.x);
    },
    [onScroll]
  );

  return (
    <View style={styles.container}>
      {/* Fixed label spacer */}
      <View style={styles.labelSpacer}>
        <Text style={styles.labelSpacerText} numberOfLines={1}>
          Package
        </Text>
      </View>

      {/* Scrollable columns */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {packages.map((pkg) => (
          <PackageColumn key={pkg.id} pkg={pkg} onRemove={onRemove} />
        ))}
        {canAddMore && <AddPackageSlot />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 2,
    flexDirection: 'row',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  labelSpacer: {
    backgroundColor: Colors.background,
    borderRightColor: Colors.border,
    borderRightWidth: 1,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 10,
    width: LABEL_WIDTH,
  },
  labelSpacerText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: COLUMN_GAP,
  },
  column: {
    position: 'relative',
    width: COLUMN_WIDTH,
  },
  removeBtn: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
    zIndex: 10,
  },
  image: {
    borderRadius: 10,
    height: 110,
    marginBottom: 10,
    width: COLUMN_WIDTH,
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 110,
    justifyContent: 'center',
    marginBottom: 10,
    width: COLUMN_WIDTH,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 4,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  company: {
    color: Colors.textTertiary,
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  verifiedIcon: {
    marginLeft: 3,
  },
  ratingPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    flexDirection: 'row',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginLeft: 3,
  },
});
