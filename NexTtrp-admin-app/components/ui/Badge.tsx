/**
 * @file components/ui/Badge.tsx
 * @description Pill badge for statuses and roles.
 *
 * Accepts any status string and maps it to the right semantic color.
 * Falls back to the neutral (`textLight`) palette for unknown values.
 */

import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';

export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  status: string;
  label?: string;
  size?: BadgeSize;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

interface Palette {
  bg: string;
  text: string;
}

const PALETTE: Record<string, Palette> = {
  // Positive / success
  confirmed: { bg: Colors.successLight, text: Colors.success },
  approved: { bg: Colors.successLight, text: Colors.success },
  active: { bg: Colors.successLight, text: Colors.success },
  published: { bg: Colors.successLight, text: Colors.success },
  paid: { bg: Colors.successLight, text: Colors.success },
  completed: { bg: Colors.successLight, text: Colors.success },
  verified: { bg: Colors.successLight, text: Colors.success },

  // Warning / pending
  pending: { bg: Colors.warningLight, text: '#A36500' },
  draft: { bg: Colors.borderLight, text: Colors.textLight },
  unpublished: { bg: Colors.borderLight, text: Colors.textLight },
  hidden: { bg: Colors.borderLight, text: Colors.textLight },
  inactive: { bg: Colors.borderLight, text: Colors.textLight },

  // Negative
  rejected: { bg: Colors.errorLight, text: Colors.error },
  cancelled: { bg: Colors.errorLight, text: Colors.error },
  failed: { bg: Colors.errorLight, text: Colors.error },
  error: { bg: Colors.errorLight, text: Colors.error },

  // Neutral / processing
  admin: { bg: Colors.secondaryLight, text: Colors.secondary },
  processing: { bg: Colors.secondaryLight, text: Colors.secondary },
  refunded: { bg: Colors.secondaryLight, text: Colors.secondary },

  // Roles
  company_owner: { bg: Colors.accentLight, text: '#946700' },
  vendor: { bg: Colors.accentLight, text: '#946700' },
  traveler: { bg: Colors.primaryLight, text: Colors.primary },
  featured: { bg: Colors.accentLight, text: '#946700' },
  bestseller: { bg: Colors.accentLight, text: '#946700' },
  popular: { bg: Colors.accentLight, text: '#946700' },
};

function paletteFor(status: string): Palette {
  const key = status.toLowerCase().trim();
  return (
    PALETTE[key] ?? { bg: Colors.borderLight, text: Colors.textSecondary }
  );
}

function prettifyStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Badge({
  status,
  label,
  size = 'md',
  style,
  textStyle,
}: BadgeProps): React.ReactElement {
  const palette = paletteFor(status);
  const sizeStyle = size === 'sm' ? styles.containerSm : styles.containerMd;
  const sizeText = size === 'sm' ? styles.textSm : styles.textMd;

  return (
    <View style={[styles.base, sizeStyle, { backgroundColor: palette.bg }, style]}>
      <Text
        numberOfLines={1}
        style={[styles.text, sizeText, { color: palette.text }, textStyle]}
      >
        {label ?? prettifyStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  containerMd: {
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: 4,
  },
  text: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0,
  },
  textSm: {
    fontSize: 10,
    lineHeight: 14,
  },
  textMd: {
    fontSize: 11,
    lineHeight: 16,
  },
});
