/**
 * @file components/ui/Button.tsx
 * @description Premium Light 3D button component.
 *
 * Variants: primary (deep navy) | secondary (light) | outline | ghost | danger
 * Sizes: default | small
 * - Rounded corners (borderRadius: 14 default, 10 small)
 * - Multi-layer 3D shadow on primary
 * - Inner top highlight strip (light source simulation)
 * - Press scale animation (0.97)
 * - Loading state with ActivityIndicator
 * - All colours from constants/colors.ts
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityState?: object;
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
  style,
  labelStyle,
  leftIcon,
  rightIcon,
  accessibilityLabel,
}) => {
  const isBusy = loading || isLoading;
  const isDisabled = disabled || isBusy;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [scale]);

  const spinnerColor = variant === 'primary' ? Colors.white : Colors.primary;

  const containerStyle = [
    styles.base,
    size === 'small' ? styles.baseSmall : styles.baseDefault,
    styles[variant],
    isDisabled && (styles[`${variant}Disabled` as keyof typeof styles] as ViewStyle),
    fullWidth && styles.fullWidth,
    // 3D shadow only on primary
    variant === 'primary' && !isDisabled ? Shadows.neonGlow : undefined,
    style,
  ];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: isBusy }}
        style={containerStyle}
      >
        {/* Inner top highlight strip — simulates 3D light source */}
        {(variant === 'primary' || variant === 'secondary') && !isDisabled && (
          <View style={styles.innerHighlight} pointerEvents="none" />
        )}
        {/* Inner bottom shadow strip — simulates 3D depth */}
        {variant === 'primary' && !isDisabled && (
          <View style={styles.innerShadow} pointerEvents="none" />
        )}

        {isBusy ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <View style={styles.content}>
            {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                size === 'small' ? styles.labelSmall : styles.labelDefault,
                styles[`${variant}Label` as keyof typeof styles] as TextStyle,
                isDisabled && (styles[`${variant}LabelDisabled` as keyof typeof styles] as TextStyle),
                labelStyle,
              ]}
            >
              {label}
            </Text>
            {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  baseDefault: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    minHeight: 52,
  },
  baseSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  fullWidth: {
    width: '100%',
  },

  // ── Inner 3D light/shadow strips ─────────────────────────
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderRadius: 14,
  },
  innerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
  },

  // ── primary — Deep Navy ───────────────────────────────────
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryDisabled: {
    backgroundColor: Colors.backgroundLayer3,
    borderColor: Colors.surfaceBorder,
  },
  primaryLabel: {
    color: Colors.white,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  primaryLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── secondary — Light surface ─────────────────────────────
  secondary: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorderStrong,
  },
  secondaryDisabled: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorderDim,
  },
  secondaryLabel: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── outline ───────────────────────────────────────────────
  outline: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  outlineDisabled: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.surfaceBorder,
  },
  outlineLabel: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── ghost ─────────────────────────────────────────────────
  ghost: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.transparent,
  },
  ghostDisabled: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.transparent,
  },
  ghostLabel: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ghostLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── danger ────────────────────────────────────────────────
  danger: {
    backgroundColor: Colors.errorLight,
    borderColor: 'rgba(229,62,62,0.25)',
  },
  dangerDisabled: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorder,
  },
  dangerLabel: {
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── Icon layout ───────────────────────────────────────────
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },

  // ── Shared label base ─────────────────────────────────────
  label: {
    textAlign: 'center',
  },
  labelDefault: {
    fontSize: 15,
  },
  labelSmall: {
    fontSize: 13,
  },
});
