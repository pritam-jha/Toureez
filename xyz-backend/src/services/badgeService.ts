import type { Badge, PackageListItem } from '../types';

const lowestPackagePrice = (packageItem: PackageListItem): number | null => {
  const prices = packageItem.pricing.map((pricing) => pricing.discounted_price ?? pricing.base_price);
  const finitePrices = prices.filter((price) => Number.isFinite(price));

  if (finitePrices.length === 0) {
    return null;
  }

  return Math.min(...finitePrices);
};

const pushTiedBadges = (
  badges: Badge[],
  packages: PackageListItem[],
  type: Badge['type'],
  score: (packageItem: PackageListItem) => number | null,
  qualifies: (winningScore: number) => boolean = () => true,
): void => {
  const scoredPackages = packages
    .map((packageItem) => ({
      package_id: packageItem.id,
      score: score(packageItem),
    }))
    .filter((entry): entry is { package_id: string; score: number } => entry.score !== null);

  if (scoredPackages.length === 0) {
    return;
  }

  const winningScore =
    type === 'best_value'
      ? Math.min(...scoredPackages.map((entry) => entry.score))
      : Math.max(...scoredPackages.map((entry) => entry.score));

  if (!qualifies(winningScore)) {
    return;
  }

  scoredPackages
    .filter((entry) => entry.score === winningScore)
    .forEach((entry) => {
      badges.push({
        type,
        package_id: entry.package_id,
      });
    });
};

/**
 * Computes comparison badges for best value, highest rated, and most inclusive packages, including all ties.
 */
export const computeBadges = (packages: PackageListItem[]): Badge[] => {
  const badges: Badge[] = [];

  pushTiedBadges(badges, packages, 'best_value', lowestPackagePrice);

  pushTiedBadges(
    badges,
    packages,
    'highest_rated',
    (packageItem) => packageItem.avg_rating,
    (winningScore) => winningScore >= 4,
  );

  pushTiedBadges(
    badges,
    packages,
    'most_inclusive',
    (packageItem) => packageItem.inclusions.length + packageItem.amenities.length,
  );

  return badges;
};
