/**
 * @file store/vendorStore.ts
 * @description Zustand store for vendor portal UI state.
 *
 * Manages client-side state that does not belong in TanStack Query:
 * - Active package edit form state (in-flight, cleared after save)
 * - Selected package filter state (persisted across tab switches)
 * - Active booking filter state
 *
 * Server state (packages list, bookings list, dashboard data) lives
 * exclusively in TanStack Query and is not duplicated here.
 */

import { create } from 'zustand';
import type { PackageStatus, BookingStatus, PaymentStatus } from '../types';

// ── Package filter state ──────────────────────────────────────────────────────

export interface PackageFilters {
  status?: PackageStatus;
  search?: string;
}

// ── Booking filter state ──────────────────────────────────────────────────────

export interface BookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  from_date?: string;
  to_date?: string;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface VendorStoreState {
  // Package filters
  packageFilters: PackageFilters;
  setPackageFilters: (filters: PackageFilters) => void;
  resetPackageFilters: () => void;

  // Booking filters
  bookingFilters: BookingFilters;
  setBookingFilters: (filters: BookingFilters) => void;
  resetBookingFilters: () => void;

  // Active package being edited (ID only — full data is in React Query)
  activePackageId: string | null;
  setActivePackageId: (id: string | null) => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PACKAGE_FILTERS: PackageFilters = {};
const DEFAULT_BOOKING_FILTERS: BookingFilters = {};

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Client-side UI state for the vendor portal.
 *
 * Use this store for:
 * - Filter/search state that must survive between tab switches
 * - Lightweight ID tracking for the current editing context
 *
 * Do NOT put server data (package lists, booking lists) here.
 * Those live in TanStack Query via the custom hooks in hooks/*.
 */
export const useVendorStore = create<VendorStoreState>((set) => ({
  // ── Package filters ────────────────────────────────────────
  packageFilters: DEFAULT_PACKAGE_FILTERS,

  setPackageFilters: (filters) =>
    set((state) => ({
      packageFilters: { ...state.packageFilters, ...filters },
    })),

  resetPackageFilters: () => set({ packageFilters: DEFAULT_PACKAGE_FILTERS }),

  // ── Booking filters ────────────────────────────────────────
  bookingFilters: DEFAULT_BOOKING_FILTERS,

  setBookingFilters: (filters) =>
    set((state) => ({
      bookingFilters: { ...state.bookingFilters, ...filters },
    })),

  resetBookingFilters: () => set({ bookingFilters: DEFAULT_BOOKING_FILTERS }),

  // ── Active package ─────────────────────────────────────────
  activePackageId: null,
  setActivePackageId: (id) => set({ activePackageId: id }),
}));
