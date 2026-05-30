/**
 * @file components/ui/Button.tsx
 * @description Reusable button component for the Vendor Portal.
 *
 * Supports multiple variants, sizes, loading states, and icons.
 * Matches the Button component API from NexTtrp-user for ecosystem consistency.
 */

import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'outlineBlue'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'small' | 'default' | 'large';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Style applied to the outer Animated.View wrapper (e.g. alignSelf). */
  containerStyle?: StyleProp<ViewStyle>;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  loading = false,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  containerStyle,
  style,
  labelStyle,
  leftIcon,
  rightIcon,
  accessibilityLabel,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const isBusy = loading || isLoading;
  const isDisabled = disabled || isBusy;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        styles.animatedWrap,
        fullWidth && styles.fullWidth,
        containerStyle,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: isBusy }}
        style={[
          styles.base,
          styles[size],
          styles[variant],
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'outlineBlue' || variant === 'ghost'
              ? Colors.primary
              : Colors.textWhite}
          />
        ) : (
          <View style={styles.content}>
            {leftIcon != null && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={[styles.label, styles[`${size}Label`], styles[`${variant}Label`], labelStyle]}>
              {label}
            </Text>
            {rightIcon != null && <View style={styles.iconRight}>{rightIcon}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  animatedWrap: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  // ── Sizes ────────────────────────────────────────────────
  small: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  default: { paddingHorizontal: 20, paddingVertical: 14 },
  large: { paddingHorizontal: 24, paddingVertical: 18, borderRadius: 14 },

  // ── Variants ─────────────────────────────────────────────
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.navy },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  outlineBlue: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.secondary },
  ghost: { backgroundColor: Colors.primaryLight },
  danger: { backgroundColor: Colors.error },
  success: { backgroundColor: Colors.success },

  disabled: { opacity: 0.48 },

  // ── Labels ────────────────────────────────────────────────
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  smallLabel: { fontSize: 13 },
  defaultLabel: { fontSize: 15 },
  largeLabel: { fontSize: 17 },

  primaryLabel: { color: Colors.textWhite },
  secondaryLabel: { color: Colors.textWhite },
  outlineLabel: { color: Colors.primary },
  outlineBlueLabel: { color: Colors.secondary },
  ghostLabel: { color: Colors.primary },
  dangerLabel: { color: Colors.textWhite },
  successLabel: { color: Colors.textWhite },
});
