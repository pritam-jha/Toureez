/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab navigator — Premium Light 3D design.
 * White tab bar with navy active icons, subtle top border, 3D elevation.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CompareTray } from '../../components/home/CompareTray';
import { Colors } from '../../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  focused: boolean;
  outlineName: IoniconName;
  filledName: IoniconName;
}

function TabIcon({ focused, outlineName, filledName }: TabIconProps): React.ReactElement {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? filledName : outlineName}
        size={22}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
    </View>
  );
}

export default function TabsLayout(): React.ReactElement {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                outlineName="home-outline"
                filledName="home"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                outlineName="search-outline"
                filledName="search"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                outlineName="calendar-outline"
                filledName="calendar"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                outlineName="heart-outline"
                filledName="heart"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                outlineName="person-outline"
                filledName="person"
              />
            ),
          }}
        />
      </Tabs>

      <CompareTray />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    // 3D elevation
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryGlow,
  },
});
