/**
 * @file app/(auth)/callback.tsx
 * @description OAuth deep-link fallback screen.
 *
 * On some Android versions, the OS passes the toureez://auth/callback URL
 * through Expo Router's deep-link system instead of letting
 * WebBrowser.openAuthSessionAsync intercept it. Expo Router would then show
 * "Unmatched Route" because no file handled the path.
 *
 * This screen catches that case. By the time the deep-link reaches here,
 * the OAuth session has already been set by runGoogleOAuth (via
 * WebBrowser.openAuthSessionAsync). The _layout.tsx auth guard will route
 * the user to (tabs) once the session is confirmed.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function OAuthCallbackScreen(): React.ReactElement {
  // The auth guard in _layout.tsx handles navigation once the session resolves.
  // This screen just shows a spinner so there's no flash of blank content.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundBase ?? '#FFF8F0',
  },
});
