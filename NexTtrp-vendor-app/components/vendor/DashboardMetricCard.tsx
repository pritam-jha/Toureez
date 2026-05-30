/**
 * @file components/vendor/DashboardMetricCard.tsx
 * @description Metric card used on the vendor dashboard screen.
 *
 * Displays a single KPI (label + value + optional trend) with a coloured
 * icon background. Supports an optional onPress to navigate to the detail screen.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  onPress?: () => void;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  icon,
  iconColor = Colors.primary,
  iconBg = Colors.primaryLight,
  subtitle,
  onPress,
}) => {
  const inner = (
    <View style={[styles.card, Shadows.card]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  if (onPress != null) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{inner}</View>;
};

// ── 2-column grid helper ──────────────────────────────────────────────────────

interface MetricGridProps {
  children: React.ReactNode;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ children }) => (
  <View style={styles.grid}>{children}</View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -2,
  },
});
