/**
 * @file components/ui/Toast.tsx
 * @description Animated toast notification that slides in from the bottom.
 *
 * - Auto-hides after 3 seconds via a useEffect timer
 * - Slides in/out using React Native's Animated API
 * - Three types: success | error | info — each with distinct colours
 * - All colours from constants/colors.ts — zero hardcoded hex values
 * - StyleSheet.create for all styles
 * - Calls onHide when the auto-hide timer fires so the parent can reset state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTO_HIDE_DELAY_MS = 3000;
const ANIMATION_DURATION_MS = 280;
/** How far below the screen the toast starts before sliding in */
const SLIDE_DISTANCE = 100;

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  /** The message to display inside the toast */
  message: string;
  /** Visual type — controls background colour and icon */
  type?: ToastType;
  /** Whether the toast is currently visible */
  visible: boolean;
  /** Called when the toast finishes its hide animation */
  onHide: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Animated bottom toast notification.
 *
 * Mount this once at the screen level and control it via `visible` + `onHide`.
 * The parent is responsible for resetting `visible` to false after `onHide` fires.
 *
 * @example
 * const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
 *
 * <Toast
 *   message={toast.message}
 *   type={toast.type}
 *   visible={toast.visible}
 *   onHide={() => setToast((t) => ({ ...t, visible: false }))}
 * />
 */
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
      // Clear any pending hide timer from a previous show
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Reset position before animating in
      translateY.setValue(SLIDE_DISTANCE);
      opacity.setValue(0);

      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule auto-hide
      hideTimerRef.current = setTimeout(() => {
        slideOut();
      }, AUTO_HIDE_DELAY_MS);
    } else {
      // If visible becomes false externally, ensure we're hidden
      translateY.setValue(SLIDE_DISTANCE);
      opacity.setValue(0);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [visible, translateY, opacity, slideOut]);

  if (!visible) {
    return null;
  }

  const containerStyle: ViewStyle = styles[`${type}Container`] as ViewStyle;

  return (
    <Animated.View
      style={[
        styles.toast,
        containerStyle,
        { transform: [{ translateY }], opacity },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${type}: ${message}`}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{TYPE_ICON[type]}</Text>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  successContainer: {
    backgroundColor: Colors.success,
  },
  errorContainer: {
    backgroundColor: Colors.error,
  },
  infoContainer: {
    backgroundColor: Colors.info,
  },
  icon: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
    lineHeight: 20,
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
