/**
 * @file components/ui/Card.tsx
 * @description Toureez animated card.
 */

import React from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import { use3DCard } from '../../utils/animations';

export interface CardProps {
  children: React.ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  glowColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 16,
  onPress,
  style,
  accessibilityLabel,
  glowColor: _glowColor,
}) => {
  const card3D = use3DCard();

  return (
    <Animated.View style={[card3D.animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={card3D.onPressIn}
        onPressOut={card3D.onPressOut}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'none'}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.card, Shadows.card, style, { padding }]}>
          {children}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
