/**
 * @file components/booking/TravelerForm.tsx
 * @description Complete traveler details form section.
 *
 * Renders:
 * - Traveler count stepper
 * - Dynamic list of TravelerCard components
 * - "Auto-fill from primary contact" toggle for Traveler 1
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TravelerCard } from './TravelerCard';
import { Colors } from '../../constants/colors';
import type { PrimaryContact, TravelerDetail } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TravelerFormProps {
  numTravelers: number;
  maxGroupSize: number;
  travelers: TravelerDetail[];
  autoFillPrimary: boolean;
  primaryContact: PrimaryContact;
  onNumTravelersChange: (count: number) => void;
  onTravelerChange: (index: number, updated: TravelerDetail) => void;
  onAutoFillToggle: (value: boolean) => void;
  travelerErrors?: Record<number, Partial<Record<keyof TravelerDetail, string>>>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TravelerForm({
  numTravelers,
  maxGroupSize,
  travelers,
  autoFillPrimary,
  primaryContact,
  onNumTravelersChange,
  onTravelerChange,
  onAutoFillToggle,
  travelerErrors,
}: TravelerFormProps): React.ReactElement {
  const canDecrement = numTravelers > 1;
  const canIncrement = numTravelers < maxGroupSize;

  const handleDecrement = useCallback(() => {
    if (canDecrement) onNumTravelersChange(numTravelers - 1);
  }, [canDecrement, numTravelers, onNumTravelersChange]);

  const handleIncrement = useCallback(() => {
    if (canIncrement) onNumTravelersChange(numTravelers + 1);
  }, [canIncrement, numTravelers, onNumTravelersChange]);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <Text style={styles.sectionTitle}>Traveler Details</Text>

      {/* Traveler count stepper */}
      <View style={styles.stepperRow}>
        <View style={styles.stepperLabelWrap}>
          <Text style={styles.stepperLabel}>How many travelers?</Text>
          <Text style={styles.stepperHint}>Max {maxGroupSize} per booking</Text>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[
              styles.stepperButton,
              !canDecrement && styles.stepperButtonDisabled,
            ]}
            onPress={handleDecrement}
            disabled={!canDecrement}
            accessibilityRole="button"
            accessibilityLabel="Decrease traveler count"
            hitSlop={8}
          >
            <Ionicons
              name="remove"
              size={18}
              color={canDecrement ? Colors.textPrimary : Colors.textTertiary}
            />
          </TouchableOpacity>

          <Text style={styles.stepperValue}>{numTravelers}</Text>

          <TouchableOpacity
            style={[
              styles.stepperButton,
              !canIncrement && styles.stepperButtonDisabled,
            ]}
            onPress={handleIncrement}
            disabled={!canIncrement}
            accessibilityRole="button"
            accessibilityLabel="Increase traveler count"
            hitSlop={8}
          >
            <Ionicons
              name="add"
              size={18}
              color={canIncrement ? Colors.textPrimary : Colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Group discount hint */}
      {numTravelers >= 7 && (
        <View style={styles.discountBanner}>
          <Ionicons name="pricetag" size={14} color={Colors.success} />
          <Text style={styles.discountText}>
            5% group discount applied for 7+ travelers!
          </Text>
        </View>
      )}

      {/* Auto-fill toggle */}
      <View style={styles.autoFillRow}>
        <View style={styles.autoFillTextWrap}>
          <Text style={styles.autoFillLabel}>
            Auto-fill Traveler 1 from contact details
          </Text>
          <Text style={styles.autoFillHint}>
            Uses {primaryContact.full_name || 'your'} details
          </Text>
        </View>
        <Switch
          value={autoFillPrimary}
          onValueChange={onAutoFillToggle}
          trackColor={{
            false: Colors.surfaceBorder,
            true: Colors.primary + '80',
          }}
          thumbColor={autoFillPrimary ? Colors.primary : Colors.textTertiary}
          accessibilityLabel="Auto-fill primary traveler from contact details"
        />
      </View>

      {/* Traveler cards */}
      <View style={styles.cardsContainer}>
        {travelers.map((traveler, index) => (
          <TravelerCard
            key={index}
            index={index}
            traveler={traveler}
            onChange={onTravelerChange}
            errors={travelerErrors?.[index]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 16,
  },
  stepperRow: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 14,
  },
  stepperLabelWrap: {
    flex: 1,
    marginRight: 12,
  },
  stepperLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepperHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    minWidth: 32,
    textAlign: 'center',
  },
  discountBanner: {
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '40',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  discountText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  autoFillRow: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 14,
  },
  autoFillTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  autoFillLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  autoFillHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  cardsContainer: {
    gap: 0,
  },
});
