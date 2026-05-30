/**
 * @file app/(tabs)/_layout.tsx
 * @description NEXTTRP bottom tab navigator.
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
    <View style={styles.iconStack}>
      <View style={[styles.activeDot, focused && styles.activeDotVisible]} />
      <Ionicons
        name={focused ? filledName : outlineName}
        size={23}
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
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarLabelStyle: styles.label,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outlineName="home-outline" filledName="home" />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outlineName="search-outline" filledName="search" />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outlineName="calendar-outline" filledName="calendar" />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            href: '/(tabs)/wishlist',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outlineName="heart-outline" filledName="heart" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} outlineName="person-outline" filledName="person" />
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
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconStack: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'flex-end',
    width: 32,
  },
  activeDot: {
    backgroundColor: Colors.transparent,
    borderRadius: 2,
    height: 4,
    marginBottom: 3,
    width: 4,
  },
  activeDotVisible: {
    backgroundColor: Colors.primary,
  },
});
