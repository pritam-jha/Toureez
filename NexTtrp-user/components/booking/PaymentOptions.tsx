/**
 * @file components/booking/PaymentOptions.tsx
 * @description Payment type selector card (Full vs Advance).
 *
 * Full payment: pay total_amount now, no split.
 * Advance payment: pay 30% now, 70% before travel.
 *
 * Both options show the same total_amount — no phantom discounts.
 * Mirrors the backend calculatePrice() exactly.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { PriceCalculation } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentOptionsProps {
  selected: 'full' | 'advance';
  calculation: PriceCalculation;
  onSelect: (type: 'full' | 'advance') => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PaymentOptions({
  selected,
  calculation,
  onSelect,
}: PaymentOptionsProps): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payment Options</Text>
      <Text style={styles.subtitle}>Choose how you'd like to pay</Text>

      {/* ── Full payment ── */}
      <TouchableOpacity
        style={[
          styles.option,
          selected === 'full' && styles.optionSelected,
        ]}
        onPress={() => onSelect('full')}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected === 'full' }}
        accessibilityLabel="Full payment option"
      >
        <View style={styles.optionHeader}>
          <View style={styles.radioOuter}>
            {selected === 'full' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionTitleWrap}>
            <Text style={styles.optionTitle}>Full Payment</Text>
            <Text style={styles.optionSubtitle}>Pay the complete amount now</Text>
          </View>
          <Text style={styles.optionAmount}>
            {formatINR(calculation.total_amount)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Advance payment ── */}
      <TouchableOpacity
        style={[
          styles.option,
          selected === 'advance' && styles.optionSelected,
        ]}
        onPress={() => onSelect('advance')}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected === 'advance' }}
        accessibilityLabel="Advance payment option"
      >
        <View style={styles.optionHeader}>
          <View style={styles.radioOuter}>
            {selected === 'advance' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionTitleWrap}>
            <Text style={styles.optionTitle}>Advance Payment</Text>
            <Text style={styles.optionSubtitle}>30% now, rest before travel</Text>
          </View>
          <Text style={styles.optionAmount}>
            {formatINR(calculation.advance_amount)}
          </Text>
        </View>

        {/* Split breakdown — only shown when advance is selected */}
        {selected === 'advance' ? (
          <View style={styles.splitInfo}>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Pay now</Text>
              <Text style={styles.splitValue}>
                {formatINR(calculation.advance_amount)}
              </Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Before travel</Text>
              <Text style={styles.splitValue}>
                {formatINR(calculation.balance_amount)}
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
  },
  option: {
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionSelected: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioInner: {
    backgroundColor: Colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  optionTitleWrap: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  optionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 1,
  },
  optionAmount: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  splitInfo: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 12,
    overflow: 'hidden',
  },
  splitItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  splitDivider: {
    backgroundColor: Colors.surfaceBorder,
    width: 1,
  },
  splitLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  splitValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
});
