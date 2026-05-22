/**
 * @file components/ui/Input.tsx
 * @description Premium Light 3D input field.
 *
 * - White surface with subtle border
 * - Focus: navy border + soft blue glow shadow
 * - Error: red border + error text below
 * - Label: 12px semibold with navy required asterisk
 * - Left/right icon slots
 * - 3D depth: inner top highlight + bottom shadow strip
 * - Forwards ref for programmatic focus
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      required = false,
      editable = true,
      ...textInputProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const hasError = Boolean(error);
    const isDisabled = editable === false;

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        ) : null}

        {/* Outer glow wrapper — only visible on focus */}
        <View
          style={[
            styles.glowWrapper,
            isFocused && styles.glowWrapperFocused,
            hasError && styles.glowWrapperError,
          ]}
        >
          <View
            style={[
              styles.inputRow,
              isFocused && styles.inputRowFocused,
              hasError && styles.inputRowError,
              isDisabled && styles.inputRowDisabled,
            ]}
          >
            {/* Inner top highlight — 3D light source */}
            <View style={styles.topEdge} pointerEvents="none" />

            {leftIcon ? (
              <View style={styles.leftIconContainer}>{leftIcon}</View>
            ) : null}

            <TextInput
              ref={ref}
              style={[
                styles.input,
                leftIcon ? styles.inputWithLeftIcon : null,
                rightIcon ? styles.inputWithRightIcon : null,
                isDisabled ? styles.inputDisabled : null,
              ]}
              placeholderTextColor={Colors.textTertiary}
              editable={editable}
              onFocus={(e) => {
                setIsFocused(true);
                textInputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                textInputProps.onBlur?.(e);
              }}
              accessibilityLabel={label}
              accessibilityHint={helperText}
              accessibilityState={{ disabled: isDisabled }}
              {...textInputProps}
            />

            {rightIcon ? (
              <TouchableOpacity
                style={styles.rightIconContainer}
                onPress={onRightIconPress}
                disabled={!onRightIconPress}
                accessibilityRole={onRightIconPress ? 'button' : 'none'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {rightIcon}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {hasError ? (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  required: {
    color: Colors.primary,
  },
  glowWrapper: {
    borderRadius: 14,
  },
  glowWrapperFocused: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  glowWrapperError: {
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    backgroundColor: Colors.surfacePrimary,
    minHeight: 52,
    overflow: 'hidden',
    position: 'relative',
    // Subtle 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.80)',
    zIndex: 1,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.surfacePrimary,
  },
  inputRowError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  inputRowDisabled: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorderDim,
  },
  leftIconContainer: {
    paddingLeft: 14,
    paddingRight: 4,
  },
  rightIconContainer: {
    paddingRight: 14,
    paddingLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWithLeftIcon: {
    paddingLeft: 4,
  },
  inputWithRightIcon: {
    paddingRight: 4,
  },
  inputDisabled: {
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 6,
    marginLeft: 4,
  },
});
