/**
 * @file components/ui/Input.tsx
 * @description Reusable, accessible text input component.
 *
 * - Label rendered above the field
 * - Red border + inline error message when `error` prop is set
 * - Focus state border highlight
 * - Left/right icon slots with optional press handler on right icon
 * - Forwards ref to the underlying TextInput for programmatic focus
 * - All colours from constants/colors.ts — zero hardcoded hex values
 * - Pure presentational — no form library coupling
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
  /** Label displayed above the input */
  label?: string;
  /**
   * Error message displayed below the input.
   * Also applies red border styling when set.
   */
  error?: string;
  /** Helper text displayed below the input when no error is present */
  helperText?: string;
  /** Icon rendered on the left side of the input */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right side of the input (e.g. password toggle) */
  rightIcon?: React.ReactNode;
  /** Called when the right icon is pressed */
  onRightIconPress?: () => void;
  /** Override the outer container style */
  containerStyle?: ViewStyle;
  /** Whether the field is required — adds an asterisk to the label */
  required?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Labelled text input with error and helper text support.
 *
 * Forwards the ref to the underlying TextInput so parent components
 * can call .focus() / .blur() programmatically (e.g. for form tab navigation).
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="you@example.com"
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   error={errors.email}
 *   value={email}
 *   onChangeText={setEmail}
 * />
 */
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
        {/* Label */}
        {label ? (
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        ) : null}

        {/* Input row */}
        <View
          style={[
            styles.inputRow,
            isFocused && styles.inputRowFocused,
            hasError && styles.inputRowError,
            isDisabled && styles.inputRowDisabled,
          ]}
        >
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
            placeholderTextColor={Colors.muted}
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

        {/* Error / Helper text */}
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: Colors.error,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    minHeight: 50,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
  },
  inputRowError: {
    borderColor: Colors.error,
  },
  inputRowDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    marginTop: 5,
    marginLeft: 2,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 5,
    marginLeft: 2,
  },
});
