/**
 * @file components/home/CategoryRow.tsx
 * @description Horizontal category pills for package discovery.
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

const PILL_WIDTH = 132;
const PILL_GAP = 10;
const SKELETON_COUNT = 6;

function useSkeletonOpacity(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return opacity;
}

function CategorySkeleton(): React.ReactElement {
  const opacity = useSkeletonOpacity();

  return (
    <View style={styles.skeletonRow} accessibilityElementsHidden>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <Animated.View
          key={index}
          style={[styles.skeletonPill, { opacity }]}
        />
      ))}
    </View>
  );
}

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onPress: (category: Category) => void;
}

function CategoryPill({
  category,
  isSelected,
  onPress,
}: CategoryPillProps): React.ReactElement {
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
      <View style={[styles.iconBubble, isSelected && styles.iconBubbleSelected]}>
        <Text
          style={[styles.iconText, isSelected && styles.iconTextSelected]}
          numberOfLines={1}
        >
          {iconLabel}
        </Text>
      </View>
      <Text
        style={[styles.pillText, isSelected && styles.pillTextSelected]}
        numberOfLines={1}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}

export interface CategoryRowProps {
  selectedCategory?: string | null;
}

export function CategoryRow({
  selectedCategory = null,
}: CategoryRowProps): React.ReactElement {
  const { data, error, isLoading, refetch } = useCategories();

  const handleCategoryPress = useCallback((category: Category) => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        category: category.name,
      },
    });
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

  const getItemLayout = useCallback(
    (_items: ArrayLike<Category> | null | undefined, index: number) => ({
      index,
      length: PILL_WIDTH + PILL_GAP,
      offset: (PILL_WIDTH + PILL_GAP) * index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Browse by Category" />

      {isLoading ? (
        <CategorySkeleton />
      ) : error ? (
        <View style={styles.stateRow}>
          <Text style={styles.stateText} numberOfLines={2}>
            Something went wrong. Pull to refresh.
          </Text>
          <Pressable
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry categories"
          >
            <Text style={styles.retryText} numberOfLines={1}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.emptyCard}>
          <View
            style={styles.emptyIllustration}
            accessibilityLabel="Illustration of category tags"
          >
            <Ionicons name="pricetags-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.stateText} numberOfLines={2}>
            Categories will show up here once packages are available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          horizontal
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={CategorySeparator}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}
    </View>
  );
}

function CategorySeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContent: {
    paddingRight: 16,
  },
  separator: {
    width: PILL_GAP,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: 10,
    width: PILL_WIDTH,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: 8,
    width: 28,
  },
  iconBubbleSelected: {
    backgroundColor: Colors.primaryDark,
  },
  iconText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 20,
    textAlign: 'center',
  },
  iconTextSelected: {
    color: Colors.white,
  },
  pillText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  pillTextSelected: {
    color: Colors.white,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonPill: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    height: 46,
    marginRight: PILL_GAP,
    width: PILL_WIDTH,
  },
  stateRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  stateText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginLeft: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  emptyIllustration: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
});
