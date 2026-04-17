/**
 * Coach Screen
 * Chat-based financial coach interface
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../constants/designTokens';
import DocumentToolsCard from '../components/coach/DocumentToolsCard';
import ItrFilingCard from '../components/coach/ItrFilingCard';
import BudgetCard from '../components/coach/BudgetCard';
import SocialSecurityCard from '../components/coach/SocialSecurityCard';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Adaptive Budget Card */}
        <BudgetCard />
        
        {/* Document Tools Card */}
        <DocumentToolsCard />
        
        {/* ITR Filing Card */}
        <ItrFilingCard />
        
        {/* Social Security Card */}
        <SocialSecurityCard />

        <View style={styles.section}>
          <Text style={styles.placeholder}>Chat interface will appear here</Text>
          <Text style={styles.subtext}>Voice input and journal prompts coming soon</Text>
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
  section: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  placeholder: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtext: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
});

