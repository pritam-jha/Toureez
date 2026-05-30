import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Layout, Spacing } from '../constants/theme';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isCompact = width < 480;
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const horizontalPadding = isDesktop ? Spacing.xxl : Spacing.lg;
    const contentWidth = Math.max(
      0,
      Math.min(width - horizontalPadding * 2, Layout.maxContentWidth),
    );

    function columnsFor(minItemWidth: number, maxColumns: number) {
      if (contentWidth <= 0) return 1;
      const columns = Math.floor((contentWidth + Spacing.md) / (minItemWidth + Spacing.md));
      return Math.max(1, Math.min(maxColumns, columns));
    }

    function itemWidth(columns: number, gap = Spacing.md) {
      return Math.floor((contentWidth - gap * (columns - 1)) / columns);
    }

    return {
      width,
      height,
      isCompact,
      isTablet,
      isDesktop,
      horizontalPadding,
      contentWidth,
      columnsFor,
      itemWidth,
    };
  }, [height, width]);
}
