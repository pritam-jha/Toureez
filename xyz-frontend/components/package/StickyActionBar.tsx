/**
 * @file components/package/StickyActionBar.tsx
 * @description Fixed bottom action bar showing selected price,
 * "Add to Compare" button, and "Enquire Now" button.
 *
 * Animates in (slides up) when the user scrolls past the pricing section.
 * Uses Animated.Value driven by a boolean prop — the screen passes
 * `pricingVisible` which is false once the pricing section scrolls off screen.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 72;
const ANIMATION_DURATION = 240;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function fmt(amount: number): string {
  return currencyFormatter.format(amount);
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface StickyActionBarProps {
  /** The currently selected pricing tier, or null if none selected */
  selectedTier: PackageDetail['pricing'][number] | null;
  /** True while the pricing section is still visible on screen */
  pricingVisible: boolean;
  /** Whether the compare tray is already full (4 items) */
  isTrayFull: boolean;
  /** Whether this package is already in the compare tray */
  isInCompare: boolean;
  onComparePress: () => void;
  onEnquirePress: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StickyActionBar({
  selectedTier,
  pricingVisible,
  isTrayFull,
  isInCompare,
  onComparePress,
  onEnquirePress,
}: StickyActionBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(BAR_HEIGHT + insets.bottom)).current;

  // Slide in when pricing section scrolls off screen
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: pricingVisible ? BAR_HEIGHT + insets.bottom : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [pricingVisible, translateY, insets.bottom]);

  const effectivePrice = selectedTier
    ? (selectedTier.discounted_price ?? selectedTier.base_price)
    : null;

  const compareDisabled = isTrayFull && !isInCompare;

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + 8,
          transform: [{ translateY }],
        },
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel="Package actions"
    >
      {/* Price display */}
      <View style={styles.priceBlock}>
        {effectivePrice !== null ? (
          <>
            <Text style={styles.price} numberOfLines={1}>
              {fmt(effectivePrice)}
            </Text>
            <Text style={styles.perPerson} numberOfLines={1}>
              per person
            </Text>
          </>
        ) : (
          <Text style={styles.selectPlan} numberOfLines={1}>
            Select a plan ↑
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.buttons}>
        {/* Add to Compare */}
        <Pressable
          style={[
            styles.compareButton,
            isInCompare && styles.compareButtonActive,
            compareDisabled && styles.compareButtonDisabled,
          ]}
          onPress={onComparePress}
          disabled={compareDisabled}
          accessibilityRole="button"
          accessibilityLabel={
            isInCompare
              ? 'Remove from compare'
              : compareDisabled
              ? 'Compare tray is full'
              : 'Add to compare'
          }
          accessibilityState={{ disabled: compareDisabled, selected: isInCompare }}
        >
          <Ionicons
            name={isInCompare ? 'checkmark' : 'git-compare-outline'}
            size={15}
            color={
              compareDisabled
                ? Colors.muted
                : isInCompare
                ? Colors.white
                : Colors.primary
            }
          />
          <Text
            style={[
              styles.compareText,
              isInCompare && styles.compareTextActive,
              compareDisabled && styles.compareTextDisabled,
            ]}
            numberOfLines={1}
          >
            {isInCompare ? 'Added' : 'Compare'}
          </Text>
        </Pressable>

        {/* Enquire Now */}
        <Pressable
          style={styles.enquireButton}
          onPress={onEnquirePress}
          accessibilityRole="button"
          accessibilityLabel="Enquire about this package"
        >
          <Text style={styles.enquireText} numberOfLines={1}>
            Enquire Now
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 16,
    flexDirection: 'row',
    height: BAR_HEIGHT + 40, // extra for safe area
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    zIndex: 100,
  },
  priceBlock: {
    flex: 1,
    marginRight: 12,
  },
  price: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  perPerson: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 1,
  },
  selectPlan: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  buttons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 46,
    justifyContent: 'center',
    marginRight: 10,
    paddingHorizontal: 12,
  },
  compareButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  compareButtonDisabled: {
    borderColor: Colors.border,
  },
  compareText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginLeft: 5,
  },
  compareTextActive: {
    color: Colors.white,
  },
  compareTextDisabled: {
    color: Colors.muted,
  },
  enquireButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  enquireText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
});
