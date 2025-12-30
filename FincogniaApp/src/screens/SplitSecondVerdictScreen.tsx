/**
 * Split-Second Spending Verdict Screen
 * Quick tool to check if user can afford a purchase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import { getSpendVerdict, type VerdictType } from '../services/spendVerdictService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function SplitSecondVerdictScreen() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('7'); // Default: 7 days
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<{
    type: VerdictType;
    explanation: string;
    projectedMinBalance?: number;
    bufferAmount?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  } | null>(null);

  const handleGetVerdict = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setVerdict(null);

      const result = await getSpendVerdict({
        userId: user.id,
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        timeframeDays: parseInt(timeframe) || 7,
      });

      setVerdict({
        type: result.verdict,
        explanation: result.explanation,
        projectedMinBalance: result.projectedMinBalance,
        bufferAmount: result.bufferAmount,
        riskLevel: result.riskLevel,
      });
    } catch (error) {
      console.error('[Split Second Verdict] Error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to get spending verdict. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = () => {
    if (!verdict) return colors.neutral.mediumGray;
    switch (verdict.type) {
      case 'YES':
        return colors.semantic.success;
      case 'NO':
        return colors.semantic.error;
      case 'DEFER':
        return colors.semantic.warning;
      default:
        return colors.neutral.mediumGray;
    }
  };

  const getVerdictIcon = () => {
    if (!verdict) return '❓';
    switch (verdict.type) {
      case 'YES':
        return '✅';
      case 'NO':
        return '❌';
      case 'DEFER':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const getVerdictText = () => {
    if (!verdict) return '';
    switch (verdict.type) {
      case 'YES':
        return 'Yes, you can afford it!';
      case 'NO':
        return 'No, not recommended';
      case 'DEFER':
        return 'Defer for now';
      default:
        return '';
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setTimeframe('7');
    setVerdict(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Split-Second Verdict</Text>
            <Text style={styles.subtitle}>
              Get instant feedback on whether you can afford a purchase
            </Text>
          </View>

          {/* Input Form */}
          <Card style={styles.formCard}>
            <Input
              label="Amount (₹) *"
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g., 5000"
              keyboardType="decimal-pad"
              autoCapitalize="none"
            />

            <Input
              label="What are you planning to buy? (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., New phone, Groceries, etc."
              autoCapitalize="sentences"
            />

            <View style={styles.timeframeContainer}>
              <Text style={styles.timeframeLabel}>Time Period (days)</Text>
              <View style={styles.timeframeOptions}>
                {['7', '14', '30'].map((days) => (
                  <Button
                    key={days}
                    title={days === '7' ? '1 Week' : days === '14' ? '2 Weeks' : '1 Month'}
                    onPress={() => setTimeframe(days)}
                    variant={timeframe === days ? 'primary' : 'secondary'}
                    style={styles.timeframeButton}
                  />
                ))}
              </View>
            </View>

            <Button
              title={loading ? 'Checking...' : 'Get Verdict'}
              onPress={handleGetVerdict}
              loading={loading}
              disabled={loading || !amount}
              style={styles.submitButton}
            />
          </Card>

          {/* Verdict Result */}
          {verdict && (
            <Card style={[styles.verdictCard, { borderLeftColor: getVerdictColor() }]}>
              <View style={styles.verdictHeader}>
                <Text style={styles.verdictIcon}>{getVerdictIcon()}</Text>
                <Text style={[styles.verdictTitle, { color: getVerdictColor() }]}>
                  {getVerdictText()}
                </Text>
              </View>

              <View style={styles.verdictBody}>
                <Text style={styles.verdictExplanation}>{verdict.explanation}</Text>

                {verdict.projectedMinBalance !== undefined && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Projected Min Balance:</Text>
                      <Text style={[
                        styles.statValue,
                        { color: verdict.projectedMinBalance >= 0 ? colors.semantic.success : colors.semantic.error }
                      ]}>
                        ₹{Math.abs(verdict.projectedMinBalance).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {verdict.bufferAmount !== undefined && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Emergency Buffer:</Text>
                        <Text style={styles.statValue}>
                          ₹{verdict.bufferAmount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                    {verdict.riskLevel && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Risk Level:</Text>
                        <Text style={[
                          styles.statValue,
                          {
                            color:
                              verdict.riskLevel === 'low'
                                ? colors.semantic.success
                                : verdict.riskLevel === 'medium'
                                ? colors.semantic.warning
                                : colors.semantic.error
                          }
                        ]}>
                          {verdict.riskLevel.charAt(0).toUpperCase() + verdict.riskLevel.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Button
                title="Check Another Purchase"
                onPress={resetForm}
                variant="secondary"
                style={styles.resetButton}
              />
            </Card>
          )}

          {/* Info Card */}
          {!verdict && (
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>💡 How it works</Text>
              <Text style={styles.infoText}>
                • Enter the amount you want to spend{'\n'}
                • Optionally describe what you're buying{'\n'}
                • We analyze your forecasted balance, upcoming bills, and emergency buffer{'\n'}
                • Get an instant verdict with clear reasoning
              </Text>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: typography.lineHeight.body * typography.size.body,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  timeframeContainer: {
    marginBottom: spacing.md,
  },
  timeframeLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  timeframeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeframeButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  verdictCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verdictIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  verdictTitle: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  verdictBody: {
    marginBottom: spacing.md,
  },
  verdictExplanation: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    lineHeight: typography.lineHeight.body * typography.size.body,
    marginBottom: spacing.md,
  },
  statsContainer: {
    backgroundColor: colors.neutral.lightGray,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  statValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
  },
  resetButton: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primary.blue + '10',
  },
  infoTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: typography.lineHeight.body * typography.size.body,
  },
});

