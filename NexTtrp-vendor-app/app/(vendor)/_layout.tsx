/**
 * @file app/(vendor)/_layout.tsx
 * @description Vendor portal tab navigator.
 *
 * Four tabs: Dashboard, Packages, Bookings, Account.
 * Non-tab screens (onboarding, company, reviews, payouts, settings) are
 * registered with href=null so they are hidden from the tab bar but
 * remain navigable via router.push().
 *
 * The Account tab badge reflects the count of unread notifications.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useUnreadNotificationCount } from '../../hooks/useVendorNotifications';

// ── Notification badge overlay ────────────────────────────────────────────────

interface TabBadgeProps {
  count: number;
}

function TabBadge({ count }: TabBadgeProps): React.ReactElement | null {
  if (count === 0) return null;
  return (
    <View style={styles.badge} accessibilityLabel={`${count} unread notifications`}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function VendorLayout(): React.ReactElement {
  const unreadCount = useUnreadNotificationCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* ── Dashboard ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── Packages (nested Stack) ── */}
      <Tabs.Screen
        name="packages"
        options={{
          title: 'Packages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── Bookings (nested Stack) ── */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── Account / More ── */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="person-circle-outline" size={size} color={color} />
              <TabBadge count={unreadCount} />
            </View>
          ),
        }}
      />

      {/* ── Hidden non-tab screens ── */}
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="company" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="payouts" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarItem: {
    paddingTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 9,
    fontWeight: '800',
  },
});
