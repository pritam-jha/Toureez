/**
 * @file components/ui/Chip.tsx
 * @description Toureez filter chip.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface ChipProps {
  label: string;
  active?: boolean;
  activeTone?: 'orange' | 'blue';
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  activeTone = 'orange',
  onPress,
  leftIcon,
  accessibilityLabel,
}) => {
  const isBlue = active && activeTone === 'blue';

  return (
    <Pressable
      style={[
        styles.chip,
        active && styles.chipActiveOrange,
        isBlue && styles.chipActiveBlue,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: Colors.primaryUltraLight,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  chipActiveOrange: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipActiveBlue: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  leftIcon: {
    marginRight: 6,
  },
  label: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.textWhite,
  },
});
