/**
 * @file components/ui/Button.tsx
 * @description Toureez button component.
 */

import React, { useCallback, useRef } from 'react';
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

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'navy'
  | 'outline'
  | 'outlineBlue'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'default' | 'small' | 'large';

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

  const spinnerColor =
    variant === 'outline' || variant === 'outlineBlue' || variant === 'ghost'
      ? Colors.primary
      : Colors.textWhite;

  return (
    <Animated.View
      style={[
        styles.animatedWrap,
        fullWidth && styles.fullWidth,
        styles.animatedScale,
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
          variant === 'primary' && !isDisabled && Shadows.glow,
          variant === 'secondary' && !isDisabled && Shadows.blue,
          style,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <View style={styles.content}>
            {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                styles[`${size}Label` as keyof typeof styles] as TextStyle,
                styles[`${variant}Label` as keyof typeof styles] as TextStyle,
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

const styles = StyleSheet.create({
  animatedWrap: {
    alignSelf: 'flex-start',
  },
  animatedScale: {},
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  base: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  default: {
    minHeight: 52,
    paddingHorizontal: 28,
    paddingVertical: 15,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  large: {
    minHeight: 58,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  accent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  navy: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.primary,
  },
  outlineBlue: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.secondary,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorLight,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultLabel: {
    fontSize: 15,
  },
  smallLabel: {
    fontSize: 13,
  },
  largeLabel: {
    fontSize: 17,
  },
  primaryLabel: {
    color: Colors.textWhite,
  },
  secondaryLabel: {
    color: Colors.textWhite,
  },
  accentLabel: {
    color: Colors.navy,
    fontWeight: '700',
  },
  navyLabel: {
    color: Colors.textWhite,
  },
  outlineLabel: {
    color: Colors.primary,
  },
  outlineBlueLabel: {
    color: Colors.secondary,
  },
  ghostLabel: {
    color: Colors.primary,
  },
  dangerLabel: {
    color: Colors.error,
  },
});
