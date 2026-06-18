/**
 * @file components/notifications/NotificationItem.tsx
 * @description Swipeable notification row with read-state styling.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { AppNotification } from '../../types';
import { NotificationIcon } from './NotificationIcon';

export interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (notificationId: string) => void;
  onPress: (notification: AppNotification) => void;
}

const ACTION_WIDTH = 86;
const SWIPE_THRESHOLD = 54;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function localDayStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function pluralize(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? '' : 's'} ago`;
}

function formatTimeAgo(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  const dayDifference = Math.floor(
    (localDayStart(now).getTime() - localDayStart(date).getTime()) / DAY_MS
  );

  if (dayDifference === 1) {
    return 'Yesterday';
  }

  if (dayDifference > 1) {
    return pluralize(dayDifference, 'day');
  }

  if (elapsed < MINUTE_MS) {
    return 'Just now';
  }

  if (elapsed < HOUR_MS) {
    return pluralize(Math.floor(elapsed / MINUTE_MS), 'minute');
  }

  return pluralize(Math.floor(elapsed / HOUR_MS), 'hour');
}

/**
 * Renders one notification and exposes a left swipe as a read action.
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onPress,
}: NotificationItemProps): React.ReactElement {
  const translateX = useRef(new Animated.Value(0)).current;
  const canMarkAsRead = !notification.is_read;

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      bounciness: 0,
      speed: 20,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const completeSwipe = useCallback(() => {
    if (!canMarkAsRead) {
      resetPosition();
      return;
    }

    Animated.timing(translateX, {
      duration: 140,
      toValue: -ACTION_WIDTH,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onMarkAsRead(notification.id);
      }

      resetPosition();
    });
  }, [canMarkAsRead, notification.id, onMarkAsRead, resetPosition, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          canMarkAsRead &&
          gesture.dx < -8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
        onPanResponderMove: (_event, gesture) => {
          translateX.setValue(Math.max(-ACTION_WIDTH, Math.min(0, gesture.dx)));
        },
        onPanResponderRelease: (_event, gesture) => {
          if (
            gesture.dx <= -SWIPE_THRESHOLD ||
            (gesture.dx < -18 && gesture.vx <= -0.45)
          ) {
            completeSwipe();
            return;
          }

          resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    [canMarkAsRead, completeSwipe, resetPosition, translateX]
  );

  const handlePress = useCallback(() => {
    onPress(notification);
  }, [notification, onPress]);

  const handleReadAction = useCallback(() => {
    if (canMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  }, [canMarkAsRead, notification.id, onMarkAsRead]);

  const timeAgo = formatTimeAgo(notification.created_at);

  return (
    <View style={styles.shell}>
      <Pressable
        style={styles.readAction}
        onPress={handleReadAction}
        disabled={!canMarkAsRead}
        accessibilityRole="button"
        accessibilityLabel="Mark notification as read"
        accessibilityState={{ disabled: !canMarkAsRead }}
      >
        <Ionicons name="checkmark" size={20} color={Colors.white} />
        <Text style={styles.readActionText}>Read</Text>
      </Pressable>

      <Animated.View
        style={[
          styles.animatedRow,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            styles.row,
            notification.is_read ? styles.readRow : styles.unreadRow,
            pressed ? styles.pressed : null,
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`${notification.title}. ${notification.body}`}
        >
          <NotificationIcon type={notification.type} />

          <View style={styles.copy}>
            <View style={styles.titleLine}>
              <Text
                style={[
                  styles.title,
                  notification.is_read ? styles.readTitle : styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {timeAgo ? <Text style={styles.time}>{timeAgo}</Text> : null}
            </View>

            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>

          {!notification.is_read ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  animatedRow: {
    backgroundColor: Colors.surfacePrimary,
  },
  row: {
    alignItems: 'center',
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  unreadRow: {
    backgroundColor: '#FFFBF0',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  readRow: {
    backgroundColor: Colors.surfacePrimary,
  },
  copy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  titleLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 4,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  readTitle: {
    fontWeight: '600',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  time: {
    color: Colors.textTertiary,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    maxWidth: 92,
    textAlign: 'right',
  },
  unreadDot: {
    backgroundColor: Colors.primary,
    borderRadius: 5,
    height: 10,
    marginLeft: 10,
    width: 10,
  },
  readAction: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: ACTION_WIDTH,
    borderRadius: 14,
  },
  readActionText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.84,
  },
});
