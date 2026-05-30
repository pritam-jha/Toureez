/**
 * @file hooks/useCompare.ts
 * @description Typed compare tray controller over the Zustand store.
 */

import { useCallback } from 'react';

import { Config } from '../constants/config';
import {
  useCompareStore as useRawCompareStore,
} from '../store/compareStore';
import { getPackageDestinationImage } from '../utils/packageImages';
import type { ComparePackage, PackageListItem } from '../types';

export type AddToCompareResult = 'added' | 'already_added' | 'tray_full';

export interface UseCompareReturn {
  compareItems: ComparePackage[];
  compareCount: number;
  isTrayFull: boolean;
  addToCompare: (pkg: PackageListItem) => AddToCompareResult;
  removeFromCompare: (packageId: string) => void;
  clearCompare: () => void;
  isInCompare: (packageId: string) => boolean;
}

function toComparePackage(pkg: PackageListItem): ComparePackage {
  return {
    id: pkg.id,
    title: pkg.title,
    cover_image: pkg.cover_image ?? getPackageDestinationImage(pkg),
    duration_days: pkg.duration_days,
    duration_nights: pkg.duration_nights,
    avg_rating: pkg.avg_rating,
    review_count: pkg.review_count,
    is_featured: pkg.is_featured,
    is_bestseller: pkg.is_bestseller,
    company: pkg.company,
    location: pkg.location,
    category: pkg.category,
    pricing: pkg.pricing,
  };
}

export function useCompareStore(): UseCompareReturn {
  const compareItems = useRawCompareStore((state) => state.compareItems);
  const storeAdd = useRawCompareStore((state) => state.addToCompare);
  const removeFromCompare = useRawCompareStore(
    (state) => state.removeFromCompare
  );
  const clearCompare = useRawCompareStore((state) => state.clearCompare);
  const isInCompare = useRawCompareStore((state) => state.isInCompare);

  const addToCompare = useCallback(
    (pkg: PackageListItem): AddToCompareResult => {
      if (isInCompare(pkg.id)) {
        return 'already_added';
      }

      if (compareItems.length >= Config.maxCompareItems) {
        return 'tray_full';
      }

      storeAdd(toComparePackage(pkg));
      return 'added';
    },
    [compareItems.length, isInCompare, storeAdd]
  );

  return {
    compareItems,
    compareCount: compareItems.length,
    isTrayFull: compareItems.length >= Config.maxCompareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
  };
}

export const useCompare = useCompareStore;
