/**
 * @file components/common/Avatar.tsx
 * @description Circular avatar component with initials fallback and optional
 * camera-overlay for tappable upload states.
 *
 * - Shows Image when `uri` is provided
 * - Falls back to initials circle (first letter of first + last name) when no uri
 * - Renders a camera icon overlay when `onPress` is provided
 * - Accepts a `loading` prop to show an ActivityIndicator during upload
 * - All colours from constants/colors.ts — zero hardcoded hex values
 * - StyleSheet.create for all styles
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
  /** Remote or local image URI. Falls back to initials when null/undefined. */
  uri?: string | null;
  /** Full name used to derive initials when no uri is provided. */
  name?: string | null;
  /** Diameter of the avatar circle in dp (default: 80). */
  size?: number;
  /** Called when the avatar is pressed. Renders a camera overlay when set. */
  onPress?: () => void;
  /** Shows an ActivityIndicator overlay — use during upload. */
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derives up to two initials from a full name string.
 * "Rahul Sharma" → "RS", "Priya" → "P", null/empty → "?"
 */
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

/**
 * Circular avatar with image, initials fallback, and optional upload overlay.
 *
 * @example
 * // View mode — no press handler
 * <Avatar uri={user.avatar_url} name={user.full_name} size={80} />
 *
 * @example
 * // Edit mode — tappable with loading state
 * <Avatar
 *   uri={user.avatar_url}
 *   name={user.full_name}
 *   size={96}
 *   onPress={uploadAvatar}
 *   loading={uploading}
 * />
 */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 80,
  onPress,
  loading = false,
}) => {
  const initials = getInitials(name);
  const isTappable = Boolean(onPress);

  // Derived styles that depend on the `size` prop
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const initialsStyle = {
    fontSize: Math.round(size * 0.35),
  };

  const overlayStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const cameraIconSize = Math.round(size * 0.28);

  const inner = (
    <View style={[styles.circle, circleStyle]}>
      {/* Image or initials */}
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, circleStyle]}
          accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
          accessibilityRole="image"
        />
      ) : (
        <Text
          style={[styles.initials, initialsStyle]}
          accessibilityLabel={`Avatar initials: ${initials}`}
        >
          {initials}
        </Text>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={[styles.overlay, overlayStyle]}>
          <ActivityIndicator
            size="small"
            color={Colors.white}
            accessibilityLabel="Uploading avatar"
          />
        </View>
      )}

      {/* Camera icon overlay — only shown when tappable and not loading */}
      {isTappable && !loading && (
        <View style={[styles.cameraOverlay, overlayStyle]}>
          <Text
            style={[styles.cameraIcon, { fontSize: cameraIconSize }]}
            accessibilityLabel="Tap to change avatar"
          >
            📷
          </Text>
        </View>
      )}
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
  circle: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: Colors.white,
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
