/**
 * @file store/compareStore.ts
 * @description Zustand store for the package comparison tray with AsyncStorage persistence.
 *
 * Stores full Package objects (unlike wishlist which stores only IDs) because
 * the comparison screen needs to render package details without an extra fetch.
 * Capped at Config.maxCompareItems (4) packages.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import type { ComparePackage, CompareState } from '../types';

/**
 * Zustand compare store with AsyncStorage persistence.
 *
 * The comparison tray persists across app restarts so users don't lose
 * their selection if they background the app. The 4-item cap is enforced
 * in addToCompare — callers should check isInCompare and the tray length
 * before calling add to show appropriate UI feedback.
 */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareItems: [],

      /**
       * Adds a package to the comparison tray.
       * Silently ignores the call if:
       * - The package is already in the tray (prevents duplicates).
       * - The tray is already at the maximum capacity.
       */
      addToCompare: (pkg: ComparePackage) =>
        set((state) => {
          if (state.compareItems.length >= Config.maxCompareItems) {
            return state; // Tray is full — caller should show a toast
          }
          if (state.compareItems.some((item) => item.id === pkg.id)) {
            return state; // Already in tray — no-op
          }
          return { compareItems: [...state.compareItems, pkg] };
        }),

      /**
       * Removes a package from the comparison tray by its ID.
       */
      removeFromCompare: (packageId: string) =>
        set((state) => ({
          compareItems: state.compareItems.filter(
            (item) => item.id !== packageId
          ),
        })),

      /**
       * Clears all packages from the comparison tray.
       */
      clearCompare: () => set({ compareItems: [] }),

      /**
       * Returns true if the given package ID is already in the tray.
       * O(n) where n ≤ 4 — acceptable for this use case.
       */
      isInCompare: (packageId: string) =>
        get().compareItems.some((item) => item.id === packageId),
    }),
    {
      name: 'nexttrp-compare-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
