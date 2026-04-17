/**
 * Policy Comparison Charts Component
 * Displays price and risk level comparison graphs for recommended policies
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Card from '../ui/Card';
import type { PolicyRecommendation } from '../../services/documentAnalysisService';

interface PolicyComparisonChartsProps {
  recommendations: PolicyRecommendation[];
}

const screenWidth = Dimensions.get('window').width;

/**
 * Extract numeric price from premium string (e.g., "₹5,000/year" -> 5000)
 */
function extractPrice(premium: string): number {
  if (!premium) return 0;
  
  // Remove currency symbols, commas, and text
  const numericString = premium.replace(/[₹,Rs.\s]/g, '').replace(/[^0-9]/g, '');
  const price = parseInt(numericString, 10);
  return isNaN(price) ? 0 : price;
}

/**
 * Calculate risk level based on policy features
 * Lower number = lower risk (better), Higher number = higher risk
 */
function calculateRiskLevel(policy: PolicyRecommendation): number {
  let riskScore = 50; // Base risk score (medium)
  
  // Factors that increase risk (higher score = higher risk)
  if (policy.exclusions && policy.exclusions.length > 0) {
    riskScore += policy.exclusions.length * 5; // More exclusions = higher risk
  }
  
  if (policy.cons && policy.cons.length > 0) {
    riskScore += policy.cons.length * 3; // More cons = higher risk
  }
  
  // Factors that decrease risk (lower score = lower risk)
  if (policy.coverage && policy.coverage.length > 0) {
    riskScore -= policy.coverage.length * 2; // More coverage = lower risk
  }
  
  if (policy.pros && policy.pros.length > 0) {
    riskScore -= policy.pros.length * 2; // More pros = lower risk
  }
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(riskScore)));
}

export default function PolicyComparisonCharts({ recommendations }: PolicyComparisonChartsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Prepare data for price chart
  const priceLabels = recommendations.map((rec, index) => {
    // Use short name or truncate for display
    const name = rec.name.length > 15 ? rec.name.substring(0, 12) + '...' : rec.name;
    return name;
  });
  
  const priceData = recommendations.map(rec => extractPrice(rec.premium));
  const maxPrice = Math.max(...priceData, 1000); // Minimum 1000 for better visualization

  // Prepare data for risk level chart
  const riskData = recommendations.map(rec => calculateRiskLevel(rec));
  const maxRisk = Math.max(...riskData, 50); // Minimum 50 for better visualization

  const baseChartConfig = {
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
    barPercentage: 0.7,
  };

  const chartWidth = screenWidth - spacing.screenPadding * 2 - spacing.md * 2;

  return (
    <View style={styles.container}>
      {/* Price Comparison Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Price Comparison</Text>
        <Text style={styles.chartSubtitle}>Annual Premium (₹)</Text>
        
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: priceLabels,
              datasets: [
                {
                  data: priceData,
                },
              ],
            }}
            width={chartWidth}
            height={220}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              ...baseChartConfig,
              color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          {recommendations.map((rec, index) => (
            <View key={rec.id || index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.primary.blue }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {rec.name}: {rec.premium}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Risk Level Comparison Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Risk Level Comparison</Text>
        <Text style={styles.chartSubtitle}>Lower is better (0-100 scale)</Text>
        
        <View style={styles.chartContainer}>
          <BarChart
            data={{
              labels: priceLabels,
              datasets: [
                {
                  data: riskData,
                },
              ],
            }}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...baseChartConfig,
              // Use gradient color based on average risk
              color: (opacity = 1) => {
                const avgRisk = riskData.reduce((a, b) => a + b, 0) / riskData.length;
                if (avgRisk <= 30) {
                  return `rgba(34, 197, 94, ${opacity})`; // Green (low risk)
                } else if (avgRisk <= 60) {
                  return `rgba(251, 191, 36, ${opacity})`; // Yellow (medium risk)
                } else {
                  return `rgba(239, 68, 68, ${opacity})`; // Red (high risk)
                }
              },
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
        </View>
        
        {/* Risk Level Legend */}
        <View style={styles.riskLegend}>
          <View style={styles.riskLegendItem}>
            <View style={[styles.riskDot, { backgroundColor: colors.semantic.success }]} />
            <Text style={styles.riskLegendText}>Low Risk (0-30)</Text>
          </View>
          <View style={styles.riskLegendItem}>
            <View style={[styles.riskDot, { backgroundColor: colors.semantic.warning }]} />
            <Text style={styles.riskLegendText}>Medium Risk (31-60)</Text>
          </View>
          <View style={styles.riskLegendItem}>
            <View style={[styles.riskDot, { backgroundColor: colors.semantic.error }]} />
            <Text style={styles.riskLegendText}>High Risk (61-100)</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
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
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    flex: 1,
  },
  riskLegend: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  riskLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  riskLegendText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
});

