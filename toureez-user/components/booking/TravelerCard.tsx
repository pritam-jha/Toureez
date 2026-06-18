/**
 * @file components/booking/TravelerCard.tsx
 * @description Input card for a single traveler's details.
 *
 * Renders: name, age, gender pill selector, ID type dropdown, ID number.
 * Traveler 1 is always the primary traveler.
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { TravelerDetail } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TravelerCardProps {
  index: number;
  traveler: TravelerDetail;
  onChange: (index: number, updated: TravelerDetail) => void;
  errors?: Partial<Record<keyof TravelerDetail, string>>;
}

type GenderOption = { value: TravelerDetail['gender']; label: string };
type IdTypeOption = { value: TravelerDetail['id_type']; label: string };

const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ID_TYPE_OPTIONS: IdTypeOption[] = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({
  label,
  required,
  error,
  children,
}: FieldProps): React.ReactElement {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: Colors.error,
  },
  error: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export function TravelerCard({
  index,
  traveler,
  onChange,
  errors,
}: TravelerCardProps): React.ReactElement {
  const isPrimary = index === 0;
  const title = isPrimary
    ? 'Traveler 1 (Primary)'
    : `Traveler ${index + 1}`;

  const update = useCallback(
    (patch: Partial<TravelerDetail>) => {
      onChange(index, { ...traveler, ...patch });
    },
    [index, onChange, traveler]
  );

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, isPrimary && styles.badgePrimary]}>
            <Ionicons
              name="person"
              size={12}
              color={isPrimary ? Colors.white : Colors.textSecondary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        {isPrimary && (
          <View style={styles.primaryTag}>
            <Text style={styles.primaryTagText}>Primary</Text>
          </View>
        )}
      </View>

      {/* Full name */}
      <Field label="Full Name" required error={errors?.name}>
        <TextInput
          style={[styles.input, errors?.name ? styles.inputError : null]}
          value={traveler.name}
          onChangeText={(text) => update({ name: text })}
          placeholder="As per government ID"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel={`Traveler ${index + 1} full name`}
        />
      </Field>

      {/* Age */}
      <Field label="Age" required error={errors?.age}>
        <TextInput
          style={[styles.input, errors?.age ? styles.inputError : null]}
          value={traveler.age > 0 ? String(traveler.age) : ''}
          onChangeText={(text) => {
            const parsed = parseInt(text, 10);
            update({ age: Number.isNaN(parsed) ? 0 : parsed });
          }}
          placeholder="1–100"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="next"
          accessibilityLabel={`Traveler ${index + 1} age`}
        />
      </Field>

      {/* Gender pill selector */}
      <Field label="Gender" required error={errors?.gender}>
        <View style={styles.pillRow}>
          {GENDER_OPTIONS.map((opt) => {
            const selected = traveler.gender === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => update({ gender: opt.value })}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.pillText,
                    selected && styles.pillTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      {/* ID type selector */}
      <Field label="ID Type" required error={errors?.id_type}>
        <View style={styles.pillRow}>
          {ID_TYPE_OPTIONS.map((opt) => {
            const selected = traveler.id_type === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => update({ id_type: opt.value, id_number: '' })}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.pillText,
                    selected && styles.pillTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      {/* ID number */}
      <Field label="ID Number" required error={errors?.id_number}>
        <TextInput
          style={[styles.input, errors?.id_number ? styles.inputError : null]}
          value={traveler.id_number}
          onChangeText={(text) => {
            const cleaned =
              traveler.id_type === 'aadhaar'
                ? text.replace(/[^0-9]/g, '').slice(0, 12)
                : text.toUpperCase();
            update({ id_number: cleaned });
          }}
          placeholder={
            traveler.id_type === 'aadhaar'
              ? '12-digit Aadhaar number'
              : traveler.id_type === 'passport'
              ? 'Passport number'
              : 'License number'
          }
          placeholderTextColor={Colors.textTertiary}
          keyboardType={traveler.id_type === 'aadhaar' ? 'number-pad' : 'default'}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel={`Traveler ${index + 1} ID number`}
        />
      </Field>
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
    marginBottom: 12,
    padding: 16,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 10,
    height: 24,
    justifyContent: 'center',
    width: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  badgePrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  primaryTag: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryTagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  input: {
    backgroundColor: Colors.backgroundLayer2,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 12,
    borderWidth: 1.5,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    height: 48,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: Colors.error,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.backgroundLayer2,
  },
  pillSelected: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  pillTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
