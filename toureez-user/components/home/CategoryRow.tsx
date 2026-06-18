/**
 * @file components/home/CategoryRow.tsx
 * @description Horizontal category chips — Premium Light 3D design.
 * Active: navy filled chip with white text. Inactive: white chip with border.
 *
 * ✅ All hooks and navigation preserved — zero logic changes.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ListRenderItem } from 'react-native';

import { SectionHeader } from './SectionHeader';
import { useCategories } from '../../hooks/useHomeData';
import { Colors } from '../../constants/colors';
import type { Category } from '../../types';

const PILL_GAP = 8;
const SKELETON_COUNT = 6;

function useSkeletonOpacity(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return opacity;
}

function CategorySkeleton(): React.ReactElement {
  const opacity = useSkeletonOpacity();
  return (
    <View style={styles.skeletonRow} accessibilityElementsHidden>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonPill, { opacity }]} />
      ))}
    </View>
  );
}

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onPress: (category: Category) => void;
}

function CategoryPill({ category, isSelected, onPress }: CategoryPillProps): React.ReactElement {
  const iconLabel =
    category.icon && category.icon.trim().length > 0
      ? category.icon.trim()
      : category.label.charAt(0).toUpperCase();

  return (
    <Pressable
      style={[styles.pill, isSelected && styles.pillSelected]}
      onPress={() => onPress(category)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.label} packages`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.iconText, isSelected && styles.iconTextSelected]} numberOfLines={1}>
        {iconLabel}
      </Text>
      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1}>
        {category.label}
      </Text>
    </Pressable>
  );
}

export interface CategoryRowProps {
  selectedCategory?: string | null;
}

export function CategoryRow({ selectedCategory = null }: CategoryRowProps): React.ReactElement {
  const { data, error, isLoading, refetch } = useCategories();

  const handleCategoryPress = useCallback((category: Category) => {
    router.push({ pathname: '/(tabs)/search', params: { category: category.name } });
  }, []);

  const renderItem: ListRenderItem<Category> = useCallback(
    ({ item }) => (
      <CategoryPill
        category={item}
        isSelected={selectedCategory === item.name}
        onPress={handleCategoryPress}
      />
    ),
    [handleCategoryPress, selectedCategory]
  );

  const keyExtractor = useCallback((item: Category) => item.id, []);

  return (
    <View style={styles.container}>
      <SectionHeader title="Browse by Category" />

      {isLoading ? (
        <CategorySkeleton />
      ) : error ? (
        <View style={styles.stateRow}>
          <Text style={styles.stateText} numberOfLines={2}>Something went wrong. Pull to refresh.</Text>
          <Pressable onPress={() => void refetch()} accessibilityRole="button" accessibilityLabel="Retry categories">
            <Text style={styles.retryText} numberOfLines={1}>Retry</Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIllustration} accessibilityLabel="Category tags icon">
            <Ionicons name="pricetags-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.stateText} numberOfLines={2}>Categories will show up here once packages are available.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          horizontal
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  listContent: {
    paddingRight: 4,
  },
  separator: {
    width: PILL_GAP,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    // Subtle 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  iconText: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  iconTextSelected: {
    color: Colors.white,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  pillTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonPill: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 999,
    height: 40,
    marginRight: PILL_GAP,
    width: 100,
  },
  stateRow: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  stateText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  emptyIllustration: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
});
