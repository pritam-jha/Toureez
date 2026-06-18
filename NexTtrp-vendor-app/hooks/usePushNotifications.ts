/**
 * @file hooks/usePushNotifications.ts
 * Registers for Expo push notifications in standalone/dev-client builds.
 *
 * Uses a dynamic import so expo-notifications is never loaded in Expo Go
 * (the package auto-registers a push token listener at module-init time,
 * which throws in Expo Go SDK 53+).
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api/client';
import { useAuthStore } from '../store/authStore';
import { VENDOR_ROLE } from '../types';

const TOKEN_KEY = '@toureez_vendor:push_token';

// In Expo Go, expo-notifications remote push is fully removed (SDK 53+).
// Checking appOwnership prevents the module from being imported at all.
const isExpoGo = Constants.appOwnership === 'expo';

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isExpoGo) return;
    if (!user || user.role !== VENDOR_ROLE) return;
    if (!Device.isDevice) return;

    const timer = setTimeout(() => {
      void (async () => {
        // Dynamic import keeps expo-notifications out of the module graph
        // when running in Expo Go — avoids the DevicePushTokenAutoRegistration
        // module-init crash on SDK 53+.
        const Notifications = await import('expo-notifications');

        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

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
            name: 'Toureez Vendor',
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
