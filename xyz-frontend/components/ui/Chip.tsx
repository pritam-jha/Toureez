/**
 * @file components/ui/Chip.tsx
 * @description Premium filter chip for the Light 3D design system.
 *
 * - Default: white bg, subtle border, secondary text
 * - Active: navy filled bg, white text + navy shadow
 * - Pill shape (borderRadius: 999)
 * - Press: spring scale 0.95
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onPress,
  leftIcon,
  accessibilityLabel,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.chip, active && styles.chipActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={accessibilityLabel ?? label}
      >
        {leftIcon ? (
          <View style={[styles.leftIcon, active && styles.leftIconActive]}>
            {leftIcon}
          </View>
        ) : null}
        <Text
          style={[styles.label, active && styles.labelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorderStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  leftIcon: {
    marginRight: 6,
    opacity: 0.6,
  },
  leftIconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});
