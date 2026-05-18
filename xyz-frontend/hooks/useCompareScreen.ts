/**
 * @file hooks/useCompareScreen.ts
 * @description Data-fetching hook for the comparison screen.
 *
 * Reads package IDs from compareStore, calls GET /api/v1/packages/compare?ids=
 * which returns PackageListItem[] with badges already computed by the backend.
 * Falls back to the compareStore's cached ComparePackage data while loading.
 *
 * Named useCompareScreen to avoid collision with the existing useCompare.ts
 * tray-controller hook.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClient } from '../lib/api/client';
import { useCompareStore as useRawCompareStore } from '../store/compareStore';
import { Config } from '../constants/config';
import type { Badge, PackageListItem } from '../types';

// ── Badge logic (mirrors backend badgeService.ts exactly) ────────────────────

function lowestPrice(pkg: PackageListItem): number | null {
  const prices = pkg.pricing.map((p) => p.discounted_price ?? p.base_price);
  const finite = prices.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.min(...finite);
}

function pushTiedBadges(
  badges: Badge[],
  packages: PackageListItem[],
  type: Badge['type'],
  score: (p: PackageListItem) => number | null,
  qualifies: (best: number) => boolean = () => true
): void {
  const scored = packages
    .map((p) => ({ package_id: p.id, score: score(p) }))
    .filter((e): e is { package_id: string; score: number } => e.score !== null);

  if (scored.length === 0) return;

  const best =
    type === 'best_value'
      ? Math.min(...scored.map((e) => e.score))
      : Math.max(...scored.map((e) => e.score));

  if (!qualifies(best)) return;

  scored
    .filter((e) => e.score === best)
    .forEach((e) => badges.push({ type, package_id: e.package_id }));
}

/**
 * Client-side badge computation — exact mirror of backend badgeService.ts.
 * Used as a fallback when the API response doesn't include badges.
 */
export function computeBadgesClient(packages: PackageListItem[]): Badge[] {
  const badges: Badge[] = [];
  pushTiedBadges(badges, packages, 'best_value', lowestPrice);
  pushTiedBadges(
    badges,
    packages,
    'highest_rated',
    (p) => p.avg_rating,
    (best) => best >= 4
  );
  pushTiedBadges(
    badges,
    packages,
    'most_inclusive',
    (p) => p.inclusions.length + p.amenities.length
  );
  return badges;
}

// ── Query key factory ─────────────────────────────────────────────────────────

export const compareQueryKeys = {
  compare: (ids: string[]) => ['packages', 'compare', ids.slice().sort()] as const,
} as const;

// ── Main hook ─────────────────────────────────────────────────────────────────

export interface UseCompareScreenReturn {
  packages: PackageListItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  canAddMore: boolean;
  compareCount: number;
}

export function useCompareScreen(): UseCompareScreenReturn {
  const compareItems = useRawCompareStore((s) => s.compareItems);
  const removeFromCompare = useRawCompareStore((s) => s.removeFromCompare);
  const clearCompare = useRawCompareStore((s) => s.clearCompare);

  const ids = compareItems.map((item) => item.id);
  const idsKey = ids.slice().sort();

  const query: UseQueryResult<PackageListItem[], Error> = useQuery({
    queryKey: compareQueryKeys.compare(idsKey),
    queryFn: async () => {
      if (ids.length < 2) return [];

      const response = await apiClient.get<PackageListItem[]>(
        '/packages/compare',
        { ids: ids.join(',') },
        false
      );

      if (response.error) throw new Error(response.error);
      if (!response.data) return [];

      // If backend didn't attach badges (shouldn't happen), compute client-side
      const pkgs = response.data;
      const hasBadges = pkgs.some((p) => p.badges.length > 0);
      if (!hasBadges) {
        const computed = computeBadgesClient(pkgs);
        return pkgs.map((p) => ({
          ...p,
          badges: computed.filter((b) => b.package_id === p.id),
        }));
      }

      return pkgs;
    },
    enabled: ids.length >= 2,
    staleTime: Config.queryStaleTimeMs,
    gcTime: Config.queryCacheTimeMs,
  });

  const handleRefetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    packages: query.data ?? [],
    isLoading: query.isLoading && ids.length >= 2,
    isError: query.isError,
    error: query.error,
    refetch: handleRefetch,
    removeFromCompare,
    clearCompare,
    canAddMore: compareItems.length < Config.maxCompareItems,
    compareCount: compareItems.length,
  };
}
