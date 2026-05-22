/**
 * @file components/ui/SkeletonLoader.tsx
 * @description Premium Light shimmer skeleton loader.
 *
 * - Light grey base with shimmer pulse animation
 * - Animated loop using Animated.loop + Animated.timing
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 12,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.0],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
      accessibilityElementsHidden
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.backgroundLayer2,
  },
});

export function SkeletonRow(): React.ReactElement {
  return (
    <View style={rowStyles.container}>
      <SkeletonLoader width={40} height={40} borderRadius={12} />
      <View style={rowStyles.lines}>
        <SkeletonLoader width="70%" height={14} borderRadius={7} />
        <View style={rowStyles.gap} />
        <SkeletonLoader width="50%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lines: {
    flex: 1,
    marginLeft: 12,
  },
  gap: {
    height: 6,
  },
});
