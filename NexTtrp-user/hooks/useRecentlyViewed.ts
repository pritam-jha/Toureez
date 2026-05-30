/**
 * @file hooks/useRecentlyViewed.ts
 * @description Stores and retrieves recently viewed package IDs in AsyncStorage.
 *
 * Limited to the last 10 packages. The list is maintained in viewing order
 * (most recent first) with no duplicates.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nexttrp:recently_viewed';
const MAX_ITEMS = 10;

async function loadIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage failure is non-fatal
  }
}

/**
 * Returns the current recently-viewed ID list and a function to record a new view.
 */
export function useRecentlyViewed(): {
  recentIds: string[];
  recordView: (packageId: string) => void;
  clearHistory: () => void;
} {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    void loadIds().then(setRecentIds);
  }, []);

  const recordView = useCallback((packageId: string) => {
    setRecentIds((prev) => {
      const deduped = [packageId, ...prev.filter((id) => id !== packageId)].slice(0, MAX_ITEMS);
      void persistIds(deduped);
      return deduped;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentIds([]);
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentIds, recordView, clearHistory };
}
