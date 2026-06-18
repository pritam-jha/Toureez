/**
 * @file components/common/EmptyState.tsx
 * @description Toureez empty state.
 */

import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/colors';
import { usePulse } from '../../utils/animations';

export interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'map-outline',
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}) => {
  const pulse = usePulse();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, pulse.animatedStyle]}>
        <Ionicons name={icon} size={60} color={Colors.primary} />
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <Button label={ctaLabel} onPress={onCtaPress} style={styles.cta} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginBottom: 18,
    width: 60,
  },
  title: {
    color: Colors.navy,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
    textAlign: 'center',
  },
  cta: {
    minWidth: 160,
  },
});
