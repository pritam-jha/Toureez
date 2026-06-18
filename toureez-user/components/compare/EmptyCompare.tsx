/**
 * @file components/compare/EmptyCompare.tsx
 * @description Empty state shown when fewer than 2 packages are in the tray.
 * Shows the single added package thumbnail if exactly 1 exists.
 */

import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';
import type { ComparePackage } from '../../types';

export interface EmptyCompareProps {
  compareItems: ComparePackage[];
}

export function EmptyCompare({ compareItems }: EmptyCompareProps): React.ReactElement {
  const handleBrowse = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  const singleItem = compareItems.length === 1 ? compareItems[0] : null;

  return (
    <View style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustration}>
        {singleItem ? (
          <View style={styles.singleItemWrap}>
            {singleItem.cover_image ? (
              <Image
                source={{ uri: singleItem.cover_image }}
                style={styles.singleImage}
                resizeMode="cover"
                accessibilityLabel={singleItem.title}
              />
            ) : (
              <View style={styles.singleImageFallback}>
                <Ionicons name="image-outline" size={28} color={Colors.textTertiary} />
              </View>
            )}
            <Text style={styles.singleTitle} numberOfLines={2}>
              {singleItem.title}
            </Text>
          </View>
        ) : null}

        {/* Dashed slot(s) */}
        {Array.from({ length: singleItem ? 1 : 2 }, (_, i) => (
          <View key={i} style={styles.dashedSlot}>
            <Ionicons name="add" size={28} color={Colors.textTertiary} />
          </View>
        ))}
      </View>

      <Text style={styles.heading} numberOfLines={1}>
        Add packages to compare
      </Text>
      <Text style={styles.subtitle} numberOfLines={3}>
        {singleItem
          ? `You need at least one more package to start comparing. Browse and add another.`
          : `Select 2 to 4 travel packages from search results to compare them side by side.`}
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleBrowse}
        accessibilityRole="button"
        accessibilityLabel="Browse packages"
      >
        <Ionicons name="search-outline" size={18} color={Colors.white} />
        <Text style={styles.buttonText} numberOfLines={1}>
          Browse Packages
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  illustration: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  singleItemWrap: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  singleImage: {
    borderRadius: 14,
    height: 100,
    marginBottom: 8,
    width: 100,
  },
  singleImageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 14,
    height: 100,
    justifyContent: 'center',
    marginBottom: 8,
    width: 100,
  },
  singleTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
  },
  dashedSlot: {
    alignItems: 'center',
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 100,
    justifyContent: 'center',
    marginHorizontal: 8,
    width: 100,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 8,
  },
});
