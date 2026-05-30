/**
 * @file components/search/SearchHeader.tsx
 * @description NEXTTRP search input row.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

export interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  canGoBack?: boolean;
}

const HIT_SLOP = {
  bottom: 8,
  left: 8,
  right: 8,
  top: 8,
};

export function SearchHeader({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  activeFilterCount,
  canGoBack = false,
}: SearchHeaderProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  return (
    <View style={styles.container}>
      {canGoBack ? (
        <Pressable
          style={styles.iconButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={HIT_SLOP}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.navy} />
        </Pressable>
      ) : null}

      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <Ionicons name="search-outline" size={18} color={Colors.primary} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search destinations, packages..."
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Search destination"
        />
        {value.length > 0 ? (
          <Pressable
            style={styles.clearButton}
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textLight} />
          </Pressable>
        ) : null}
        {focused ? <View style={styles.focusDot} /> : null}
      </View>

      <Pressable
        style={[styles.filterButton, Shadows.soft]}
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilterCount > 0
            ? `Filters, ${activeFilterCount} active`
            : 'Open filters'
        }
        hitSlop={HIT_SLOP}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={activeFilterCount > 0 ? Colors.primary : Colors.navy}
        />
        {activeFilterCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {activeFilterCount > 9 ? '9+' : String(activeFilterCount)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: 8,
    width: 36,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    color: Colors.navy,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    padding: 2,
  },
  focusDot: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    height: 6,
    marginLeft: 8,
    width: 6,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    marginLeft: 10,
    position: 'relative',
    width: 48,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderColor: Colors.background,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
