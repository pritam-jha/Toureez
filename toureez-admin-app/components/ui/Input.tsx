/**
 * @file components/ui/Input.tsx
 * @description Form text input with label, help, error, prefix and suffix slots.
 *
 * - Consistent 48px height (multiline grows past that)
 * - Focus ring driven by component state
 * - Error state takes precedence over focus styles
 * - Accepts the full TextInput prop surface
 */

import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Layout,
  Radius,
  Spacing,
} from '../../constants/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  help?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    help,
    error,
    prefix,
    suffix,
    multiline,
    onFocus,
    onBlur,
    containerStyle,
    inputStyle,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const showError = error !== undefined && error.length > 0;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.field,
          multiline === true && styles.fieldMultiline,
          focused && styles.fieldFocused,
          showError && styles.fieldError,
        ]}
      >
        {prefix !== undefined && <View style={styles.prefix}>{prefix}</View>}
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Colors.textLight}
          style={[
            styles.input,
            multiline === true && styles.inputMultiline,
            inputStyle,
          ]}
        />
        {suffix !== undefined && <View style={styles.suffix}>{suffix}</View>}
      </View>

      {showError ? (
        <Text style={styles.error}>{error}</Text>
      ) : help !== undefined ? (
        <Text style={styles.help}>{help}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    minHeight: 96,
  },
  fieldFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
  },
  fieldError: {
    borderColor: Colors.error,
    backgroundColor: Colors.surface,
  },
  prefix: { marginRight: Spacing.sm },
  suffix: { marginLeft: Spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 72,
    paddingVertical: 0,
  },
  help: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
});
