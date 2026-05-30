/**
 * @file hooks/usePushNotifications.ts
 * @description Registers for Expo push notifications in the vendor app.
 * Call once in the root layout after the vendor is authenticated.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';

const TOKEN_KEY = '@nexttrp_vendor:push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || user.role !== VENDOR_ROLE) return;
    if (!Device.isDevice) return;

    void (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
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
  }, [user]);
}
