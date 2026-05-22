/**
 * @file components/ui/Badge.tsx
 * @description Premium status badges for the Light 3D design system.
 *
 * Types: FEATURED | BESTSELLER | VERIFIED | NEW | HOT
 * - Pill shape, tinted bg, colored border + subtle shadow
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export type BadgeType = 'FEATURED' | 'BESTSELLER' | 'VERIFIED' | 'NEW' | 'HOT';

export interface BadgeProps {
  type: BadgeType;
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  return (
    <View style={[styles.badge, styles[type]]}>
      <Text style={[styles.label, styles[`${type}Label` as keyof typeof styles] as object]}>
        {type}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // FEATURED — navy
  FEATURED: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  FEATUREDLabel: {
    color: Colors.primary,
  },

  // BESTSELLER — gold
  BESTSELLER: {
    backgroundColor: Colors.goldGlow,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  BESTSELLERLabel: {
    color: Colors.gold,
  },

  // VERIFIED — navy dashed
  VERIFIED: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  VERIFIEDLabel: {
    color: Colors.primary,
  },

  // NEW — violet
  NEW: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.accentViolet,
    shadowColor: Colors.accentViolet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  NEWLabel: {
    color: Colors.accentViolet,
  },

  // HOT — red
  HOT: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  HOTLabel: {
    color: Colors.error,
  },
});
