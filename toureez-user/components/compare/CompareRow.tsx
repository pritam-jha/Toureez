/**
 * @file components/compare/CompareRow.tsx
 * @description A single comparison row.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * This component does NOT render the label or the horizontal scroll itself.
 * The screen renders a fixed left label column and a single shared horizontal
 * ScrollView for all rows. This component only renders the CELLS for one row —
 * the screen places them inside the shared horizontal scroll.
 *
 * This is the correct pattern for a sticky-label comparison table in React Native.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../constants/colors';
import { COLUMN_WIDTH, COLUMN_GAP } from './AddPackageSlot';

export interface CompareRowCellsProps {
  cells: React.ReactNode[];
  highlightIndex?: number | null;
  highlightColor?: string;
  minHeight?: number;
}

/**
 * Renders the data cells for one comparison row.
 * Must be placed inside the shared horizontal ScrollView in the screen.
 */
export function CompareRowCells({
  cells,
  highlightIndex = null,
  highlightColor = Colors.successLight,
  minHeight = 64,
}: CompareRowCellsProps): React.ReactElement {
  return (
    <View style={[styles.cellsRow, { minHeight }]}>
      {cells.map((cell, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            { minHeight },
            index === highlightIndex && {
              backgroundColor: highlightColor,
            },
          ]}
        >
          {cell}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cellsRow: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    marginRight: COLUMN_GAP,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: COLUMN_WIDTH,
  },
});
