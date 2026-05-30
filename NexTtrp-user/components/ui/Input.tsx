/**
 * @file components/ui/Input.tsx
 * @description NEXTTRP input field.
 */

import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

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
      onBlur,
      onFocus,
      placeholderTextColor = Colors.textLight,
      showSoftInputOnFocus = true,
      style: inputStyle,
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

        <View
          collapsable={false}
          style={[
            styles.inputRow,
            isFocused && styles.inputRowFocused,
            hasError && styles.inputRowError,
            isDisabled && styles.inputRowDisabled,
            isFocused && Shadows.soft,
          ]}
        >
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <TextInput
            {...textInputProps}
            ref={ref}
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeftIcon : null,
              rightIcon ? styles.inputWithRightIcon : null,
              isDisabled ? styles.inputDisabled : null,
              inputStyle,
            ]}
            placeholderTextColor={placeholderTextColor}
            editable={editable}
            showSoftInputOnFocus={showSoftInputOnFocus}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            accessibilityLabel={label}
            accessibilityHint={helperText}
            accessibilityState={{ disabled: isDisabled }}
          />
          {rightIcon ? (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              accessibilityRole={onRightIconPress ? 'button' : 'none'}
              hitSlop={styles.hitSlop}
            >
              {rightIcon}
            </TouchableOpacity>
          ) : null}
        </View>

        {hasError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: Colors.primary,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 15,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
  },
  inputRowError: {
    borderColor: Colors.error,
  },
  inputRowDisabled: {
    backgroundColor: Colors.backgroundSoft,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
  input: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginTop: 6,
  },
  helperText: {
    color: Colors.textLight,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 6,
  },
  hitSlop: {
    bottom: 8,
    left: 8,
    right: 8,
    top: 8,
  },
});
