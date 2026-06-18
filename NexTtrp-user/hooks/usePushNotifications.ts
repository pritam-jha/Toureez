/**
 * @file hooks/usePushNotifications.ts
 * @description Registers for Expo push notifications and saves the token to the backend.
 *
 * Call this hook once in the root layout after the user is authenticated.
 * The token is persisted to AsyncStorage so we only re-register if it changes.
 *
 * Prerequisites:
 *  - expo-notifications installed
 *  - expo-device installed
 *  - expo-notifications plugin added to app.json
 *  - FCM credentials set up in EAS (Android)
 *  - APNs key uploaded in EAS (iOS)
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDeviceToken } from '../lib/api/users';
import { useAuthStore } from '../store/authStore';

// expo-notifications registers a push token listener at module load time, which
// triggers a loud warning in Expo Go (SDK 53+). Using a dynamic import prevents
// the package from loading at all in Expo Go, silencing the warning entirely.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

const TOKEN_STORAGE_KEY = '@toureez:push_token';

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (!Device.isDevice) return;
    if (isExpoGo) return;

    const timer = setTimeout(() => {
      void (async () => {
        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'denied') return;

        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Toureez',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#E8631A',
          });
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored === token) return;

        const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerDeviceToken(token, platform);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      })();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);
}
