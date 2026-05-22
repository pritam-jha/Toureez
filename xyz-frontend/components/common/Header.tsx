/**
 * @file components/common/Header.tsx
 * @description Floating glass header for Glassmorphism Dark design system.
 *
 * - Dark glass background with dim bottom border
 * - Left: glass circle back button OR teal logo wordmark
 * - Center: title 17px semibold, light text
 * - Right: glass circle icon buttons
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeaderAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
}

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  style?: ViewStyle;
  showLogo?: boolean;
  logoText?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  actions = [],
  style,
  showLogo = false,
  logoText = 'XYZ',
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, style]}>
      {/* Left */}
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={styles.glassCircleButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : showLogo ? (
          <Text style={styles.logo}>{logoText}</Text>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Center */}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titlePlaceholder} />
      )}

      {/* Right */}
      <View style={styles.right}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.glassCircleButton}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            hitSlop={8}
          >
            <Ionicons name={action.icon} size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        ))}
        {actions.length === 0 && <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.overlayLight,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 44,
    gap: 8,
  },
  glassCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 8,
    letterSpacing: 0.2,
  },
  titlePlaceholder: {
    flex: 1,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
    textShadowColor: Colors.primaryGlowStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  placeholder: {
    width: 44,
  },
});
