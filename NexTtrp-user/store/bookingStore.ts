/**
 * @file store/bookingStore.ts
 * @description Zustand store for the in-progress booking flow.
 *
 * Persists the BookingFormState across the 4-step booking flow screens.
 * This avoids passing large objects through URL params (which have size limits
 * and require serialisation). The store is cleared after confirmation.
 */

import { create } from 'zustand';
import type { BookingFormState } from '../types';

interface BookingStoreState {
  form: BookingFormState | null;
  setForm: (form: BookingFormState) => void;
  clearForm: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  form: null,

  /**
   * Persists the complete booking form state.
   * Called at the end of Step 1 before navigating to Step 2.
   */
  setForm: (form) => set({ form }),

  /**
   * Clears the booking form after confirmation or cancellation.
   */
  clearForm: () => set({ form: null }),
}));
