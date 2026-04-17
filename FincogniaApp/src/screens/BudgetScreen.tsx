/**
 * Budget Screen
 * Adaptive Budgeting with auto-generated budgets, spend velocity monitoring, and alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import { fetchAdaptiveBudget, getCurrentMonth } from '../services/budgetService';
import type { BudgetPlan, BudgetAlert, BudgetMode } from '../types/budget';
import Card from '../components/ui/Card';
import SpendVelocityChart from '../components/budget/SpendVelocityChart';
import BufferChart from '../components/budget/BufferChart';
import AddGoalModal from '../components/budget/AddGoalModal';
import type { AdaptiveBudgetResponse } from '../services/budgetService';

const MODES: { key: BudgetMode; label: string }[] = [
  { key: 'survival', label: 'Survival' },
  { key: 'normal', label: 'Normal' },
  { key: 'growth', label: 'Growth' },
];

function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 0.75) {
    return { label: 'High Confidence', color: colors.semantic.success };
  } else if (score >= 0.5) {
    return { label: 'Medium Confidence', color: colors.semantic.warning };
  } else if (score >= 0.25) {
    return { label: 'Low Confidence', color: colors.semantic.warning };
  } else {
    return { label: 'Very Low', color: colors.semantic.error };
  }
}

function getSeverityColor(severity: BudgetAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return colors.semantic.error;
    case 'warning':
      return colors.semantic.warning;
    case 'info':
      return colors.primary.blue;
    default:
      return colors.neutral.mediumGray;
  }
}

export default function BudgetScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [budgetData, setBudgetData] = useState<AdaptiveBudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<BudgetMode | null>(null);
  const currentMonth = getCurrentMonth();

  const loadBudget = async (mode?: BudgetMode) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await fetchAdaptiveBudget({
        userId: user.id,
        month: currentMonth,
        mode: mode || undefined,
      });
      setBudgetData(data);
      setSelectedMode(data.budgetPlan.mode);
    } catch (error) {
      console.error('[Budget Screen] Error loading budget:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBudget(selectedMode || undefined);
  };

  const handleModeChange = async (mode: BudgetMode) => {
    if (mode === selectedMode) return;
    setSelectedMode(mode);
    await loadBudget(mode);
  };

  const handleModeSuggestion = async (alert: BudgetAlert) => {
    if (alert.type === 'MODE_SUGGESTION' && alert.suggestedAction) {
      // Extract mode from suggested action
      const action = alert.suggestedAction.toLowerCase();
      if (action.includes('survival')) {
        await handleModeChange('survival');
      } else if (action.includes('growth')) {
        await handleModeChange('growth');
      }
    }
  };

  if (loading && !budgetData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Adaptive Budget</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading budget...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!budgetData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Adaptive Budget</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Unable to load budget</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadBudget()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { budgetPlan, alerts } = budgetData;
  const confidenceInfo = getConfidenceLabel(budgetPlan.confidenceScore);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Adaptive Budget</Text>
          <TouchableOpacity
            style={styles.plannerButton}
            onPress={() => navigation.navigate('BudgetPlanner' as never)}>
            <Text style={styles.plannerButtonText}>📋 Planner Mode</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceInfo.color + '20' }]}>
          <View style={[styles.confidenceDot, { backgroundColor: confidenceInfo.color }]} />
          <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>
            {confidenceInfo.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary.blue} />}>
        
        {/* Mode Selector */}
        <Card style={styles.modeSelectorCard}>
          <Text style={styles.sectionTitle}>Budget Mode</Text>
          <View style={styles.modeButtons}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeButton,
                  selectedMode === mode.key && styles.modeButtonActive,
                ]}
                onPress={() => handleModeChange(mode.key)}>
                <Text
                  style={[
                    styles.modeButtonText,
                    selectedMode === mode.key && styles.modeButtonTextActive,
                  ]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expected Income</Text>
            <Text style={styles.summaryValue}>
              ₹{budgetPlan.totalIncomeExpected.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Planned</Text>
            <Text style={styles.summaryValue}>
              ₹{budgetPlan.totalPlanned.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Buffer Target</Text>
            <Text style={styles.summaryValue}>
              ₹{budgetPlan.bufferTarget.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Buffer</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    budgetPlan.bufferCurrent >= budgetPlan.bufferTarget * 0.8
                      ? colors.semantic.success
                      : budgetPlan.bufferCurrent >= budgetPlan.bufferTarget * 0.5
                      ? colors.semantic.warning
                      : colors.semantic.error,
                },
              ]}>
              ₹{budgetPlan.bufferCurrent.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.confidenceBar}>
            <View style={styles.confidenceBarBackground}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${budgetPlan.confidenceScore * 100}%`, backgroundColor: confidenceInfo.color },
                ]}
              />
            </View>
            <Text style={styles.confidenceBarText}>
              Confidence: {Math.round(budgetPlan.confidenceScore * 100)}%
            </Text>
          </View>
        </Card>

        {/* Charts Section */}
        {budgetPlan.dailySpendData && budgetPlan.dailySpendData.length > 0 && (
          <SpendVelocityChart dailySpendData={budgetPlan.dailySpendData} />
        )}

        {budgetPlan.bufferHistory && budgetPlan.bufferHistory.length > 0 && (
          <BufferChart
            bufferHistory={budgetPlan.bufferHistory}
            bufferTarget={budgetPlan.bufferTarget}
            bufferCurrent={budgetPlan.bufferCurrent}
          />
        )}

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: getSeverityColor(alert.severity) }]} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  {alert.suggestedAction && (
                    <TouchableOpacity
                      style={styles.alertActionButton}
                      onPress={() => handleModeSuggestion(alert)}>
                      <Text style={styles.alertActionText}>{alert.suggestedAction}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Categories List */}
        <Card style={styles.categoriesCard}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {budgetPlan.categories && budgetPlan.categories.length > 0 ? (
            budgetPlan.categories.map((category) => {
              const percentageSpent = category.monthlyLimit > 0
                ? (category.spentThisPeriod / category.monthlyLimit) * 100
                : 0;
              const isOverBudget = percentageSpent > 100;
              const isAtRisk = category.daysUntilExhausted < 5 && category.daysUntilExhausted !== Infinity;

              return (
                <View key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{category.label}</Text>
                    <View style={styles.categoryAmounts}>
                      <Text style={styles.categorySpent}>
                        ₹{category.spentThisPeriod.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.categoryLimit}>
                        / ₹{category.monthlyLimit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${Math.min(100, percentageSpent)}%`,
                          backgroundColor: isOverBudget
                            ? colors.semantic.error
                            : percentageSpent > 80
                            ? colors.semantic.warning
                            : colors.semantic.success,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryDetailText}>
                      Remaining: ₹{category.remaining.toLocaleString('en-IN')}
                    </Text>
                    {category.burnRate > 0 && (
                      <Text style={styles.categoryDetailText}>
                        Burn Rate: ₹{category.burnRate.toFixed(0)}/day
                      </Text>
                    )}
                    {isAtRisk && (
                      <Text style={[styles.categoryDetailText, { color: colors.semantic.warning }]}>
                        ⚠️ Runs out in {Math.round(category.daysUntilExhausted)} days
                      </Text>
                    )}
                    {category.burnRate > category.dailyRecommended * 1.2 && (
                      <Text style={[styles.categoryDetailText, { color: colors.semantic.warning }]}>
                        ⚡ Spending {Math.round((category.burnRate / category.dailyRecommended) * 100)}% faster
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No categories available</Text>
          )}
        </Card>

        {/* Goals Section */}
        <GoalsSection budgetPlan={budgetPlan} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Goals Section Component
