/**
 * @file app/(vendor)/packages/[id]/pricing.tsx
 * @description Pricing tiers editor for a vendor package.
 *
 * Allows vendors to add, edit, and remove pricing tiers (e.g. solo, couple,
 * group). Each tier defines a people range, base price, and optional
 * discounted price. Changes are saved via useUpsertPricing().
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useVendorPackage, useUpsertPricing } from '../../../../hooks/useVendorPackages';
import { Header } from '../../../../components/ui/Header';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { InlineLoader } from '../../../../components/ui/LoadingSpinner';
import { Colors } from '../../../../constants/colors';
import { Shadows } from '../../../../constants/shadows';
import type { VendorPricingTier } from '../../../../types';

// ── Tier draft type ───────────────────────────────────────────────────────────

interface TierDraft {
  id?: string;
  label: string;
  min_people: string;
  max_people: string;
  base_price: string;
  discounted_price: string;
  season: 'all' | 'peak' | 'off-peak';
  is_active: boolean;
}

function tierToFormDraft(tier: VendorPricingTier): TierDraft {
  return {
    id: tier.id,
    label: tier.label,
    min_people: String(tier.min_people),
    max_people: String(tier.max_people),
    base_price: String(tier.base_price),
    discounted_price: tier.discounted_price != null ? String(tier.discounted_price) : '',
    season: tier.season,
    is_active: tier.is_active,
  };
}

function emptyDraft(): TierDraft {
  return {
    label: '',
    min_people: '1',
    max_people: '2',
    base_price: '',
    discounted_price: '',
    season: 'all',
    is_active: true,
  };
}

// ── Tier form ─────────────────────────────────────────────────────────────────

interface TierFormProps {
  tier: TierDraft;
  index: number;
  onChange: (index: number, field: keyof TierDraft, value: string | boolean) => void;
  onRemove: (index: number) => void;
}

function TierForm({ tier, index, onChange, onRemove }: TierFormProps): React.ReactElement {
  const SEASON_OPTIONS: Array<{ label: string; value: 'all' | 'peak' | 'off-peak' }> = [
    { label: 'All Year', value: 'all' },
    { label: 'Peak Season', value: 'peak' },
    { label: 'Off-Peak', value: 'off-peak' },
  ];

  return (
    <View style={[formStyles.card, Shadows.sm]}>
      <View style={formStyles.cardHeader}>
        <View style={formStyles.tierBadge}>
          <Text style={formStyles.tierNumber}>Tier {index + 1}</Text>
        </View>
        <View style={formStyles.activeToggle}>
          <Text style={formStyles.activeLabel}>Active</Text>
          <Switch
            value={tier.is_active}
            onValueChange={(v) => onChange(index, 'is_active', v)}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={tier.is_active ? Colors.primary : Colors.textLight}
          />
        </View>
        <Pressable
          onPress={() => onRemove(index)}
          hitSlop={8}
          style={formStyles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel="Remove tier"
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </Pressable>
      </View>

      <Input
        label="Tier Label"
        required
        value={tier.label}
        onChangeText={(v) => onChange(index, 'label', v)}
        placeholder="e.g. Solo Traveler, Couple, Group of 4"
        leftIcon={<Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />}
      />

      <View style={formStyles.row}>
        <View style={formStyles.col}>
          <Input
            label="Min People"
            required
            value={tier.min_people}
            onChangeText={(v) => onChange(index, 'min_people', v)}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>
        <View style={formStyles.col}>
          <Input
            label="Max People"
            required
            value={tier.max_people}
            onChangeText={(v) => onChange(index, 'max_people', v)}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="people-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>
      </View>

      <View style={formStyles.row}>
        <View style={formStyles.col}>
          <Input
            label="Base Price (₹)"
            required
            value={tier.base_price}
            onChangeText={(v) => onChange(index, 'base_price', v)}
            keyboardType="decimal-pad"
            placeholder="e.g. 25000"
            leftIcon={<Ionicons name="cash-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>
        <View style={formStyles.col}>
          <Input
            label="Discounted Price (₹)"
            value={tier.discounted_price}
            onChangeText={(v) => onChange(index, 'discounted_price', v)}
            keyboardType="decimal-pad"
            placeholder="Optional"
            hint="Leave blank if no discount"
            leftIcon={<Ionicons name="cut-outline" size={18} color={Colors.textSecondary} />}
          />
        </View>
      </View>

      <View>
        <Text style={formStyles.seasonLabel}>Season</Text>
        <View style={formStyles.seasonRow}>
          {SEASON_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[formStyles.seasonChip, tier.season === opt.value && formStyles.seasonChipActive]}
              onPress={() => onChange(index, 'season', opt.value)}
            >
              <Text style={[formStyles.seasonText, tier.season === opt.value && formStyles.seasonTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tierBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  activeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  activeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  removeBtn: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: { flex: 1 },
  seasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 8,
    marginTop: 8,
  },
  seasonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seasonChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  seasonChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  seasonTextActive: {
    color: Colors.textWhite,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PricingScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading } = useVendorPackage(id ?? '');
  const upsertPricing = useUpsertPricing(id ?? '');

  const [tiers, setTiers] = useState<TierDraft[]>([]);

  useEffect(() => {
    if (pkg?.pricing != null) {
      setTiers(pkg.pricing.map(tierToFormDraft));
    }
  }, [pkg?.pricing]);

  const handleChange = useCallback(
    (index: number, field: keyof TierDraft, value: string | boolean) => {
      setTiers((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
      );
    },
    [],
  );

  const handleRemove = useCallback((index: number) => {
    Alert.alert('Remove Tier', 'Remove this pricing tier?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setTiers((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  }, []);

  const handleAddTier = useCallback(() => {
    setTiers((prev) => [...prev, emptyDraft()]);
  }, []);

  const validateTiers = (): boolean => {
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (!t.label.trim()) {
        Alert.alert('Validation', `Tier ${i + 1}: Label is required.`);
        return false;
      }
      const min = parseInt(t.min_people, 10);
      const max = parseInt(t.max_people, 10);
      const base = parseFloat(t.base_price);
      const discounted = t.discounted_price ? parseFloat(t.discounted_price) : null;

      if (isNaN(min) || min < 1) { Alert.alert('Validation', `Tier ${i + 1}: Min people must be ≥ 1.`); return false; }
      if (isNaN(max) || max < min) { Alert.alert('Validation', `Tier ${i + 1}: Max people must be ≥ min people.`); return false; }
      if (isNaN(base) || base <= 0) { Alert.alert('Validation', `Tier ${i + 1}: Base price must be > 0.`); return false; }
      if (discounted != null && discounted >= base) {
        Alert.alert('Validation', `Tier ${i + 1}: Discounted price must be less than base price.`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateTiers()) return;
    try {
      await upsertPricing.mutateAsync({
        packageId: id ?? '',
        tiers: tiers.map((t) => ({
          id: t.id,
          label: t.label.trim(),
          min_people: parseInt(t.min_people, 10),
          max_people: parseInt(t.max_people, 10),
          base_price: parseFloat(t.base_price),
          discounted_price: t.discounted_price ? parseFloat(t.discounted_price) : null,
          season: t.season,
          is_active: t.is_active,
        })),
      });
      Alert.alert('Saved', 'Pricing tiers saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save pricing.';
      Alert.alert('Save Failed', message);
    }
  };

  if (isLoading || pkg == null) {
    return (
      <View style={styles.flex}>
        <Header title="Pricing Tiers" showBack />
        <InlineLoader message="Loading pricing…" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Pricing Tiers" showBack />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Set different prices for solo travelers, couples, and groups.
            At least one active tier is required to submit for review.
          </Text>
        </View>

        {tiers.map((tier, index) => (
          <TierForm
            key={tier.id ?? `new-${index}`}
            tier={tier}
            index={index}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}

        <Pressable style={styles.addTierBtn} onPress={handleAddTier}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addTierText}>Add Pricing Tier</Text>
        </Pressable>

        <Button
          label="Save Pricing"
          onPress={() => void handleSave()}
          loading={upsertPricing.isPending}
          fullWidth
          size="large"
          variant="primary"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.secondaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 16,
  },
  addTierText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
