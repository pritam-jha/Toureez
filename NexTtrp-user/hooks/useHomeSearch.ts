/**
 * @file hooks/useHomeSearch.ts
 * @description UI state and navigation controller for the home search card.
 */

import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';

const MIN_GROUP_SIZE = 1;
const MAX_GROUP_SIZE = 50;
const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;

export interface CalendarDay {
  date: Date;
  label: string;
  isCurrentMonth: boolean;
  isPast: boolean;
  isSelected: boolean;
}

export interface UseHomeSearchReturn {
  destination: string;
  groupSize: number;
  selectedDate: Date | null;
  selectedDateLabel: string;
  isDatePickerVisible: boolean;
  calendarTitle: string;
  calendarDays: CalendarDay[];
  setDestination: (value: string) => void;
  decrementGroupSize: () => void;
  incrementGroupSize: () => void;
  openDatePicker: () => void;
  closeDatePicker: () => void;
  selectDate: (date: Date) => void;
  showPreviousMonth: () => void;
  showNextMonth: () => void;
  submitSearch: () => void;
  focusDestinationSearch: () => void;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatParamDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date | null): string {
  if (!date) {
    return 'Select travel date';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCalendarTitle(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function buildCalendarDays(monthDate: Date, selectedDate: Date | null): CalendarDay[] {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  const today = startOfDay(new Date());
  const selected = selectedDate ? startOfDay(selectedDate).getTime() : null;

  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: CALENDAR_WEEKS * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const current = startOfDay(date);

    return {
      date,
      label: String(date.getDate()),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isPast: current.getTime() < today.getTime(),
      isSelected: selected === current.getTime(),
    };
  });
}

export function useHomeSearch(
  initialDestination: string = ''
): UseHomeSearchReturn {
  const [destination, setDestination] = useState(initialDestination);
  const [groupSize, setGroupSize] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const selectedDateLabel = useMemo(
    () => formatDisplayDate(selectedDate),
    [selectedDate]
  );

  const calendarTitle = useMemo(
    () => formatCalendarTitle(visibleMonth),
    [visibleMonth]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, selectedDate),
    [selectedDate, visibleMonth]
  );

  const buildParams = useCallback(
    (shouldFocusDestination: boolean) => {
      const params: Record<string, string> = {
        group_size: String(groupSize),
      };

      const trimmedDestination = destination.trim();

      if (trimmedDestination.length > 0) {
        params.destination = trimmedDestination;
      }

      if (selectedDate) {
        params.travel_date = formatParamDate(selectedDate);
      }

      if (shouldFocusDestination) {
        params.focus = 'destination';
      }

      return params;
    },
    [destination, groupSize, selectedDate]
  );

  const navigateToSearch = useCallback(
    (shouldFocusDestination: boolean) => {
      router.push({
        pathname: '/(tabs)/search',
        params: buildParams(shouldFocusDestination),
      });
    },
    [buildParams]
  );

  const decrementGroupSize = useCallback(() => {
    setGroupSize((current) => Math.max(MIN_GROUP_SIZE, current - 1));
  }, []);

  const incrementGroupSize = useCallback(() => {
    setGroupSize((current) => Math.min(MAX_GROUP_SIZE, current + 1));
  }, []);

  const openDatePicker = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setDatePickerVisible(false);
  }, []);

  const selectDate = useCallback((date: Date) => {
    if (startOfDay(date).getTime() < startOfDay(new Date()).getTime()) {
      return;
    }

    setSelectedDate(startOfDay(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setDatePickerVisible(false);
  }, []);

  const showPreviousMonth = useCallback(() => {
    setVisibleMonth((current) => {
      const today = startOfDay(new Date());
      const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      return previous.getTime() < currentMonth.getTime() ? current : previous;
    });
  }, []);

  const showNextMonth = useCallback(() => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  }, []);

  const submitSearch = useCallback(() => {
    navigateToSearch(false);
  }, [navigateToSearch]);

  const focusDestinationSearch = useCallback(() => {
    navigateToSearch(true);
  }, [navigateToSearch]);

  return {
    destination,
    groupSize,
    selectedDate,
    selectedDateLabel,
    isDatePickerVisible,
    calendarTitle,
    calendarDays,
    setDestination,
    decrementGroupSize,
    incrementGroupSize,
    openDatePicker,
    closeDatePicker,
    selectDate,
    showPreviousMonth,
    showNextMonth,
    submitSearch,
    focusDestinationSearch,
  };
}
