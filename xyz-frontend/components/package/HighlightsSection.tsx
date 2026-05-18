/**
 * @file components/package/HighlightsSection.tsx
 * @description Numbered list of package highlights with checkmark icons.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

export interface HighlightsSectionProps {
  highlights: string[];
}

export function HighlightsSection({
  highlights,
}: HighlightsSectionProps): React.ReactElement | null {
  if (highlights.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Package Highlights
      </Text>

      {highlights.map((item, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.number} numberOfLines={1}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text style={styles.text}>{item}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 14,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconWrap: {
    marginRight: 10,
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  number: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 20,
    marginRight: 8,
    minWidth: 22,
  },
  text: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
