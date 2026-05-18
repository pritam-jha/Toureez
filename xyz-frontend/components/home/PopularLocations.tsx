/**
 * @file components/home/PopularLocations.tsx
 * @description Horizontal list of popular destination cards.
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
const CARD_HEIGHT = 106;
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

function LocationSkeleton(): React.ReactElement {
  const opacity = useSkeletonOpacity();

  return (
    <View style={styles.skeletonRow} accessibilityElementsHidden>
      {[0, 1, 2, 3, 4].map((item) => (
        <Animated.View
          key={item}
          style={[styles.skeletonCard, { opacity }]}
        />
      ))}
    </View>
  );
}

interface LocationCardProps {
  item: Location;
  index: number;
  onPress: (location: Location) => void;
}

function LocationCard({
  item,
  index,
  onPress,
}: LocationCardProps): React.ReactElement {
  const cardStyle =
    LOCATION_CARD_STYLES[index % LOCATION_CARD_STYLES.length] ??
    styles.locationCardOne;

  return (
    <Pressable
      style={[styles.locationCard, cardStyle]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Explore packages for ${item.city}, ${item.state}`}
    >
      <View style={styles.cardLightSpot} />
      <View style={styles.cardOverlay}>
        <Text style={styles.city} numberOfLines={1}>
          {item.city}
        </Text>
        <Text style={styles.state} numberOfLines={1}>
          {item.state}
        </Text>
      </View>
    </Pressable>
  );
}

export function PopularLocations(): React.ReactElement {
  const { data, error, isLoading, refetch } = useLocations(true);

  const handleLocationPress = useCallback((location: Location) => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        destination: location.city,
        state: location.state,
      },
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
          <Pressable
            style={styles.retryButton}
            onPress={() => void refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry destinations"
          >
            <Text style={styles.retryText} numberOfLines={1}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.stateCard}>
          <View
            style={styles.emptyIllustration}
            accessibilityLabel="Illustration of a folded India travel map"
          >
            <Ionicons name="map-outline" size={26} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle} numberOfLines={1}>
            No destinations yet
          </Text>
          <Text style={styles.stateMessage} numberOfLines={2}>
            New places across India will appear here soon.
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
          ItemSeparatorComponent={LocationSeparator}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={5}
        />
      )}
    </View>
  );
}

function LocationSeparator(): React.ReactElement {
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
  locationCard: {
    borderRadius: 8,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  locationCardOne: {
    backgroundColor: Colors.primary,
  },
  locationCardTwo: {
    backgroundColor: Colors.secondary,
  },
  locationCardThree: {
    backgroundColor: Colors.info,
  },
  locationCardFour: {
    backgroundColor: Colors.warning,
  },
  cardLightSpot: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 44,
    height: 88,
    position: 'absolute',
    right: -28,
    top: -24,
    width: 88,
  },
  cardOverlay: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  city: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  state: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  skeletonCard: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    width: CARD_WIDTH,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyIllustration: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginBottom: 10,
    width: 44,
  },
  stateMessage: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});

const LOCATION_CARD_STYLES = [
  styles.locationCardOne,
  styles.locationCardTwo,
  styles.locationCardThree,
  styles.locationCardFour,
];
