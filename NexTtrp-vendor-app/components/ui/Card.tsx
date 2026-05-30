/**
 * @file components/ui/Card.tsx
 * @description Reusable card container with optional press interaction.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

export interface CardProps {
  children: React.ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 16,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const inner = (
    <View style={[styles.card, Shadows.card, { padding }, style]}>
      {children}
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
};

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
