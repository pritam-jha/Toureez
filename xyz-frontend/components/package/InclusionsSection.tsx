/**
 * @file components/package/InclusionsSection.tsx
 * @description Two-column inclusions / exclusions checklist.
 * Inclusions: green checkmark. Exclusions: red X.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InclusionsSectionProps {
  inclusions: string[];
  exclusions: string[];
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface ChecklistColumnProps {
  title: string;
  items: string[];
  type: 'inclusion' | 'exclusion';
}

function ChecklistColumn({
  title,
  items,
  type,
}: ChecklistColumnProps): React.ReactElement {
  const isInclusion = type === 'inclusion';

  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle} numberOfLines={1}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText} numberOfLines={1}>
          None listed
        </Text>
      ) : (
        items.map((item, index) => (
          <View key={index} style={styles.row}>
            <Ionicons
              name={isInclusion ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isInclusion ? Colors.success : Colors.error}
              style={styles.icon}
            />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InclusionsSection({
  inclusions,
  exclusions,
}: InclusionsSectionProps): React.ReactElement | null {
  if (inclusions.length === 0 && exclusions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Inclusions & Exclusions
      </Text>

      <View style={styles.columnsRow}>
        <ChecklistColumn
          title="Included"
          items={inclusions}
          type="inclusion"
        />
        <View style={styles.divider} />
        <ChecklistColumn
          title="Excluded"
          items={exclusions}
          type="exclusion"
        />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  itemText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  divider: {
    backgroundColor: Colors.border,
    marginHorizontal: 12,
    width: 1,
    alignSelf: 'stretch',
  },
});
