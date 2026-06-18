/**
 * @file app/index.tsx
 * @description Initial route — shown briefly while AuthBootstrap resolves the session.
 *
 * AuthBootstrap (in _layout.tsx) always performs a router.replace() immediately
 * after resolving, so this screen is never visible for more than a moment.
 * It exists solely so Expo Router has a valid initial route to mount.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index(): React.ReactElement {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E8631A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
  },
});
