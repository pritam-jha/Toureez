/**
 * @file hooks/useAppReview.ts
 * @description Requests an in-app store review after a completed booking.
 *
 * Review is requested at most once per 30 days to comply with Apple and
 * Google quotas. The timestamp is persisted in AsyncStorage.
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY = '@toureez:last_review_request';
const MIN_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function useAppReview(): { requestReview: () => Promise<void> } {
  const requestReview = useCallback(async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      const rawLastRequest = await AsyncStorage.getItem(STORAGE_KEY);
      const lastRequest = rawLastRequest ? Number(rawLastRequest) : 0;

      if (Date.now() - lastRequest < MIN_INTERVAL_MS) return;

      await StoreReview.requestReview();
      await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Store review errors are non-fatal — never block the user flow
    }
  }, []);

  return { requestReview };
}
