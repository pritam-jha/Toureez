/**
 * @file components/common/Avatar.tsx
 * @description Circular avatar with teal glow ring — Glassmorphism Dark theme.
 * Numeric size prop (default: 80). Used by profile screen.
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  onPress?: () => void;
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 80,
  onPress,
  loading = false,
}) => {
  const initials = getInitials(name);
  const isTappable = Boolean(onPress);
  const ringSize = size + 6;

  const inner = (
    <View style={{ width: ringSize, height: ringSize, position: 'relative' }}>
      {/* Teal glow ring */}
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          },
        ]}
      />
      {/* Avatar circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            position: 'absolute',
            top: 3,
            left: 3,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
            accessibilityRole="image"
          />
        ) : (
          <Text
            style={[styles.initials, { fontSize: Math.round(size * 0.35) }]}
            accessibilityLabel={`Avatar initials: ${initials}`}
          >
            {initials}
          </Text>
        )}

        {loading && (
          <View style={[styles.overlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <ActivityIndicator size="small" color={Colors.primary} accessibilityLabel="Uploading avatar" />
          </View>
        )}

        {isTappable && !loading && (
          <View style={[styles.cameraOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.cameraIcon, { fontSize: Math.round(size * 0.28) }]} accessibilityLabel="Tap to change avatar">
              📷
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isTappable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        accessibilityHint="Opens image picker to select a new avatar"
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius: 10,
    elevation: 6,
  },
  circle: {
    backgroundColor: Colors.backgroundLayer2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    textAlign: 'center',
  },
});
