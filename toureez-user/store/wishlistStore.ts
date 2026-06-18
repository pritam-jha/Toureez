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
import type { Location, WishlistState } from '../types';

/**
 * Serialisable shape used for AsyncStorage persistence.
 * Zustand's persist middleware serialises state via JSON, so we store
 * wishlistedIds as a plain array and rehydrate it back to a Set.
 */
interface PersistedWishlistState {
  wishlistedIdsArray: string[];
  wishlistedDestinationIdsArray?: string[];
  wishlistedDestinations?: Location[];
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
      wishlistedDestinationIds: new Set<string>(),
      wishlistedDestinations: [],

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
       * Adds a destination to the local wishlist cache.
       * Destination wishlists are local because the backend wishlist table is
       * package-based.
       */
      addDestinationToWishlist: (destination: Location) =>
        set((state) => ({
          wishlistedDestinationIds: new Set([
            ...state.wishlistedDestinationIds,
            destination.id,
          ]),
          wishlistedDestinations: [
            destination,
            ...state.wishlistedDestinations.filter(
              (item) => item.id !== destination.id
            ),
          ],
        })),

      /**
       * Removes a destination from the local wishlist cache.
       */
      removeDestinationFromWishlist: (destinationId: string) =>
        set((state) => {
          const next = new Set(state.wishlistedDestinationIds);
          next.delete(destinationId);

          return {
            wishlistedDestinationIds: next,
            wishlistedDestinations: state.wishlistedDestinations.filter(
              (destination) => destination.id !== destinationId
            ),
          };
        }),

      /**
       * Toggles a destination in the local wishlist cache.
       */
      toggleDestinationWishlist: (destination: Location) => {
        if (get().wishlistedDestinationIds.has(destination.id)) {
          get().removeDestinationFromWishlist(destination.id);
          return;
        }

        get().addDestinationToWishlist(destination);
      },

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

      /**
       * Returns true if the given destination ID is in the local wishlist cache.
       */
      isDestinationWishlisted: (destinationId: string) =>
        get().wishlistedDestinationIds.has(destinationId),
    }),
    {
      name: 'toureez-wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Custom serialiser: converts Set → Array before writing to AsyncStorage.
       * Custom deserialiser: converts Array → Set after reading from AsyncStorage.
       */
      partialize: (state) => ({
        wishlistedIdsArray: [...state.wishlistedIds],
        wishlistedDestinationIdsArray: [...state.wishlistedDestinationIds],
        wishlistedDestinations: state.wishlistedDestinations,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedWishlistState;
        const destinations = persisted.wishlistedDestinations ?? [];
        const destinationIds =
          persisted.wishlistedDestinationIdsArray ??
          destinations.map((destination) => destination.id);

        return {
          ...currentState,
          wishlistedIds: new Set(persisted.wishlistedIdsArray ?? []),
          wishlistedDestinationIds: new Set(destinationIds),
          wishlistedDestinations: destinations,
        };
      },
    }
  )
);
