/**
 * @file components/package/PricingSection.tsx
 * @description Pricing tier cards with selection state.
 * The selected tier drives the sticky action bar price via a callback.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type PricingTier = PackageDetail['pricing'][number];

// ── Helpers ───────────────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

function fmt(amount: number): string {
  return currencyFormatter.format(amount);
}

const SEASON_LABELS: Record<string, string> = {
  peak: 'Peak Season',
  'off-peak': 'Off-Peak',
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PricingSectionProps {
  pricing: PricingTier[];
  selectedTierId: string | null;
  onSelectTier: (tier: PricingTier) => void;
}

// ── Tier card ─────────────────────────────────────────────────────────────────

interface TierCardProps {
  tier: PricingTier;
  isSelected: boolean;
  onPress: (tier: PricingTier) => void;
}

function TierCard({ tier, isSelected, onPress }: TierCardProps): React.ReactElement {
  const effectivePrice = tier.discounted_price ?? tier.base_price;
  const hasDiscount =
    tier.discounted_price !== null &&
    tier.discounted_price < tier.base_price;
  const savings = hasDiscount ? tier.base_price - (tier.discounted_price ?? 0) : 0;

  return (
    <Pressable
      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
      onPress={() => onPress(tier)}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${tier.label}, ${tier.min_people} to ${tier.max_people} people, ${fmt(effectivePrice)} per person`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <View style={styles.selectedDot}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
        </View>
      )}

      {/* Season badge */}
      {tier.season !== 'all' && (
        <View style={[
          styles.seasonBadge,
          tier.season === 'peak' ? styles.seasonPeak : styles.seasonOffPeak,
        ]}>
          <Text style={styles.seasonText} numberOfLines={1}>
            {SEASON_LABELS[tier.season]}
          </Text>
        </View>
      )}

      {/* Label */}
      <Text style={[styles.tierLabel, isSelected && styles.tierLabelSelected]} numberOfLines={1}>
        {tier.label}
      </Text>

      {/* People range */}
      <View style={styles.peopleRow}>
        <Ionicons name="people-outline" size={13} color={Colors.textTertiary} />
        <Text style={styles.peopleText} numberOfLines={1}>
          {tier.min_people}–{tier.max_people} people
        </Text>
      </View>

      {/* Price */}
      {hasDiscount && (
        <Text style={styles.basePrice} numberOfLines={1}>
          {fmt(tier.base_price)}
        </Text>
      )}
      <Text style={[styles.finalPrice, isSelected && styles.finalPriceSelected]} numberOfLines={1}>
        {fmt(effectivePrice)}
      </Text>
      <Text style={styles.perPerson} numberOfLines={1}>per person</Text>

      {/* Savings */}
      {savings > 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText} numberOfLines={1}>
            Save {fmt(savings)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PricingSection({
  pricing,
  selectedTierId,
  onSelectTier,
}: PricingSectionProps): React.ReactElement | null {
  const handlePress = useCallback(
    (tier: PricingTier) => {
      onSelectTier(tier);
    },
    [onSelectTier]
  );

  if (pricing.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Choose Your Plan
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pricing.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedTierId === tier.id}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  tierCard: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 12,
    minWidth: 160,
    padding: 16,
    position: 'relative',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tierCardSelected: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedDot: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  seasonBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  seasonPeak: {
    backgroundColor: Colors.warningLight,
  },
  seasonOffPeak: {
    backgroundColor: Colors.infoLight,
  },
  seasonText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    color: Colors.textSecondary,
  },
  tierLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  tierLabelSelected: {
    color: Colors.primary,
  },
  peopleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    gap: 4,
  },
  peopleText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  basePrice: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  finalPriceSelected: {
    color: Colors.primary,
  },
  perPerson: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 8,
    marginTop: 2,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
