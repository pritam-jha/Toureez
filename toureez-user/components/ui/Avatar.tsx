/**
 * @file components/ui/Avatar.tsx
 * @description Premium avatar with navy ring for Light 3D design.
 *
 * - Navy ring border with subtle shadow
 * - Light fallback bg + navy initials
 * - Sizes: sm (32), md (44), lg (60), xl (88)
 * - Online indicator: green dot bottom-right
 * - Camera overlay when onPress provided
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize | number;
  onPress?: () => void;
  loading?: boolean;
  showOnline?: boolean;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 60,
  xl: 88,
};

function getInitials(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function OnlineDot(): React.ReactElement {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.onlineDotWrap}>
      <Animated.View style={[styles.onlineDotPulse, { transform: [{ scale: pulse }] }]} />
      <View style={styles.onlineDot} />
    </View>
  );
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'xl',
  onPress,
  loading = false,
  showOnline = false,
}) => {
  const diameter = typeof size === 'number' ? size : SIZE_MAP[size];
  const initials = getInitials(name);
  const isTappable = Boolean(onPress);
  const ringSize = diameter + 6;

  const inner = (
    <View style={{ width: ringSize, height: ringSize, position: 'relative' }}>
      {/* Navy ring */}
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
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            position: 'absolute',
            top: 3,
            left: 3,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}
            accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
            accessibilityRole="image"
          />
        ) : (
          <Text
            style={[styles.initials, { fontSize: Math.round(diameter * 0.35) }]}
            accessibilityLabel={`Avatar initials: ${initials}`}
          >
            {initials}
          </Text>
        )}

        {loading && (
          <View style={[styles.overlay, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {isTappable && !loading && (
          <View style={[styles.cameraOverlay, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
            <Text style={[styles.cameraIcon, { fontSize: Math.round(diameter * 0.28) }]}>📷</Text>
          </View>
        )}
      </View>

      {showOnline && <OnlineDot />}
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
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
};

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(15,21,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    textAlign: 'center',
  },
  onlineDotWrap: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(56,161,105,0.25)',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.backgroundBase,
  },
});
