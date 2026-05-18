/**
 * @file components/package/PhotoGallery.tsx
 * @description Full-width horizontal image pager with dot indicators,
 * image counter, fullscreen modal, back button, and share button.
 *
 * Built with ScrollView in pagingEnabled mode — no third-party pager
 * library required. Fullscreen uses a Modal with the same pager inside.
 */

import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../constants/colors';
import type { PackageImage } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_HEIGHT = 260;
const FULLSCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_DOTS = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCloudinaryUrl(url: string, width: number, height: number): string {
  const marker = '/image/upload/';
  if (!url.includes(marker)) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace(
    marker,
    `${marker}c_fill,w_${width},h_${height},f_auto,q_auto/`
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PhotoGalleryProps {
  images: PackageImage[];
  packageTitle: string;
  packageId: string;
}

// ── Fallback gradient ─────────────────────────────────────────────────────────

function GalleryFallback(): React.ReactElement {
  return (
    <View style={styles.fallback}>
      <Ionicons name="image-outline" size={48} color={Colors.muted} />
      <Text style={styles.fallbackText} numberOfLines={1}>
        No photos available
      </Text>
    </View>
  );
}

// ── Dot indicators ────────────────────────────────────────────────────────────

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps): React.ReactElement | null {
  if (count <= 1) return null;
  const visible = Math.min(count, MAX_DOTS);

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: visible }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex % visible && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhotoGallery({
  images,
  packageTitle,
  packageId,
}: PhotoGalleryProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fullscreenScrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const handleFullscreenScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setFullscreenIndex(index);
  }, []);

  const openFullscreen = useCallback((index: number) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenVisible(false);
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this travel package: ${packageTitle}`,
        title: packageTitle,
      });
    } catch {
      // Share cancelled — no-op
    }
  }, [packageTitle]);

  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <GalleryFallback />
        {/* Overlay buttons on fallback too */}
        <View style={[styles.overlayButtons, { top: insets.top + 8 }]}>
          <Pressable
            style={styles.overlayButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </Pressable>
          <Pressable
            style={styles.overlayButton}
            onPress={() => void handleShare()}
            accessibilityRole="button"
            accessibilityLabel="Share package"
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
        accessibilityRole="scrollbar"
        accessibilityLabel={`Photo gallery, ${images.length} photos`}
      >
        {images.map((img, index) => (
          <Pressable
            key={img.id}
            onPress={() => openFullscreen(index)}
            accessibilityRole="button"
            accessibilityLabel={img.alt_text ?? `Photo ${index + 1} of ${images.length}`}
          >
            <Image
              source={{
                uri: getCloudinaryUrl(img.url, SCREEN_WIDTH * 2, GALLERY_HEIGHT * 2),
              }}
              style={styles.image}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Counter top-right */}
      <View style={[styles.counter, { top: insets.top + 8 }]}>
        <Text style={styles.counterText} numberOfLines={1}>
          {activeIndex + 1} / {images.length}
        </Text>
      </View>

      {/* Back + Share buttons */}
      <View style={[styles.overlayButtons, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.overlayButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </Pressable>
        <Pressable
          style={styles.overlayButton}
          onPress={() => void handleShare()}
          accessibilityRole="button"
          accessibilityLabel="Share package"
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {/* Dot indicators */}
      <Dots count={images.length} activeIndex={activeIndex} />

      {/* Fullscreen modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeFullscreen}
        statusBarTranslucent
      >
        <View style={styles.fullscreenContainer}>
          <ScrollView
            ref={fullscreenScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleFullscreenScroll}
            scrollEventThrottle={16}
            contentOffset={{ x: fullscreenIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((img, index) => (
              <View key={img.id} style={styles.fullscreenSlide}>
                <Image
                  source={{
                    uri: getCloudinaryUrl(img.url, SCREEN_WIDTH * 2, FULLSCREEN_HEIGHT),
                  }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                  accessibilityLabel={img.alt_text ?? `Photo ${index + 1}`}
                />
              </View>
            ))}
          </ScrollView>

          {/* Fullscreen counter */}
          <View style={[styles.fullscreenCounter, { top: insets.top + 16 }]}>
            <Text style={styles.counterText} numberOfLines={1}>
              {fullscreenIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Close button */}
          <Pressable
            style={[styles.fullscreenClose, { top: insets.top + 8 }]}
            onPress={closeFullscreen}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={Colors.white} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    height: GALLERY_HEIGHT,
    width: '100%',
    backgroundColor: Colors.border,
    position: 'relative',
  },
  pager: {
    height: GALLERY_HEIGHT,
    width: SCREEN_WIDTH,
  },
  image: {
    height: GALLERY_HEIGHT,
    width: SCREEN_WIDTH,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  fallbackText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 8,
  },
  overlayButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
  },
  overlayButton: {
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  counter: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 12,
  },
  counterText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  dotsRow: {
    alignItems: 'center',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  dot: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 4,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
  // Fullscreen
  fullscreenContainer: {
    backgroundColor: Colors.textPrimary,
    flex: 1,
  },
  fullscreenSlide: {
    height: FULLSCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    height: FULLSCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  fullscreenCounter: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
  },
  fullscreenClose: {
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: 40,
  },
});
