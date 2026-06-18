/**
 * @file components/home/SearchBar.tsx
 * @description Smart home search card for destination, date, and group size.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useHomeSearch, type CalendarDay } from '../../hooks/useHomeSearch';
import { Colors } from '../../constants/colors';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface SearchBarProps {
  initialDestination?: string;
}

interface CalendarDayButtonProps {
  day: CalendarDay;
  onPress: (date: Date) => void;
}

function CalendarDayButton({
  day,
  onPress,
}: CalendarDayButtonProps): React.ReactElement {
  return (
    <Pressable
      style={[
        styles.calendarDay,
        !day.isCurrentMonth && styles.calendarDayMuted,
        day.isSelected && styles.calendarDaySelected,
      ]}
      onPress={() => onPress(day.date)}
      disabled={day.isPast}
      accessibilityRole="button"
      accessibilityLabel={`Select ${day.date.toDateString()}`}
      accessibilityState={{ disabled: day.isPast, selected: day.isSelected }}
    >
      <Text
        style={[
          styles.calendarDayText,
          !day.isCurrentMonth && styles.calendarDayTextMuted,
          day.isPast && styles.calendarDayTextDisabled,
          day.isSelected && styles.calendarDayTextSelected,
        ]}
        numberOfLines={1}
      >
        {day.label}
      </Text>
    </Pressable>
  );
}

export function SearchBar({
  initialDestination = '',
}: SearchBarProps): React.ReactElement {
  const search = useHomeSearch(initialDestination);

  return (
    <View style={styles.card}>
      <View style={styles.destinationRow}>
        <Ionicons name="location-outline" size={20} color={Colors.primary} />
        <TextInput
          style={styles.destinationInput}
          value={search.destination}
          onChangeText={search.setDestination}
          onFocus={search.focusDestinationSearch}
          placeholder="Search destination"
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Destination"
        />
      </View>

      <View style={styles.divider} />

      <Pressable
        style={styles.optionRow}
        onPress={search.openDatePicker}
        accessibilityRole="button"
        accessibilityLabel="Choose travel date"
      >
        <View style={styles.optionLeft}>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionLabel} numberOfLines={1}>
              Travel Date
            </Text>
            <Text style={styles.optionValue} numberOfLines={1}>
              {search.selectedDateLabel}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.optionRow}>
        <View style={styles.optionLeft}>
          <Ionicons name="people-outline" size={20} color={Colors.primary} />
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionLabel} numberOfLines={1}>
              Group Size
            </Text>
            <Text style={styles.optionValue} numberOfLines={1}>
              {search.groupSize} traveller{search.groupSize === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            onPress={search.decrementGroupSize}
            accessibilityRole="button"
            accessibilityLabel="Decrease group size"
            hitSlop={8}
          >
            <Ionicons name="remove" size={18} color={Colors.primary} />
          </Pressable>

          <Text style={styles.stepperCount} numberOfLines={1}>
            {search.groupSize}
          </Text>

          <Pressable
            style={styles.stepperButton}
            onPress={search.incrementGroupSize}
            accessibilityRole="button"
            accessibilityLabel="Increase group size"
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.searchButton}
        onPress={search.submitSearch}
        accessibilityRole="button"
        accessibilityLabel="Search packages"
      >
        <Ionicons name="search" size={18} color={Colors.white} />
        <Text style={styles.searchButtonText} numberOfLines={1}>
          Search
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={search.isDatePickerVisible}
        animationType="fade"
        onRequestClose={search.closeDatePicker}
      >
        <Pressable style={styles.modalBackdrop} onPress={search.closeDatePicker}>
          <Pressable style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.calendarNavButton}
                onPress={search.showPreviousMonth}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={Colors.textPrimary}
                />
              </Pressable>

              <Text style={styles.calendarTitle} numberOfLines={1}>
                {search.calendarTitle}
              </Text>

              <Pressable
                style={styles.calendarNavButton}
                onPress={search.showNextMonth}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textPrimary}
                />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <Text
                  key={`${label}-${index}`}
                  style={styles.weekdayText}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {search.calendarDays.map((day) => (
                <CalendarDayButton
                  key={day.date.toISOString()}
                  day={day}
                  onPress={search.selectDate}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    padding: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  destinationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  destinationInput: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    minHeight: 44,
    paddingVertical: 0,
  },
  divider: {
    backgroundColor: Colors.surfaceBorder,
    height: 1,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
  },
  optionLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  optionLabel: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  optionValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderColor: Colors.surfaceBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperCount: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 34,
    textAlign: 'center',
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginLeft: 8,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    color: Colors.textTertiary,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    width: '14.2857%',
  },
  calendarDayMuted: {
    opacity: 0.4,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
  },
  calendarDayText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  calendarDayTextMuted: {
    color: Colors.textTertiary,
  },
  calendarDayTextDisabled: {
    color: Colors.surfaceBorder,
  },
  calendarDayTextSelected: {
    color: Colors.white,
  },
});
