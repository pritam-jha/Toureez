/**
 * @file components/home/FeaturedPackages.tsx
 * @description Horizontal carousel of featured travel packages.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ListRenderItem } from 'react-native';

import { PackageCard } from './PackageCard';
import { SectionHeader } from './SectionHeader';
import { Toast } from '../ui/Toast';
import { useFeaturedPackages } from '../../hooks/useHomeData';
import { Colors } from '../../constants/colors';
import type { PackageListItem } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
const CARD_GAP = 12;

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

function FeaturedSkeleton(): React.ReactElement {
  const opacity = useSkeletonOpacity();

  return (
    <View style={styles.skeletonRow} accessibilityElementsHidden>
      {[0, 1, 2].map((item) => (
        <Animated.View key={item} style={[styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonLineLarge} />
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineSmall} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function FeaturedPackages(): React.ReactElement {
  const { data, error, isLoading, refetch } = useFeaturedPackages();
  const [isCompareToastVisible, setCompareToastVisible] = useState(false);

  const handleSeeAll = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        is_featured: 'true',
      },
    });
  }, []);

  const handleCompareFull = useCallback(() => {
    setCompareToastVisible(true);
  }, []);

  const handleToastHide = useCallback(() => {
    setCompareToastVisible(false);
  }, []);

  const renderItem: ListRenderItem<PackageListItem> = useCallback(
    ({ item }) => (
      <PackageCard
        item={item}
        width={CARD_WIDTH}
        onCompareFull={handleCompareFull}
      />
    ),
    [handleCompareFull]
  );

  const keyExtractor = useCallback((item: PackageListItem) => item.id, []);

  const getItemLayout = useCallback(
    (_items: ArrayLike<PackageListItem> | null | undefined, index: number) => ({
      index,
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Featured Packages" onActionPress={handleSeeAll} />

      {isLoading ? (
        <FeaturedSkeleton />
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateMessage} numberOfLines={2}>
            Something went wrong. Pull to refresh.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry featured packages"
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
            accessibilityLabel="Illustration of an empty suitcase beside a folded map"
          >
            <Ionicons name="map-outline" size={30} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle} numberOfLines={1}>
            No featured packages yet
          </Text>
          <Text style={styles.stateMessage} numberOfLines={2}>
            Curated trips from verified operators will appear here soon.
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
          ItemSeparatorComponent={FeaturedSeparator}
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
        />
      )}

      <Toast
        visible={isCompareToastVisible}
        type="info"
        message="Compare tray is full. Remove a package to add another."
        onHide={handleToastHide}
      />
    </View>
  );
}

function FeaturedSeparator(): React.ReactElement {
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
    width: CARD_GAP,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: CARD_GAP,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  skeletonImage: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
    width: '100%',
  },
  skeletonBody: {
    padding: 12,
  },
  skeletonLineLarge: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 14,
    marginBottom: 10,
    width: '88%',
  },
  skeletonLineMedium: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 12,
    marginBottom: 10,
    width: '68%',
  },
  skeletonLineSmall: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    height: 12,
    width: '48%',
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  stateMessage: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  emptyIllustration: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 10,
    width: 48,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
});
