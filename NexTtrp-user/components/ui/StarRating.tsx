/**
 * @file components/ui/StarRating.tsx
 * @description Toureez star rating with display and interactive modes.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  size = 14,
  interactive = false,
  onChange,
}: StarRatingProps): React.ReactElement {
  const handlePress = useCallback(
    (nextRating: number) => {
      onChange?.(nextRating);
    },
    [onChange]
  );

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = rating >= starValue;
        const half = !filled && rating >= starValue - 0.5;
        const iconName = filled ? 'star' : half ? 'star-half' : 'star-outline';
        const icon = (
          <Ionicons
            name={iconName}
            size={size}
            color={filled || half ? Colors.star : Colors.border}
          />
        );

        if (!interactive) {
          return <View key={starValue}>{icon}</View>;
        }

        return (
          <Pressable
            key={starValue}
            onPress={() => handlePress(starValue)}
            accessibilityRole="button"
            accessibilityLabel={`${starValue} star rating`}
            hitSlop={styles.hitSlop}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  hitSlop: {
    bottom: 8,
    left: 8,
    right: 8,
    top: 8,
  },
});
