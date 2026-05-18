/**
 * @file components/ui/Button.tsx
 * @description Reusable accessible button for XYZ.
 *
 * Variants: primary | secondary | outline | ghost
 * - Shows ActivityIndicator when loading prop is true
 * - Disabled state is styled per-variant (transparent variants stay transparent)
 * - All colours sourced from constants/colors.ts — zero hardcoded hex values
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button label text */
  label: string;
  onPress?: TouchableOpacityProps['onPress'];
  /** Shows ActivityIndicator and disables interaction when true */
  loading?: boolean;
  /** Alias for loading — both are supported */
  isLoading?: boolean;
  /** Disables interaction and applies disabled styling */
  disabled?: boolean;
  /** Visual variant (default: 'primary') */
  variant?: ButtonVariant;
  /** Override the outer container style */
  style?: ViewStyle;
  /** Override the label text style */
  labelStyle?: TextStyle;
  /** Optional icon rendered to the left of the label */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered to the right of the label */
  rightIcon?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  loading = false,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
  labelStyle,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  const isBusy = loading || isLoading;
  const isDisabled = disabled || isBusy;

  // Spinner colour matches the label colour for each variant
  const spinnerColor =
    variant === 'outline' || variant === 'ghost'
      ? Colors.primary
      : Colors.textInverse;

  // Disabled spinner colour also matches the disabled label colour
  const disabledSpinnerColor =
    variant === 'outline' || variant === 'ghost'
      ? Colors.muted
      : Colors.textTertiary;

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isBusy }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles[`${variant}Disabled`],
        style,
      ]}
      {...rest}
    >
      {isBusy ? (
        <ActivityIndicator
          color={isDisabled ? disabledSpinnerColor : spinnerColor}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              styles[`${variant}Label`],
              isDisabled && styles[`${variant}LabelDisabled`],
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Base ──────────────────────────────────────────────────
  base: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  // ── Variant: primary ──────────────────────────────────────
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryDisabled: {
    backgroundColor: Colors.border,
    borderColor: Colors.border,
  },
  primaryLabel: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── Variant: secondary ────────────────────────────────────
  secondary: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  secondaryDisabled: {
    backgroundColor: Colors.border,
    borderColor: Colors.border,
  },
  secondaryLabel: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryLabelDisabled: {
    color: Colors.textTertiary,
  },

  // ── Variant: outline ──────────────────────────────────────
  outline: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.primary,
  },
  outlineDisabled: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.border,
  },
  outlineLabel: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  outlineLabelDisabled: {
    color: Colors.muted,
  },

  // ── Variant: ghost ────────────────────────────────────────
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
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostLabelDisabled: {
    color: Colors.muted,
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

  // ── Shared label base (overridden per variant above) ──────
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
