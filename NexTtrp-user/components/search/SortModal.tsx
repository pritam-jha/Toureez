/**
 * @file components/search/SortModal.tsx
 * @description Bottom modal for selecting the sort order of search results.
 *
 * Implemented with React Native's built-in Modal — no third-party sheet
 * library required. Slides up from the bottom with a smooth animation.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SORT_OPTIONS } from '../../hooks/useSearch';
import { Colors } from '../../constants/colors';
import type { SortOption } from '../../hooks/useSearch';

// ── Constants ─────────────────────────────────────────────────────────────────

const SHEET_HEIGHT = 340;
const ANIMATION_DURATION = 260;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SortModalProps {
  visible: boolean;
  selectedSort: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SortModal({
  visible,
  selectedSort,
  onSelect,
  onClose,
}: SortModalProps): React.ReactElement {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleSelect = useCallback(
    (sort: SortOption) => {
      onSelect(sort);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          <Text style={styles.title} numberOfLines={1}>
            Sort by
          </Text>

          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === selectedSort;
            return (
              <Pressable
                key={option.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                {isSelected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.primary}
                  />
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfacePrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceBorderStrong,
    borderRadius: 3,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  option: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: Colors.primaryGlow,
  },
  optionText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginRight: 12,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  radioEmpty: {
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
});
