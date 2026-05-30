/**
 * @file components/ui/Button.tsx
 * @description Primary action button with full variant + size matrix.
 *
 * Variants:
 *   primary | secondary | ghost | danger | success | outline
 *
 * Sizes:
 *   sm (32) | md (40) | lg (48)
 *
 * Loading state replaces the label with an ActivityIndicator while
 * preserving the button's width.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Radius,
  Spacing,
  TouchTarget,
} from '../../constants/theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  children?: React.ReactNode;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

interface VariantStyle {
  container: ViewStyle;
  text: TextStyle;
  spinner: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    container: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    text: { color: Colors.textWhite },
    spinner: Colors.textWhite,
  },
  secondary: {
    container: {
      backgroundColor: Colors.secondaryLight,
      borderColor: Colors.secondaryLight,
    },
    text: { color: Colors.secondary },
    spinner: Colors.secondary,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    text: { color: Colors.text },
    spinner: Colors.text,
  },
  danger: {
    container: { backgroundColor: Colors.error, borderColor: Colors.error },
    text: { color: Colors.textWhite },
    spinner: Colors.textWhite,
  },
  success: {
    container: { backgroundColor: Colors.success, borderColor: Colors.success },
    text: { color: Colors.textWhite },
    spinner: Colors.textWhite,
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: Colors.border,
    },
    text: { color: Colors.text },
    spinner: Colors.text,
  },
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number }
> = {
  sm: { height: 32, paddingH: Spacing.md, fontSize: 13 },
  md: { height: 40, paddingH: Spacing.lg, fontSize: 14 },
  lg: { height: TouchTarget.comfortable, paddingH: Spacing.xl, fontSize: 15 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onPress,
  children,
  label,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: ButtonProps): React.ReactElement {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof (label ?? children) === 'string' ? String(label ?? children) : undefined)}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.82}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        v.container,
        {
          height: s.height,
          paddingHorizontal: s.paddingH,
          minWidth: TouchTarget.min,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinner} />
      ) : (
        <View style={styles.row}>
          {icon !== undefined && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              v.text,
              { fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {label ?? children}
          </Text>
          {icon !== undefined && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  disabled: { opacity: 0.45 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
