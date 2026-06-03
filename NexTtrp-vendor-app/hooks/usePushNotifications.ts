/**
 * @file hooks/usePushNotifications.ts
 * @description Registers for Expo push notifications in the vendor app.
 * Call once in the root layout after the vendor is authenticated.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';

const TOKEN_KEY = '@nexttrp_vendor:push_token';

// expo-notifications remote push is not supported in Expo Go SDK 53+.
// Only initialise the handler in standalone / dev-client builds.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isExpoGo) return; // Not supported in Expo Go SDK 53+
    if (!user || user.role !== VENDOR_ROLE) return;
    if (!Device.isDevice) return;

    const timer = setTimeout(() => {
      void (async () => {
        const { status: existing } = await Notifications.getPermissionsAsync();
        if (existing === 'denied') return;

        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'NEXTTRP Vendor',
            importance: Notifications.AndroidImportance.MAX,
            lightColor: '#E8631A',
          });
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync();
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored === token) return;

        const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
        await apiClient.post('/users/device-token', { token, platform });
        await AsyncStorage.setItem(TOKEN_KEY, token);
      })();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);
}
