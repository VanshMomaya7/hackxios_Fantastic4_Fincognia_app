/**
 * Learn / Health Screen
 * Quizzes, fraud module, credit simulator, financial health score, tax estimate
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../constants/designTokens';
import CreditScoringCard from '../components/learn/CreditScoringCard';
import FraudQuizCard from '../components/learn/FraudQuizCard';
import StockSimulatorCard from '../components/learn/StockSimulatorCard';
import NewsCard from '../components/learn/NewsCard';

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn & Health</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Credit Scoring Card */}
        <CreditScoringCard />

        {/* Fraud Quiz Card */}
        <FraudQuizCard />

        {/* Stock Simulator Card */}
        <StockSimulatorCard />

        {/* News Card */}
        <NewsCard />

        {/* Placeholder for other modules */}
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholder}>More learning modules coming soon</Text>
          <Text style={styles.subtext}>
            Quizzes, Fraud Module, Health Score, and Tax Estimate
          </Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  placeholderSection: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  placeholder: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: typography.weight.semiBold,
  },
  subtext: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
});

