/**
 * @file components/ui/Card.tsx
 * @description Reusable surface container.
 *
 * Variants:
 *   - default  → white surface, hairline border, subtle shadow
 *   - elevated → white surface, no border, medium shadow
 *   - flat     → white surface with border only (no shadow)
 *   - ghost    → fully transparent / no border / no shadow
 *
 * Padding options: none | sm | md | lg
 *
 * If `onPress` is provided the Card renders as a TouchableOpacity.
 */

import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadows, Spacing } from '../../constants/theme';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends Omit<ViewProps, 'style'> {
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const paddingMap: Record<CardPadding, ViewStyle> = {
  none: { padding: 0 },
  sm: { padding: Spacing.md },
  md: { padding: Spacing.lg },
  lg: { padding: Spacing.xl },
};

export function Card({
  variant = 'default',
  padding = 'md',
  onPress,
  disabled,
  children,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const composedStyle: StyleProp<ViewStyle> = [
    styles.base,
    paddingMap[padding],
    variant === 'default' && [styles.default, Shadows.sm],
    variant === 'elevated' && [styles.elevated, Shadows.md],
    variant === 'flat' && styles.flat,
    variant === 'ghost' && styles.ghost,
    style,
  ];

  if (onPress !== undefined) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.75}
        onPress={onPress}
        disabled={disabled}
        style={composedStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={composedStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  elevated: {
    backgroundColor: Colors.surface,
  },
  flat: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
