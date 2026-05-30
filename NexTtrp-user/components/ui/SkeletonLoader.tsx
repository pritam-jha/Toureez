/**
 * @file components/ui/SkeletonLoader.tsx
 * @description NEXTTRP shimmer skeleton.
 */

import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useShimmer } from '../../utils/animations';

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
  const shimmer = useShimmer();
  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.65, 1, 0.65],
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

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.divider,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
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
