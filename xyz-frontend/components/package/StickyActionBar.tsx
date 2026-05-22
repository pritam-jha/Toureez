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
                ? Colors.textTertiary
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

        {/* Book Now */}
        <Pressable
          style={styles.enquireButton}
          onPress={onEnquirePress}
          accessibilityRole="button"
          accessibilityLabel="Book this package"
        >
          <Text style={styles.enquireText} numberOfLines={1}>
            Book Now
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
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 20,
    flexDirection: 'row',
    height: BAR_HEIGHT + 40,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    zIndex: 100,
  },
  priceBlock: {
    flex: 1,
    marginRight: 12,
  },
  price: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  perPerson: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 1,
  },
  selectPlan: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  compareButton: {
    alignItems: 'center',
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: Colors.backgroundLayer2,
    gap: 5,
  },
  compareButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compareButtonDisabled: {
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.backgroundLayer2,
  },
  compareText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  compareTextActive: {
    color: Colors.white,
  },
  compareTextDisabled: {
    color: Colors.textTertiary,
  },
  enquireButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  enquireText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
