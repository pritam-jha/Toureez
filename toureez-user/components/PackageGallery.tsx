/**
 * @file components/PackageGallery.tsx
 * @description Full-screen swipeable image gallery modal.
 *
 * Usage:
 *   <PackageGallery images={pkg.images} visible={open} initialIndex={0} onClose={() => setOpen(false)} />
 */

import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PackageImage } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  images: PackageImage[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

export function PackageGallery({ images, visible, initialIndex = 0, onClose }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Close button */}
        <Pressable
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close gallery"
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        {/* Counter */}
        <View style={[styles.counter, { top: insets.top + 18 }]}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>

        {/* Images */}
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(img) => img.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_data, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={item.alt_text ?? 'Package photo'}
              />
            </View>
          )}
        />

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={[styles.dots, { bottom: insets.bottom + 24 }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  slide: { width: SCREEN_W, height: SCREEN_H, justifyContent: 'center' },
  image: { width: SCREEN_W, height: SCREEN_H },
  dots: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
});
