/**
 * @file components/home/PopularLocations.tsx
 * @description Popular destination cards — Premium Light 3D design.
 * White cards with image-like colored backgrounds, 3D shadows, navy text.
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
import { useLocations } from '../../hooks/useHomeData';
import { Colors } from '../../constants/colors';
import type { Location } from '../../types';

const CARD_WIDTH = 148;
const CARD_HEIGHT = 110;
const CARD_GAP = 12;

// Premium light gradient backgrounds for location cards
const CARD_COLORS = [
  '#EEF1FF',
  '#FFF3E8',
  '#E8F5FF',
  '#F0FFF4',
  '#FFF0F5',
  '#F5F0FF',
];

const CARD_ACCENT_COLORS = [
  Colors.primary,
  '#DD6B20',
  '#2B6CB0',
  '#276749',
  '#C53030',
  '#553C9A',
];

const CARD_ICON_NAMES: React.ComponentProps<typeof Ionicons>['name'][] = [
  'business-outline',
  'sunny-outline',
  'water-outline',
  'leaf-outline',
  'heart-outline',
  'sparkles-outline',
];

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

function LocationSkeleton(): React.ReactElement {
  const opacity = useSkeletonOpacity();
  return (
    <View style={styles.skeletonRow} accessibilityElementsHidden>
      {[0, 1, 2, 3, 4].map((item) => (
        <Animated.View key={item} style={[styles.skeletonCard, { opacity }]} />
      ))}
    </View>
  );
}

interface LocationCardProps {
  item: Location;
  index: number;
  onPress: (location: Location) => void;
}

function LocationCard({ item, index, onPress }: LocationCardProps): React.ReactElement {
  const bgColor = CARD_COLORS[index % CARD_COLORS.length] ?? '#EEF1FF';
  const accentColor = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length] ?? Colors.primary;
  const iconName = CARD_ICON_NAMES[index % CARD_ICON_NAMES.length] ?? 'location-outline';

  return (
    <Pressable
      style={[styles.locationCard, { backgroundColor: bgColor }]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Explore packages for ${item.city}, ${item.state}`}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={iconName} size={20} color={accentColor} />
      </View>
      {/* Text */}
      <Text style={[styles.city, { color: accentColor }]} numberOfLines={1}>{item.city}</Text>
      <Text style={styles.state} numberOfLines={1}>{item.state}</Text>
      {/* Arrow */}
      <View style={[styles.arrowWrap, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name="arrow-forward" size={10} color={accentColor} />
      </View>
    </Pressable>
  );
}

export function PopularLocations(): React.ReactElement {
  const { data, error, isLoading, refetch } = useLocations(true);

  const handleLocationPress = useCallback((location: Location) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { destination: location.city, state: location.state },
    });
  }, []);

  const handleSeeAll = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  const renderItem: ListRenderItem<Location> = useCallback(
    ({ item, index }) => (
      <LocationCard item={item} index={index} onPress={handleLocationPress} />
    ),
    [handleLocationPress]
  );

  const keyExtractor = useCallback((item: Location) => item.id, []);

  const getItemLayout = useCallback(
    (_items: ArrayLike<Location> | null | undefined, index: number) => ({
      index,
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Popular Destinations" onActionPress={handleSeeAll} />

      {isLoading ? (
        <LocationSkeleton />
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateMessage} numberOfLines={2}>
            Something went wrong. Pull to refresh.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => void refetch()} accessibilityRole="button" accessibilityLabel="Retry destinations">
            <Text style={styles.retryText} numberOfLines={1}>Retry</Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyIllustration} accessibilityLabel="Map icon">
            <Ionicons name="map-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle} numberOfLines={1}>No destinations yet</Text>
          <Text style={styles.stateMessage} numberOfLines={2}>New places across India will appear here soon.</Text>
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
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
    width: CARD_GAP,
  },
  locationCard: {
    borderRadius: 18,
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    padding: 14,
    justifyContent: 'flex-start',
    position: 'relative',
    // 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(30,40,100,0.06)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  city: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  state: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 1,
  },
  arrowWrap: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonCard: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 18,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    width: CARD_WIDTH,
  },
  stateCard: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyIllustration: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
    width: 40,
  },
  stateMessage: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
