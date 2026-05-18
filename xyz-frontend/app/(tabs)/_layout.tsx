/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab navigator with persistent compare tray overlay.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CompareTray } from '../../components/home/CompareTray';
import { Colors } from '../../constants/colors';

type TabIconName =
  | 'home-outline'
  | 'search-outline'
  | 'heart-outline'
  | 'person-outline';

interface TabIconProps {
  name: TabIconName;
  focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps): React.ReactElement {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
    />
  );
}

export default function TabsLayout(): React.ReactElement {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="search-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="heart-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="person-outline" focused={focused} />
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
    backgroundColor: Colors.tabBarBackground,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 9,
    paddingTop: 7,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
