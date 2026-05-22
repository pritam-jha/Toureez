/**
 * @file components/common/EmptyState.tsx
 * @description Glassmorphism Dark empty state — icon glow + animated pulse.
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'map-outline',
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      {/* Glow halo behind icon */}
      <View style={styles.glowHalo} />

      <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
        <Ionicons name={icon} size={36} color={Colors.primary} />
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Button
          label={ctaLabel}
          onPress={onCtaPress}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  glowHalo: {
    position: 'absolute',
    top: 28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryGlow,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  cta: {
    minWidth: 160,
  },
});
