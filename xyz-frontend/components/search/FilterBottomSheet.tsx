/**
 * @file components/search/FilterBottomSheet.tsx
 * @description Full filter panel implemented as a custom bottom sheet.
 *
 * Built entirely with React Native primitives — no @gorhom/bottom-sheet
 * or @react-native-community/slider required. Uses:
 * - Modal (transparent) for the overlay
 * - Animated + PanResponder for the drag-to-dismiss gesture
 * - A custom two-thumb range slider built with PanResponder
 *
 * Sections:
 *   1. Budget — custom two-thumb range slider
 *   2. Duration — pill selector (buckets)
 *   3. Category — multi-select grid from useCategories
 *   4. Min Rating — star selector
 *   5. Sort by — option list
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
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCategories } from '../../hooks/useHomeData';
import {
  DURATION_BUCKETS,
  SORT_OPTIONS,
} from '../../hooks/useSearch';
import { Colors } from '../../constants/colors';
import type { DurationBucket, SearchScreenFilters, SortOption } from '../../hooks/useSearch';

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92;
const DISMISS_THRESHOLD = 80; // px dragged down before auto-dismiss
const ANIMATION_DURATION = 280;

const PRICE_MIN = 0;
const PRICE_MAX = 200000;
const PRICE_STEP = 1000;

const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FilterBottomSheetProps {
  visible: boolean;
  filters: SearchScreenFilters;
  onApply: (filters: SearchScreenFilters) => void;
  onClose: () => void;
}

// ── Custom range slider ───────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

function RangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: RangeSliderProps): React.ReactElement {
  const trackRef = useRef<View>(null);
  const trackWidth = useRef(0);

  // Convert value → position ratio [0, 1]
  const toRatio = useCallback(
    (value: number) => (value - min) / (max - min),
    [min, max]
  );

  // Convert position ratio → snapped value
  const toValue = useCallback(
    (ratio: number) => {
      const raw = ratio * (max - min) + min;
      return Math.round(raw / step) * step;
    },
    [min, max, step]
  );

  const clamp = useCallback(
    (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v)),
    []
  );

  // Animated positions for the two thumbs
  const leftPos = useRef(new Animated.Value(toRatio(valueMin))).current;
  const rightPos = useRef(new Animated.Value(toRatio(valueMax))).current;

  // Keep animated values in sync when props change externally
  useEffect(() => {
    leftPos.setValue(toRatio(valueMin));
  }, [valueMin, leftPos, toRatio]);

  useEffect(() => {
    rightPos.setValue(toRatio(valueMax));
  }, [valueMax, rightPos, toRatio]);

  // PanResponder for the LEFT thumb
  const leftPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (trackWidth.current === 0) return;
          const currentRatio = toRatio(valueMin);
          const delta = gestureState.dx / trackWidth.current;
          const newRatio = clamp(currentRatio + delta, 0, toRatio(valueMax) - toRatio(step));
          leftPos.setValue(newRatio);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (trackWidth.current === 0) return;
          const currentRatio = toRatio(valueMin);
          const delta = gestureState.dx / trackWidth.current;
          const newRatio = clamp(currentRatio + delta, 0, toRatio(valueMax) - toRatio(step));
          const newValue = clamp(toValue(newRatio), min, valueMax - step);
          onChangeMin(newValue);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valueMin, valueMax, trackWidth]
  );

  // PanResponder for the RIGHT thumb
  const rightPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (trackWidth.current === 0) return;
          const currentRatio = toRatio(valueMax);
          const delta = gestureState.dx / trackWidth.current;
          const newRatio = clamp(currentRatio + delta, toRatio(valueMin) + toRatio(step), 1);
          rightPos.setValue(newRatio);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (trackWidth.current === 0) return;
          const currentRatio = toRatio(valueMax);
          const delta = gestureState.dx / trackWidth.current;
          const newRatio = clamp(currentRatio + delta, toRatio(valueMin) + toRatio(step), 1);
          const newValue = clamp(toValue(newRatio), valueMin + step, max);
          onChangeMax(newValue);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valueMin, valueMax, trackWidth]
  );

  const THUMB_SIZE = 24;

  return (
    <View style={sliderStyles.container}>
      <View
        ref={trackRef}
        style={sliderStyles.track}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Inactive track left */}
        <Animated.View
          style={[
            sliderStyles.trackInactive,
            {
              width: leftPos.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* Active track between thumbs */}
        <Animated.View
          style={[
            sliderStyles.trackActive,
            {
              left: leftPos.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              right: rightPos.interpolate({
                inputRange: [0, 1],
                outputRange: ['100%', '0%'],
              }),
            },
          ]}
        />
        {/* Inactive track right */}
        <Animated.View
          style={[
            sliderStyles.trackInactive,
            {
              width: rightPos.interpolate({
                inputRange: [0, 1],
                outputRange: ['100%', '0%'],
              }),
            },
          ]}
        />

        {/* Left thumb */}
        <Animated.View
          {...leftPanResponder.panHandlers}
          style={[
            sliderStyles.thumb,
            {
              left: leftPos.interpolate({
                inputRange: [0, 1],
                outputRange: [-THUMB_SIZE / 2, trackWidth.current - THUMB_SIZE / 2],
              }),
            },
          ]}
          accessibilityRole="adjustable"
          accessibilityLabel="Minimum price"
          accessibilityValue={{ min, max, now: valueMin }}
        />

        {/* Right thumb */}
        <Animated.View
          {...rightPanResponder.panHandlers}
          style={[
            sliderStyles.thumb,
            {
              left: rightPos.interpolate({
                inputRange: [0, 1],
                outputRange: [-THUMB_SIZE / 2, trackWidth.current - THUMB_SIZE / 2],
              }),
            },
          ]}
          accessibilityRole="adjustable"
          accessibilityLabel="Maximum price"
          accessibilityValue={{ min, max, now: valueMax }}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
  },
  track: {
    backgroundColor: Colors.border,
    borderRadius: 3,
    flexDirection: 'row',
    height: 6,
    position: 'relative',
  },
  trackInactive: {
    backgroundColor: Colors.border,
    borderRadius: 3,
    height: 6,
  },
  trackActive: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    top: 0,
  },
  thumb: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 2.5,
    elevation: 4,
    height: 24,
    position: 'absolute',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    top: -9,
    width: 24,
  },
});

// ── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }): React.ReactElement {
  return <Text style={sectionStyles.label}>{label}</Text>;
}

const sectionStyles = StyleSheet.create({
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 10,
    marginTop: 20,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export function FilterBottomSheet({
  visible,
  filters,
  onApply,
  onClose,
}: FilterBottomSheetProps): React.ReactElement {
  const { data: categories } = useCategories();

  // Local draft state — only committed to parent on "Apply"
  const [draft, setDraft] = useState<SearchScreenFilters>(filters);

  // Sync draft when sheet opens with latest external filters
  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  // Sheet slide animation
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_MAX_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Drag-to-dismiss PanResponder on the handle
  const dragY = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => gs.dy > 4,
        onPanResponderMove: (_, gs) => {
          if (gs.dy > 0) {
            dragY.setValue(gs.dy);
          }
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > DISMISS_THRESHOLD) {
            Animated.timing(translateY, {
              toValue: SHEET_MAX_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }).start(onClose);
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
          dragY.setValue(0);
        },
      }),
    [dragY, translateY, onClose]
  );

  // ── Draft update helpers ──────────────────────────────────────────────────

  const setMinPrice = useCallback((v: number) => {
    setDraft((prev) => ({ ...prev, min_price: v === PRICE_MIN ? undefined : v }));
  }, []);

  const setMaxPrice = useCallback((v: number) => {
    setDraft((prev) => ({ ...prev, max_price: v === PRICE_MAX ? undefined : v }));
  }, []);

  const toggleDuration = useCallback((bucket: DurationBucket) => {
    setDraft((prev) => ({
      ...prev,
      duration_bucket:
        prev.duration_bucket === bucket ? undefined : bucket,
    }));
  }, []);

  const toggleCategory = useCallback((categoryName: string) => {
    setDraft((prev) => ({
      ...prev,
      category: prev.category === categoryName ? undefined : categoryName,
    }));
  }, []);

  const setMinRating = useCallback((rating: number) => {
    setDraft((prev) => ({
      ...prev,
      min_rating: prev.min_rating === rating ? undefined : rating,
    }));
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setDraft((prev) => ({ ...prev, sort }));
  }, []);

  const handleReset = useCallback(() => {
    setDraft({});
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  // Active filter count for the badge
  const activeCount = useMemo(() => {
    let count = 0;
    if (draft.min_price !== undefined || draft.max_price !== undefined) count++;
    if (draft.duration_bucket) count++;
    if (draft.category) count++;
    if (draft.min_rating !== undefined) count++;
    return count;
  }, [draft]);

  // Price display
  const priceMinDisplay = draft.min_price ?? PRICE_MIN;
  const priceMaxDisplay = draft.max_price ?? PRICE_MAX;

  const formatPriceLabel = (v: number): string => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
    return `₹${v}`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: Animated.add(translateY, dragY),
                },
              ],
            },
          ]}
        >
          {/* Drag handle */}
          <View
            style={styles.handleArea}
            {...panResponder.panHandlers}
            accessibilityRole="none"
          >
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Filters
              {activeCount > 0 && (
                <Text style={styles.headerBadge}> ({activeCount})</Text>
              )}
            </Text>
            <Pressable
              style={styles.resetButton}
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
              hitSlop={8}
            >
              <Text style={styles.resetText} numberOfLines={1}>
                Reset All
              </Text>
            </Pressable>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── 1. Budget ── */}
            <SectionLabel label="Budget" />
            <View style={styles.priceLabels}>
              <Text style={styles.priceValue} numberOfLines={1}>
                {formatPriceLabel(priceMinDisplay)}
              </Text>
              <Text style={styles.priceSeparator}>—</Text>
              <Text style={styles.priceValue} numberOfLines={1}>
                {priceMaxDisplay >= PRICE_MAX
                  ? 'Any'
                  : formatPriceLabel(priceMaxDisplay)}
              </Text>
            </View>
            <RangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              valueMin={priceMinDisplay}
              valueMax={priceMaxDisplay}
              onChangeMin={setMinPrice}
              onChangeMax={setMaxPrice}
            />

            {/* ── 2. Duration ── */}
            <SectionLabel label="Duration" />
            <View style={styles.pillRow}>
              {DURATION_BUCKETS.map((bucket) => {
                const isSelected = draft.duration_bucket === bucket.value;
                return (
                  <Pressable
                    key={bucket.value}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleDuration(bucket.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={bucket.label}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {bucket.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── 3. Category ── */}
            <SectionLabel label="Category" />
            {categories && categories.length > 0 ? (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isSelected = draft.category === cat.name;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryCell,
                        isSelected && styles.categoryCellSelected,
                      ]}
                      onPress={() => toggleCategory(cat.name)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={cat.label}
                    >
                      <Text style={styles.categoryIcon} numberOfLines={1}>
                        {cat.icon}
                      </Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          isSelected && styles.categoryLabelSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.loadingText} numberOfLines={1}>
                Loading categories…
              </Text>
            )}

            {/* ── 4. Min Rating ── */}
            <SectionLabel label="Minimum Rating" />
            <View style={styles.pillRow}>
              {RATING_OPTIONS.map((opt) => {
                const isSelected = draft.min_rating === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.ratingPill, isSelected && styles.pillSelected]}
                    onPress={() => setMinRating(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${opt.label} stars`}
                  >
                    <Ionicons
                      name="star"
                      size={13}
                      color={isSelected ? Colors.white : Colors.star}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {' '}{opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── 5. Sort by ── */}
            <SectionLabel label="Sort by" />
            {SORT_OPTIONS.map((opt) => {
              const isSelected = (draft.sort ?? 'best_match') === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.sortOption, isSelected && styles.sortOptionSelected]}
                  onPress={() => setSort(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={opt.label}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.primary}
                    />
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </Pressable>
              );
            })}

            {/* Bottom padding so Apply button doesn't overlap last item */}
            <View style={styles.scrollPadding} />
          </ScrollView>

          {/* Apply button — fixed at bottom */}
          <View style={styles.footer}>
            <Pressable
              style={styles.applyButton}
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
            >
              <Text style={styles.applyButtonText} numberOfLines={1}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    backgroundColor: Colors.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SHEET_MAX_HEIGHT,
  },
  handleArea: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 12,
  },
  handle: {
    backgroundColor: Colors.border,
    borderRadius: 3,
    height: 4,
    width: 40,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  headerBadge: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  resetButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  resetText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollPadding: {
    height: 20,
  },
  priceLabels: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  priceValue: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    minWidth: 60,
    textAlign: 'center',
  },
  priceSeparator: {
    color: Colors.textTertiary,
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  pillTextSelected: {
    color: Colors.white,
  },
  ratingPill: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryCell: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    margin: 4,
    minHeight: 68,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: '22%',
  },
  categoryCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.white,
  },
  loadingText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sortOption: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  sortOptionSelected: {
    backgroundColor: Colors.background,
  },
  sortOptionText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginRight: 12,
  },
  sortOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  radioEmpty: {
    borderColor: Colors.border,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  footer: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 32,
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
});
