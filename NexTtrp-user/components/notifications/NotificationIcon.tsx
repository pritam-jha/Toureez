/**
 * @file components/notifications/NotificationIcon.tsx
 * @description Type-aware icon treatment for notification rows.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import type { AppNotificationType } from '../../types';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface NotificationIconProps {
  type: AppNotificationType;
}

const ICONS: Record<
  AppNotificationType,
  {
    backgroundColor: string;
    color: string;
    name: IconName;
  }
> = {
  booking_confirmed: {
    backgroundColor: Colors.successLight,
    color: Colors.success,
    name: 'check-circle',
  },
  payment_received: {
    backgroundColor: Colors.successLight,
    color: Colors.success,
    name: 'currency-inr',
  },
  review_received: {
    backgroundColor: Colors.warningLight,
    color: Colors.star,
    name: 'star',
  },
  package_approved: {
    backgroundColor: Colors.infoLight,
    color: Colors.info,
    name: 'check-decagram',
  },
  wishlist_price_drop: {
    backgroundColor: Colors.warningLight,
    color: Colors.primary,
    name: 'tag',
  },
};

/**
 * Renders the semantic icon assigned to a notification type.
 */
export function NotificationIcon({
  type,
}: NotificationIconProps): React.ReactElement {
  const icon = ICONS[type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: icon.backgroundColor,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons name={icon.name} size={23} color={icon.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
});
