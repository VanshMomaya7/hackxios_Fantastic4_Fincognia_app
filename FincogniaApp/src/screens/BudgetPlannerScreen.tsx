/**
 * Budget Planner Screen
 * Comprehensive budget planning with cash burnout, policy suggestions, savings tips, and risk analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getBudgetPlannerData, downloadBudgetPlannerPDF } from '../services/budgetPlannerService';
import type { BudgetPlannerData } from '../services/budgetPlannerService';

export default function BudgetPlannerScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [plannerData, setPlannerData] = useState<BudgetPlannerData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadPlannerData();
  }, [user?.id]);

  const loadPlannerData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getBudgetPlannerData(user.id);
      setPlannerData(data);
    } catch (error) {
      console.error('[Budget Planner] Error loading data:', error);
      Alert.alert('Error', 'Failed to load budget planner data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!user?.id || !plannerData) return;

    try {
      setDownloading(true);
      const pdfUrl = await downloadBudgetPlannerPDF(user.id);
      
      if (pdfUrl) {
        // Open PDF URL (backend should return a downloadable link)
        const canOpen = await Linking.canOpenURL(pdfUrl);
        if (canOpen) {
          await Linking.openURL(pdfUrl);
        } else {
          Alert.alert('Success', 'PDF generated successfully. Check your email for download link.');
        }
      }
    } catch (error) {
      console.error('[Budget Planner] Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Planner</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading planner data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plannerData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Planner</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Unable to load planner data</Text>
          <Button title="Retry" onPress={loadPlannerData} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Planner</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadPDF}
          disabled={downloading}>
          {downloading ? (
            <ActivityIndicator size="small" color={colors.neutral.white} />
          ) : (
            <Text style={styles.downloadButtonText}>📥 Download PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Policy Suggestions Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛡️ Policy Recommendations</Text>
          {plannerData.policySuggestions && plannerData.policySuggestions.length > 0 ? (
            plannerData.policySuggestions.map((policy, index) => (
              <View key={index} style={styles.policyItem}>
                <Text style={styles.policyName}>{policy.name}</Text>
                <Text style={styles.policyType}>{policy.type}</Text>
                <Text style={styles.policyDescription}>{policy.description}</Text>
                {policy.premium && (
                  <Text style={styles.policyPremium}>
                    Premium: ₹{policy.premium.toLocaleString('en-IN')}/month
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No policy recommendations available</Text>
          )}
        </Card>

        {/* Savings Tips Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 How to Save More</Text>
          {plannerData.savingsTips && plannerData.savingsTips.length > 0 ? (
            <View style={styles.tipsList}>
              {plannerData.savingsTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipNumber}>{index + 1}.</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No savings tips available</Text>
          )}
        </Card>

        {/* Goals Achievement Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎯 Achieving Your Goals</Text>
          {plannerData.goalsAchievement && plannerData.goalsAchievement.length > 0 ? (
            plannerData.goalsAchievement.map((goalPlan, index) => (
              <View key={index} style={styles.goalPlanItem}>
                <Text style={styles.goalPlanTitle}>{goalPlan.goalName}</Text>
                <Text style={styles.goalPlanDescription}>{goalPlan.strategy}</Text>
                {goalPlan.monthlyContribution && (
                  <Text style={styles.goalPlanAmount}>
                    Monthly Contribution: ₹{goalPlan.monthlyContribution.toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No goals set yet</Text>
          )}
        </Card>

        {/* Income Risk Analysis Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚠️ Income Risk Analysis by Month</Text>
          {plannerData.incomeRisks && plannerData.incomeRisks.length > 0 ? (
            <View style={styles.risksList}>
              {plannerData.incomeRisks.map((risk, index) => (
                <View key={index} style={styles.riskItem}>
                  <View style={styles.riskHeader}>
                    <Text style={styles.riskMonth}>{risk.month}</Text>
                    <View
                      style={[
                        styles.riskBadge,
                        {
                          backgroundColor:
                            risk.riskLevel === 'high'
                              ? colors.semantic.error + '20'
                              : risk.riskLevel === 'medium'
                              ? colors.semantic.warning + '20'
                              : colors.semantic.success + '20',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.riskBadgeText,
                          {
                            color:
                              risk.riskLevel === 'high'
                                ? colors.semantic.error
                                : risk.riskLevel === 'medium'
                                ? colors.semantic.warning
                                : colors.semantic.success,
                          },
                        ]}>
                        {risk.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.riskDescription}>{risk.description}</Text>
                  {risk.suggestedActions && risk.suggestedActions.length > 0 && (
                    <View style={styles.riskActions}>
                      {risk.suggestedActions.map((action, actionIndex) => (
                        <Text key={actionIndex} style={styles.riskAction}>
                          • {action}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No risk analysis available</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  downloadButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.medium,
    minWidth: 120,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.screenPadding,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  policyItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  policyName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  policyType: {
    fontSize: typography.size.caption,
    color: colors.primary.blue,
    marginBottom: spacing.xs,
  },
  policyDescription: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  policyPremium: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
  },
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipNumber: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.primary.blue,
  },
  tipText: {
    flex: 1,
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  goalPlanItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  goalPlanTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  goalPlanDescription: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  goalPlanAmount: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  risksList: {
    gap: spacing.md,
  },
  riskItem: {
    padding: spacing.md,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskMonth: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  riskBadgeText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
  },
  riskDescription: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  riskActions: {
    marginTop: spacing.xs,
  },
  riskAction: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
});

