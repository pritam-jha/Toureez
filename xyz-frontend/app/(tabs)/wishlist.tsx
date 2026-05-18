/**
 * @file app/(tabs)/wishlist.tsx
 * @description Wishlist screen — shows the user's saved packages.
 *
 * Week 1–2 scaffold: reads from the Zustand wishlist store (hydrated on login)
 * and displays the count. Full package card list UI is Week 3+.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useWishlistStore } from '../../store/wishlistStore';
import { Colors } from '../../constants/colors';

/**
 * Wishlist screen component.
 */
export default function WishlistScreen(): React.ReactElement {
  const wishlistedIds = useWishlistStore((state) => state.wishlistedIds);
  const count = wishlistedIds.size;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {count === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>No saved packages yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any package to save it here for later
          </Text>
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderEmoji}>❤️</Text>
          <Text style={styles.placeholderTitle}>
            {count} package{count !== 1 ? 's' : ''} saved
          </Text>
          <Text style={styles.placeholderSubtitle}>
            Full wishlist UI coming in Week 3
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
