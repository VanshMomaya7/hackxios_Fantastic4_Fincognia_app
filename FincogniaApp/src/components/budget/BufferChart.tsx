/**
 * Buffer Chart Component
 * Line chart showing buffer level vs target over the last 30 days
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Card from '../ui/Card';
import type { BufferHistoryPoint } from '../../types/budget';

interface BufferChartProps {
  bufferHistory: BufferHistoryPoint[];
  bufferTarget: number;
  bufferCurrent: number;
}

const screenWidth = Dimensions.get('window').width;

export default function BufferChart({ bufferHistory, bufferTarget, bufferCurrent }: BufferChartProps) {
  if (!bufferHistory || bufferHistory.length === 0) {
    return null;
  }

  // Prepare chart data
  // Show only last 30 days, label every 5 days
  const displayData = bufferHistory.slice(-30); // Last 30 days
  
  const labels = displayData.map((item, index) => {
    // Label every 5th point
    return index % 5 === 0 ? new Date(item.date).getDate().toString() : '';
  });

  const bufferAmounts = displayData.map(item => item.bufferAmount);
  const targetLine = displayData.map(() => bufferTarget);

  const chartWidth = screenWidth - spacing.screenPadding * 2 - spacing.md * 2;
  const maxValue = Math.max(
    ...bufferAmounts,
    bufferTarget,
    1000 // Minimum scale
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Buffer Level</Text>
      <Text style={styles.subtitle}>Current vs Target over Last 30 Days (₹)</Text>

      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: targetLine,
                color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`, // Yellow for target
                strokeWidth: 2,
              },
              {
                data: bufferAmounts,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green for current
                strokeWidth: 3,
              },
            ],
          }}
          width={chartWidth}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.neutral.white,
            backgroundGradientFrom: colors.neutral.white,
            backgroundGradientTo: colors.neutral.white,
            decimalPlaces: 0,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: borderRadius.medium,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.border.subtle,
              strokeWidth: 1,
            },
            propsForDots: {
              r: '3',
              strokeWidth: '2',
            },
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          withDots={false}
          withShadow={false}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.semantic.warning }]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.semantic.success }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
      </View>

      {/* Current buffer status */}
      <View style={styles.bufferStatus}>
        <Text style={styles.bufferStatusLabel}>Current Buffer:</Text>
        <Text style={[styles.bufferStatusValue, { 
          color: bufferCurrent >= bufferTarget * 0.8 ? colors.semantic.success : 
                 bufferCurrent >= bufferTarget * 0.5 ? colors.semantic.warning : 
                 colors.semantic.error 
        }]}>
          ₹{bufferCurrent.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.bufferStatusTarget}>
          / ₹{bufferTarget.toLocaleString('en-IN')} target
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
  bufferStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bufferStatusLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  bufferStatusValue: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
  },
  bufferStatusTarget: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
});

