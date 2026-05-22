/**
 * @file components/bookings/TravelerDetailsCard.tsx
 * @description Collapsible traveler identity summary for a booking.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { TravelerDetail } from '../../types';

export interface TravelerDetailsCardProps {
  travelers: TravelerDetail[];
}

const ID_TYPE_LABEL: Record<TravelerDetail['id_type'], string> = {
  aadhaar: 'Aadhaar',
  passport: 'Passport',
  driving_license: 'Driving License',
};

const GENDER_LABEL: Record<TravelerDetail['gender'], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

function maskIdNumber(value: string): string {
  const compact = value.replace(/\s+/g, '');
  const suffix = compact.slice(-4);
  if (!suffix) return 'Not provided';

  const hiddenLength = Math.max(compact.length - suffix.length, 4);
  return `${'*'.repeat(Math.min(hiddenLength, 8))}${suffix}`;
}

export function TravelerDetailsCard({
  travelers,
}: TravelerDetailsCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [styles.header, pressed ? styles.headerPressed : null]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Traveler details"
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>Traveler Details</Text>
          <Text style={styles.subtitle}>
            {travelers.length} traveler{travelers.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {travelers.map((traveler, index) => (
            <View
              key={`${traveler.name}-${traveler.id_number}-${index}`}
              style={[
                styles.travelerRow,
                index === travelers.length - 1 ? styles.lastTravelerRow : null,
              ]}
            >
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {traveler.name}
                </Text>
                {traveler.is_primary || index === 0 ? (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryLabel}>Primary</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.demographics}>
                Age {traveler.age} | {GENDER_LABEL[traveler.gender]}
              </Text>

              <View style={styles.idRow}>
                <Ionicons
                  name="card-outline"
                  size={15}
                  color={Colors.textSecondary}
                />
                <Text style={styles.idText} numberOfLines={1}>
                  {ID_TYPE_LABEL[traveler.id_type]}: {maskIdNumber(traveler.id_number)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerPressed: {
    backgroundColor: Colors.backgroundBase,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  body: {
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  travelerRow: {
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  lastTravelerRow: {
    borderBottomWidth: 0,
  },
  nameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginRight: 10,
  },
  primaryBadge: {
    backgroundColor: Colors.infoLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  primaryLabel: {
    color: Colors.info,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  demographics: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  idRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 7,
  },
  idText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 7,
  },
});
