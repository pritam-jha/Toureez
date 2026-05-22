/**
 * @file components/ui/Card.tsx
 * @description Premium Light 3D floating card.
 *
 * - White surface with subtle border
 * - Multi-layer 3D shadow for genuine depth
 * - Inner top highlight strip (light source simulation)
 * - Press: Animated.spring scale 0.97
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

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
  glowColor,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scale]);

  const glowShadow: ViewStyle | undefined = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      }
    : undefined;

  const cardContent = (
    <View
      style={[
        styles.card,
        { padding },
        Shadows.glassCard,
        glowShadow,
        style,
      ]}
    >
      {/* Top inner highlight — 3D light source from above */}
      <View style={styles.topEdge} pointerEvents="none" />
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {cardContent}
        </Pressable>
      </Animated.View>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.90)',
    zIndex: 1,
  },
});
