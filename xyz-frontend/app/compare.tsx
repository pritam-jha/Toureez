/**
 * @file app/compare.tsx
 * @description Comparison engine screen.
 *
 * SCROLL ARCHITECTURE (correct implementation):
 * ┌─────────────┬──────────────────────────────────────┐
 * │ FIXED LEFT  │  STICKY HEADER (horizontal scroll)   │
 * │ label col   ├──────────────────────────────────────┤
 * │ (vertical   │  BODY ROWS (horizontal + vertical)   │
 * │  scroll     │  synced with header via shared ref   │
 * │  only)      │                                      │
 * └─────────────┴──────────────────────────────────────┘
 *
 * The left label column is a separate vertical ScrollView that syncs
 * its scrollY with the body's scrollY via a shared ref + mutex.
 * The header and body share a horizontal scroll ref.
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

// Row heights — must match between label column and cell column
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
      {/* Header */}
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
      {/* Rows */}
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
  root: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 12,
    gap: COLUMN_GAP,
  },
  labelSpacer: { width: LABEL_WIDTH },
  col: { width: COLUMN_WIDTH },
  row: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCell: {
    backgroundColor: Colors.background,
    borderRightColor: Colors.border,
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
  block: { backgroundColor: Colors.border, borderRadius: 6 },
});

// ── Cell helpers ──────────────────────────────────────────────────────────────

function TxtCell({ text }: { text: string }): React.ReactElement {
  return (
    <Text style={cSt.text} numberOfLines={2}>{text}</Text>
  );
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
          <Ionicons name="checkmark-circle" size={12} color={Colors.secondary} />
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
  text: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  catPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  catIcon: { fontSize: 13, lineHeight: 17, marginRight: 4 },
  catLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  companyName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', lineHeight: 17, marginBottom: 3 },
  verifiedRow: { alignItems: 'center', flexDirection: 'row' },
  verifiedTxt: { color: Colors.secondary, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  inclCount: { color: Colors.textPrimary, fontSize: 22, fontWeight: '900', lineHeight: 28 },
  inclCountHL: { color: Colors.success },
  inclLabel: { color: Colors.textTertiary, fontSize: 10, fontWeight: '600', lineHeight: 14 },
});

// ── Row label component ───────────────────────────────────────────────────────

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
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    borderRightColor: Colors.border,
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: LABEL_WIDTH,
  },
  cellFirst: { borderTopColor: Colors.border, borderTopWidth: 0 },
  text: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
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
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 10,
  },
  viewTxt: { color: Colors.white, fontSize: 12, fontWeight: '900', lineHeight: 16 },
  enquireBtn: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 8,
  },
  enquireTxt: { color: Colors.primary, fontSize: 12, fontWeight: '800', lineHeight: 16 },
});
