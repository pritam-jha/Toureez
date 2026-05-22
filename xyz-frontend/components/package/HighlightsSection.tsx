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
    backgroundColor: Colors.surfacePrimary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconWrap: {
    marginRight: 10,
    marginTop: 1,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  number: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 20,
    marginRight: 8,
    minWidth: 22,
  },
  text: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
});
