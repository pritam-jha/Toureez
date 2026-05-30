/**
 * @file components/ui/SearchBar.tsx
 * @description Pill-shaped search input with prefix and optional clear button.
 *
 *   <SearchBar
 *     value={search}
 *     onChangeText={setSearch}
 *     placeholder="Search vendors…"
 *     onClear={() => setSearch('')}
 *   />
 */

import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Layout, Radius, Spacing } from '../../constants/theme';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onClear,
  style,
  ...rest
}: SearchBarProps): React.ReactElement {
  const hasValue = value.length > 0;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.icon} accessibilityElementsHidden>
        🔍
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        {...rest}
      />
      {hasValue && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.clearBtn}
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    height: Layout.inputHeight,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.sm,
    color: Colors.textLight,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    paddingVertical: 0,
    minWidth: 0,
  },
  clearBtn: {
    marginLeft: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
