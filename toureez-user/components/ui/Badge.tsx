/**
 * @file components/ui/Badge.tsx
 * @description Toureez badge.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export type BadgeType = 'FEATURED' | 'BESTSELLER' | 'VERIFIED' | 'NEW' | 'HOT';

export interface BadgeProps {
  type: BadgeType;
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  const label = type === 'VERIFIED' ? 'VERIFIED ✓' : type;

  return (
    <View style={[styles.badge, styles[type]]}>
      <Text style={[styles.label, styles[`${type}Label` as keyof typeof styles] as object]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  FEATURED: {
    backgroundColor: Colors.primary,
  },
  FEATUREDLabel: {
    color: Colors.textWhite,
  },
  BESTSELLER: {
    backgroundColor: Colors.accent,
  },
  BESTSELLERLabel: {
    color: Colors.navy,
  },
  NEW: {
    backgroundColor: Colors.secondary,
  },
  NEWLabel: {
    color: Colors.textWhite,
  },
  VERIFIED: {
    backgroundColor: Colors.primaryLight,
  },
  VERIFIEDLabel: {
    color: Colors.primary,
  },
  HOT: {
    backgroundColor: Colors.primaryDark,
  },
  HOTLabel: {
    color: Colors.textWhite,
  },
});
