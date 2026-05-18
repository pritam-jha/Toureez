/**
 * @file components/home/CompareTray.tsx
 * @description Persistent floating compare tray rendered above all tabs.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCompare } from '../../hooks/useCompare';
import { Colors } from '../../constants/colors';

const TRAY_HEIGHT = 74;
const TAB_BAR_HEIGHT = 64;
const HIDDEN_OFFSET = TRAY_HEIGHT + 24;
const MAX_THUMBNAILS = 4;
const ANIMATION_DURATION_MS = 260;

function getCloudinaryThumbnail(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const marker = '/image/upload/';

  if (!url.includes(marker)) {
    return url;
  }

  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }

  return url.replace(marker, `${marker}c_fill,w_96,h_96,f_auto,q_auto/`);
}

export function CompareTray(): React.ReactElement | null {
  const { compareItems, compareCount, clearCompare } = useCompare();
  const insets = useSafeAreaInsets();
  const isVisible = compareCount > 0;
  const [shouldRender, setShouldRender] = useState(isVisible);
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;

  const positionStyle = useMemo(
    () =>
      StyleSheet.create({
        value: {
          bottom: insets.bottom + TAB_BAR_HEIGHT + 8,
        },
      }).value,
    [insets.bottom]
  );

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: HIDDEN_OFFSET,
      duration: ANIMATION_DURATION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [isVisible, translateY]);

  const handleCompareNow = useCallback(() => {
    router.push({
      pathname: '/compare' as never,
      params: {
        ids: compareItems.map((item) => item.id).join(','),
      },
    });
  }, [compareItems]);

  const thumbnails = compareItems.slice(0, MAX_THUMBNAILS);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.tray,
        positionStyle,
        {
          transform: [{ translateY }],
        },
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel={`${compareCount} packages selected for comparison`}
    >
      <View style={styles.thumbnailRow}>
        {thumbnails.map((pkg) => {
          const thumbnail = getCloudinaryThumbnail(pkg.cover_image);

          return (
            <View key={pkg.id} style={styles.thumbnail}>
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  accessibilityLabel={pkg.title}
                />
              ) : (
                <View style={styles.thumbnailFallback}>
                  <Ionicons name="image-outline" size={14} color={Colors.white} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.countText} numberOfLines={1}>
        {compareCount} package{compareCount === 1 ? '' : 's'} selected
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.clearButton}
          onPress={clearCompare}
          accessibilityRole="button"
          accessibilityLabel="Clear compare tray"
          hitSlop={8}
        >
          <Text style={styles.clearText} numberOfLines={1}>
            Clear
          </Text>
        </Pressable>

        <Pressable
          style={styles.compareButton}
          onPress={handleCompareNow}
          accessibilityRole="button"
          accessibilityLabel="Compare selected packages"
        >
          <Text style={styles.compareText} numberOfLines={1}>
            Compare Now
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tray: {
    alignItems: 'center',
    backgroundColor: Colors.textPrimary,
    borderRadius: 8,
    elevation: 12,
    flexDirection: 'row',
    height: TRAY_HEIGHT,
    left: 14,
    paddingHorizontal: 12,
    position: 'absolute',
    right: 14,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      height: 8,
      width: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    zIndex: 50,
  },
  thumbnailRow: {
    flexDirection: 'row',
    marginRight: 10,
  },
  thumbnail: {
    backgroundColor: Colors.muted,
    borderColor: Colors.white,
    borderRadius: 17,
    borderWidth: 2,
    height: 34,
    marginLeft: -6,
    overflow: 'hidden',
    width: 34,
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  thumbnailFallback: {
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    flex: 1,
    justifyContent: 'center',
  },
  countText: {
    color: Colors.white,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  clearButton: {
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 38,
  },
  clearText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  compareButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  compareText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
});