function GoalsSection({ budgetPlan }: { budgetPlan: BudgetPlan }) {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addGoalModalVisible, setAddGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    if (!user?.id) return;
    try {
      const { getGoals } = await import('../services/goalService');
      const goalsData = await getGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('[Goals Section] Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setAddGoalModalVisible(true);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setAddGoalModalVisible(true);
  };

  const handleGoalSaved = () => {
    loadGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteGoal } = await import('../services/goalService');
              await deleteGoal(goalId);
              Alert.alert('Success', 'Goal deleted successfully');
              loadGoals();
            } catch (error: any) {
              console.error('[Goals Section] Error deleting goal:', error);
              Alert.alert('Error', error.message || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <>
      <Card style={styles.goalsCard}>
        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>Financial Goals</Text>
          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={handleAddGoal}>
            <Text style={styles.addGoalButtonText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary.blue} />
      ) : goals.length === 0 ? (
        <View style={styles.emptyGoalsContainer}>
          <Text style={styles.emptyGoalsText}>No goals set yet</Text>
          <Text style={styles.emptyGoalsSubtext}>
            Set financial goals to track your progress
          </Text>
        </View>
      ) : (
        goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount || 0) / goal.targetAmount : 0;
          const daysRemaining = Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalItem}
              onPress={() => handleEditGoal(goal)}
              onLongPress={() => handleDeleteGoal(goal.id)}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalProgress}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View style={styles.goalAmounts}>
                <Text style={styles.goalCurrent}>{formatAmount(goal.currentAmount || 0)}</Text>
                <Text style={styles.goalTarget}>/ {formatAmount(goal.targetAmount)}</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View
                  style={[
                    styles.goalProgressFill,
                    { width: `${Math.min(100, progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.goalDetails}>
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Goal deadline passed'}
                {goal.monthlyContribution > 0 && ` • ₹${goal.monthlyContribution.toLocaleString('en-IN')}/month needed`}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
      </Card>

      {/* Add/Edit Goal Modal */}
      {addGoalModalVisible && (
        <AddGoalModal
          visible={addGoalModalVisible}
          onClose={() => {
            setAddGoalModalVisible(false);
            setEditingGoal(null);
          }}
          onSave={handleGoalSaved}
          editingGoal={editingGoal}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.medium,
  },
  plannerButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
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
  },
  emptyText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.medium,
  },
  retryButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  modeSelectorCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary.blue,
  },
  modeButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
  },
  modeButtonTextActive: {
    color: colors.neutral.white,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  summaryValue: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  confidenceBar: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: borderRadius.small,
  },
  confidenceBarText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  alertsCard: {
    marginBottom: spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  alertActionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.small,
    marginTop: spacing.xs,
  },
  alertActionText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  categoriesCard: {
    marginBottom: spacing.md,
  },
  categoryItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  categorySpent: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  categoryLimit: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
  categoryBarContainer: {
    height: 8,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.small,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: borderRadius.small,
  },
  categoryDetails: {
    gap: spacing.xs,
  },
  categoryDetailText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  goalsCard: {
    marginBottom: spacing.md,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addGoalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.small,
  },
  addGoalButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  emptyGoalsContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyGoalsText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs,
  },
  emptyGoalsSubtext: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  goalItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  goalName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    flex: 1,
  },
  goalProgress: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.primary.blue,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  goalCurrent: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  goalTarget: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.semantic.success,
    borderRadius: borderRadius.small,
  },
  goalDetails: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
});

