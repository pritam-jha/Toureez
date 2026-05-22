/**
 * @file components/ui/Toast.tsx
 * @description Premium Light 3D toast notification — slides up from bottom.
 *
 * - White card with colored left accent bar + 3D shadow
 * - Spring slide-up animation
 * - Types: success (green) | error (red) | info (navy)
 * - Auto dismiss: 3 seconds
 *
 * ✅ All existing props preserved — zero logic changes.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

const AUTO_HIDE_DELAY_MS = 3000;
const ANIMATION_DURATION_MS = 280;
const SLIDE_DISTANCE = 100;

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
}

const TYPE_ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const TYPE_ACCENT: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  info: Colors.primary,
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(SLIDE_DISTANCE)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SLIDE_DISTANCE,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [onHide, opacity, translateY]);

  useEffect(() => {
    if (visible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      translateY.setValue(SLIDE_DISTANCE);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        slideOut();
      }, AUTO_HIDE_DELAY_MS);
    } else {
      translateY.setValue(SLIDE_DISTANCE);
      opacity.setValue(0);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [visible, translateY, opacity, slideOut]);

  if (!visible) return null;

  const accentColor = TYPE_ACCENT[type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { transform: [{ translateY }], opacity },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${type}: ${message}`}
      pointerEvents="none"
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Text style={[styles.icon, { color: accentColor }]}>{TYPE_ICON[type]}</Text>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    // Premium 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
    zIndex: 9999,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginVertical: 14,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  message: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
