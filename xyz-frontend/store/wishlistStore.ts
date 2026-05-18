/**
 * @file store/wishlistStore.ts
 * @description Zustand store for local wishlist state with AsyncStorage persistence.
 *
 * Stores only package IDs (not full Package objects) to keep the persisted
 * payload small. Full package data is fetched via TanStack Query when needed.
 *
 * The Set<string> is serialised to/from a plain string[] for AsyncStorage
 * compatibility, since JSON.stringify cannot handle Set objects natively.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WishlistState } from '../types';

/**
 * Serialisable shape used for AsyncStorage persistence.
 * Zustand's persist middleware serialises state via JSON, so we store
 * wishlistedIds as a plain array and rehydrate it back to a Set.
 */
interface PersistedWishlistState {
  wishlistedIdsArray: string[];
}

/**
 * Zustand wishlist store with AsyncStorage persistence.
 *
 * Uses a Set<string> for O(1) lookup in `isWishlisted`, which is called
 * on every package card render. The Set is serialised to an array for storage.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistedIds: new Set<string>(),

      /**
       * Adds a package ID to the local wishlist cache.
       * Should be called after a successful addToWishlist() API call.
       */
      addToWishlist: (packageId: string) =>
        set((state) => ({
          wishlistedIds: new Set([...state.wishlistedIds, packageId]),
        })),

      /**
       * Removes a package ID from the local wishlist cache.
       * Should be called after a successful removeFromWishlist() API call.
       */
      removeFromWishlist: (packageId: string) =>
        set((state) => {
          const next = new Set(state.wishlistedIds);
          next.delete(packageId);
          return { wishlistedIds: next };
        }),

      /**
       * Replaces the entire wishlist cache with a fresh array of IDs.
       * Called on app startup after fetching wishlist IDs from Supabase.
       */
      setWishlist: (packageIds: string[]) =>
        set({ wishlistedIds: new Set(packageIds) }),

      /**
       * Returns true if the given package ID is in the local wishlist cache.
       * O(1) lookup via Set.
       */
      isWishlisted: (packageId: string) => get().wishlistedIds.has(packageId),
    }),
    {
      name: 'xyz-wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Custom serialiser: converts Set → Array before writing to AsyncStorage.
       * Custom deserialiser: converts Array → Set after reading from AsyncStorage.
       */
      partialize: (state) => ({
        wishlistedIdsArray: [...state.wishlistedIds],
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedWishlistState;
        return {
          ...currentState,
          wishlistedIds: new Set(persisted.wishlistedIdsArray ?? []),
        };
      },
    }
  )
);
