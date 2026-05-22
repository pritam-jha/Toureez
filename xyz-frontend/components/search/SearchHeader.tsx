/**
 * @file components/search/SearchHeader.tsx
 * @description Search input row with back button, mic icon, and filter badge.
 */

import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  /** Whether the screen was pushed from another screen (shows back button) */
  canGoBack?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchHeader({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  activeFilterCount,
  canGoBack = false,
}: SearchHeaderProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Back button */}
      {canGoBack && (
        <Pressable
          style={styles.iconButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={Colors.textPrimary}
          />
        </Pressable>
      )}

      {/* Search input */}
      <View style={styles.inputWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color={Colors.textTertiary}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Search destinations, packages…"
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Search destination"
        />

        {/* Clear button */}
        {value.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}

        {/* Mic icon — UI only, no functionality in Phase 1 */}
        {value.length === 0 && (
          <View style={styles.micButton} accessibilityElementsHidden>
            <Ionicons
              name="mic-outline"
              size={18}
              color={Colors.textTertiary}
            />
          </View>
        )}
      </View>

      {/* Filter button */}
      <Pressable
        style={styles.filterButton}
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilterCount > 0
            ? `Filters, ${activeFilterCount} active`
            : 'Open filters'
        }
        hitSlop={8}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={activeFilterCount > 0 ? Colors.primary : Colors.textPrimary}
        />
        {activeFilterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {activeFilterCount > 9 ? '9+' : String(activeFilterCount)}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 14,
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
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    color: Colors.textPrimary,
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
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    padding: 2,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    marginLeft: 10,
    position: 'relative',
    width: 48,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderColor: Colors.backgroundBase,
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
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
