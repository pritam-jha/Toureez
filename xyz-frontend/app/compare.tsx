/**
 * @file app/compare.tsx
 * @description Comparison screen — sage green design system applied.
 * All scroll architecture, hooks, and data logic fully preserved.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ScrollView as SV } from 'react-native';

import { CompareHeader, LABEL_WIDTH } from '../components/compare/CompareHeader';
import { CompareRowCells } from '../components/compare/CompareRow';
import { BadgeCells } from '../components/compare/BadgeRow';
import { PriceCells } from '../components/compare/PriceRow';
import { RatingCells } from '../components/compare/RatingRow';
import { useAmenitiesData } from '../components/compare/AmenitiesRow';
import { HighlightsCells } from '../components/compare/HighlightsRow';
import { EmptyCompare } from '../components/compare/EmptyCompare';
import { COLUMN_WIDTH, COLUMN_GAP } from '../components/compare/AddPackageSlot';
import { Toast } from '../components/ui/Toast';
import { useCompareScreen } from '../hooks/useCompareScreen';
import { useCompareStore as useRawCompareStore } from '../store/compareStore';
import { Colors } from '../constants/colors';
import type { PackageListItem } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
}).format;

const ROW_HEIGHTS = {
  awards: 88,
  price: 100,
  rating: 88,
  standard: 64,
  highlights: 112,
  amenity: 52,
  actions: 96,
};

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function useShimmer(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
}

function Skel({ h, w = '100%' }: { h: number; w?: number | string }): React.ReactElement {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[skSt.block, { height: h, width: w, opacity }]}
      accessibilityElementsHidden
    />
  );
}

function CompareSkeleton({ count }: { count: number }): React.ReactElement {
  return (
    <View style={skSt.root}>
      <View style={skSt.headerRow}>
        <View style={skSt.labelSpacer} />
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={skSt.col}>
            <Skel h={110} w={COLUMN_WIDTH} />
            <View style={{ height: 8 }} />
            <Skel h={14} w="90%" />
            <View style={{ height: 6 }} />
            <Skel h={11} w="60%" />
          </View>
        ))}
      </View>
      {Object.values(ROW_HEIGHTS).slice(0, 6).map((h, i) => (
        <View key={i} style={[skSt.row, { height: h }]}>
          <View style={skSt.labelCell}>
            <Skel h={12} w="75%" />
          </View>
          {Array.from({ length: count }, (_, j) => (
            <View key={j} style={[skSt.cell, { width: COLUMN_WIDTH }]}>
              <Skel h={h - 24} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const skSt = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundBase },
  headerRow: {
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 12,
    gap: COLUMN_GAP,
  },
  labelSpacer: { width: LABEL_WIDTH },
  col: { width: COLUMN_WIDTH },
  row: {
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCell: {
    backgroundColor: Colors.surfacePrimary,
    borderRightColor: Colors.surfaceBorder,
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: LABEL_WIDTH,
    height: '100%',
  },
  cell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: COLUMN_GAP,
  },
  block: { backgroundColor: Colors.surfaceBorder, borderRadius: 6 },
});

// ── Cell helpers ──────────────────────────────────────────────────────────────

function TxtCell({ text }: { text: string }): React.ReactElement {
  return <Text style={cSt.text} numberOfLines={2}>{text}</Text>;
}

function CategoryCell({ pkg }: { pkg: PackageListItem }): React.ReactElement {
  return (
    <View style={cSt.catPill}>
      <Text style={cSt.catIcon}>{pkg.category.icon}</Text>
      <Text style={cSt.catLabel} numberOfLines={1}>{pkg.category.label}</Text>
    </View>
  );
}

function CompanyCell({ pkg }: { pkg: PackageListItem }): React.ReactElement {
  return (
    <View>
      <Text style={cSt.companyName} numberOfLines={2}>{pkg.company.name}</Text>
      {pkg.company.is_verified && (
        <View style={cSt.verifiedRow}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
          <Text style={cSt.verifiedTxt} numberOfLines={1}> Verified</Text>
        </View>
      )}
    </View>
  );
}

function InclusionsCell({ pkg, highlight }: { pkg: PackageListItem; highlight: boolean }): React.ReactElement {
  return (
    <View>
      <Text style={[cSt.inclCount, highlight && cSt.inclCountHL]}>
        {pkg.inclusions.length}
      </Text>
      <Text style={cSt.inclLabel}>items included</Text>
    </View>
  );
}

const cSt = StyleSheet.create({
  text: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  catPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryGlow,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  catIcon: { fontSize: 13, lineHeight: 17, marginRight: 4 },
  catLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  companyName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', lineHeight: 17, marginBottom: 3 },
  verifiedRow: { alignItems: 'center', flexDirection: 'row' },
  verifiedTxt: { color: Colors.primary, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  inclCount: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  inclCountHL: { color: Colors.success },
  inclLabel: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600', lineHeight: 14 },
});

// ── Row label ─────────────────────────────────────────────────────────────────

function RowLabel({
  label,
  height,
  isFirst = false,
  accent,
}: {
  label: string;
  height: number;
  isFirst?: boolean;
  accent?: string;
}): React.ReactElement {
  return (
    <View
      style={[
        lSt.cell,
        { height },
        isFirst && lSt.cellFirst,
        accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined,
      ]}
    >
      <Text style={lSt.text} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const lSt = StyleSheet.create({
  cell: {
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: LABEL_WIDTH,
  },
  cellFirst: { borderTopColor: Colors.surfaceBorder, borderTopWidth: 0 },
  text: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
});

// ── Action cells ──────────────────────────────────────────────────────────────

function ActionCells({
  packages,
  onEnquire,
}: {
  packages: PackageListItem[];
  onEnquire: () => void;
}): React.ReactElement {
  return (
    <View style={[aSt.row, { height: ROW_HEIGHTS.actions }]}>
      {packages.map((pkg) => (
        <View key={pkg.id} style={[aSt.cell, { width: COLUMN_WIDTH }]}>
          <Pressable
            style={aSt.viewBtn}
            onPress={() => router.push({ pathname: '/package/[id]' as never, params: { id: pkg.id } })}
            accessibilityRole="button"
            accessibilityLabel={`View ${pkg.title}`}
          >
            <Text style={aSt.viewTxt} numberOfLines={1}>View Details</Text>
          </Pressable>
          <Pressable
            style={aSt.enquireBtn}
            onPress={onEnquire}
            accessibilityRole="button"
            accessibilityLabel="Enquire"
          >
            <Text style={aSt.enquireTxt} numberOfLines={1}>Enquire</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const aSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  cell: { paddingRight: COLUMN_GAP, paddingVertical: 10 },
  viewBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    marginBottom: 8,
    paddingVertical: 10,
  },
  viewTxt: { color: Colors.white, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  enquireBtn: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 8,
  },
  enquireTxt: { color: Colors.primary, fontSize: 12, fontWeight: '700', lineHeight: 16 },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CompareScreen(): React.ReactElement {
  const compareItems = useRawCompareStore((s) => s.compareItems);
  const {
    packages,
    isLoading,
    badges,
    toast,
    hideToast,
    handleEnquire,
  } = useCompareScreen();

  const amenitiesData = useAmenitiesData(packages);
  const headerScrollRef = useRef<SV>(null);
  const bodyScrollRef = useRef<SV>(null);
  const labelScrollRef = useRef<SV>(null);
  const isSyncingH = useRef(false);
  const isSyncingV = useRef(false);

  const syncHorizontal = useCallback((x: number, source: 'header' | 'body') => {
    if (isSyncingH.current) return;
    isSyncingH.current = true;
    if (source === 'body') {
      headerScrollRef.current?.scrollTo({ x, animated: false });
    } else {
      bodyScrollRef.current?.scrollTo({ x, animated: false });
    }
    setTimeout(() => { isSyncingH.current = false; }, 50);
  }, []);

  const syncVertical = useCallback((y: number, source: 'body' | 'label') => {
    if (isSyncingV.current) return;
    isSyncingV.current = true;
    if (source === 'body') {
      labelScrollRef.current?.scrollTo({ y, animated: false });
    } else {
      bodyScrollRef.current?.scrollTo({ y, animated: false });
    }
    setTimeout(() => { isSyncingV.current = false; }, 50);
  }, []);

  if (compareItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Compare</Text>
          <View style={styles.headerRight} />
        </View>
        <EmptyCompare />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Compare</Text>
          <View style={styles.headerRight} />
        </View>
        <CompareSkeleton count={compareItems.length} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Compare</Text>
        <View style={styles.headerRight} />
      </View>

      {/* ── Sticky package header row ── */}
      <ScrollView
        ref={headerScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => syncHorizontal(e.nativeEvent.contentOffset.x, 'header')}
        style={styles.stickyHeader}
      >
        <View style={{ width: LABEL_WIDTH }} />
        <CompareHeader packages={packages} badges={badges} />
      </ScrollView>

      {/* ── Body ── */}
      <View style={styles.bodyContainer}>
        {/* Fixed label column */}
        <ScrollView
          ref={labelScrollRef}
          style={styles.labelColumn}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => syncVertical(e.nativeEvent.contentOffset.y, 'label')}
        >
          <RowLabel label="Awards" height={ROW_HEIGHTS.awards} isFirst accent={Colors.star} />
          <RowLabel label="Price" height={ROW_HEIGHTS.price} accent={Colors.primary} />
          <RowLabel label="Rating" height={ROW_HEIGHTS.rating} />
          <RowLabel label="Duration" height={ROW_HEIGHTS.standard} />
          <RowLabel label="Category" height={ROW_HEIGHTS.standard} />
          <RowLabel label="Company" height={ROW_HEIGHTS.standard} />
          <RowLabel label="Group Size" height={ROW_HEIGHTS.standard} />
          <RowLabel label="Inclusions" height={ROW_HEIGHTS.standard} />
          <RowLabel label="Highlights" height={ROW_HEIGHTS.highlights} />
          {amenitiesData.map((a) => (
            <RowLabel key={a.name} label={a.name} height={ROW_HEIGHTS.amenity} />
          ))}
          <RowLabel label="Actions" height={ROW_HEIGHTS.actions} />
        </ScrollView>

        {/* Scrollable data columns */}
        <ScrollView
          ref={bodyScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            syncHorizontal(e.nativeEvent.contentOffset.x, 'body');
            syncVertical(e.nativeEvent.contentOffset.y, 'body');
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => syncVertical(e.nativeEvent.contentOffset.y, 'body')}
          >
            <BadgeCells packages={packages} badges={badges} rowHeight={ROW_HEIGHTS.awards} />
            <PriceCells packages={packages} badges={badges} rowHeight={ROW_HEIGHTS.price} />
            <RatingCells packages={packages} badges={badges} rowHeight={ROW_HEIGHTS.rating} />

            {/* Duration */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.standard}>
              {packages.map((pkg) => (
                <TxtCell key={pkg.id} text={`${pkg.duration_days}D / ${pkg.duration_nights}N`} />
              ))}
            </CompareRowCells>

            {/* Category */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.standard}>
              {packages.map((pkg) => (
                <CategoryCell key={pkg.id} pkg={pkg} />
              ))}
            </CompareRowCells>

            {/* Company */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.standard}>
              {packages.map((pkg) => (
                <CompanyCell key={pkg.id} pkg={pkg} />
              ))}
            </CompareRowCells>

            {/* Group size */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.standard}>
              {packages.map((pkg) => (
                <TxtCell key={pkg.id} text={`${pkg.min_group_size}–${pkg.max_group_size} pax`} />
              ))}
            </CompareRowCells>

            {/* Inclusions */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.standard}>
              {packages.map((pkg) => {
                const maxInclusions = Math.max(...packages.map((p) => p.inclusions.length));
                return (
                  <InclusionsCell
                    key={pkg.id}
                    pkg={pkg}
                    highlight={pkg.inclusions.length === maxInclusions}
                  />
                );
              })}
            </CompareRowCells>

            {/* Highlights */}
            <CompareRowCells rowHeight={ROW_HEIGHTS.highlights}>
              <HighlightsCells packages={packages} />
            </CompareRowCells>

            {/* Amenities */}
            {amenitiesData.map((a) => (
              <CompareRowCells key={a.name} rowHeight={ROW_HEIGHTS.amenity}>
                {packages.map((pkg) => (
                  <View key={pkg.id} style={amenStyles.cell}>
                    <Ionicons
                      name={pkg.amenities.includes(a.name) ? 'checkmark-circle' : 'close-circle-outline'}
                      size={20}
                      color={pkg.amenities.includes(a.name) ? Colors.success : Colors.surfaceBorder}
                    />
                  </View>
                ))}
              </CompareRowCells>
            ))}

            {/* Actions */}
            <ActionCells packages={packages} onEnquire={handleEnquire} />
          </ScrollView>
        </ScrollView>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type as 'success' | 'error' | 'info'}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const amenStyles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  headerRight: { width: 36 },
  stickyHeader: {
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  bodyContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  labelColumn: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
