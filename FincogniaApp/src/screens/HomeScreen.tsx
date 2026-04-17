/**
 * Home Screen
 * Modern fintech dashboard with balance, Money Weather summary, alerts, and quick verdict
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import { HomeBalanceCard, HomeFeatureCard } from '../components/home';
import { getTransactions } from '../services/transactionService';
import { calculateEmergencyBuffer } from '../services/bufferService';
import { getUserProfile } from '../services/userService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [totalBalance, setTotalBalance] = useState(0);
  const [savings, setSavings] = useState(0);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user profile for firstName
      try {
        const profile = await getUserProfile(user.id);
        if (profile?.fullName) {
          const nameParts = profile.fullName.trim().split(' ');
          setFirstName(nameParts[0] || null);
        }
      } catch (error) {
        console.warn('[Home Screen] Could not fetch user profile:', error);
      }

      // Fetch transactions to calculate balance
      const transactions = await getTransactions(1000);
      const balance = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      setTotalBalance(balance);

      // Fetch buffer info for savings
      try {
        const bufferInfo = await calculateEmergencyBuffer();
        setSavings(bufferInfo.currentBuffer || 0);
      } catch (error) {
        console.warn('[Home Screen] Could not calculate buffer:', error);
        // Use balance as savings if buffer calculation fails
        setSavings(Math.max(0, balance));
      }
    } catch (error) {
      console.error('[Home Screen] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const greetingText = firstName ? `Hi, ${firstName}` : 'Hi there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>PaisaBuddy</Text>
            <Text style={styles.subtitle}>{greetingText}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as never)}
            activeOpacity={0.8}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{getInitials()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCardContainer}>
          <HomeBalanceCard
            totalBalance={totalBalance}
            savings={savings}
          />
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          {/* Money Weather */}
          <View style={styles.featureCardWrapper}>
            <HomeFeatureCard
              iconName="cloud"
              iconBackgroundColor={colors.accent.cyan}
              title="Money Weather"
              subtitle="Forecast summary will appear here"
              onPress={() => navigation.navigate('MoneyWeather' as never)}
            />
          </View>

          {/* Alerts */}
          <View style={styles.featureCardWrapper}>
            <HomeFeatureCard
              iconName="bell-outline"
              iconBackgroundColor={colors.accent.purple}
              title="Alerts"
              subtitle="No alerts at the moment"
            />
          </View>

          {/* Quick Verdict */}
          <View style={styles.featureCardWrapper}>
            <HomeFeatureCard
              iconName="lightning-bolt"
              iconBackgroundColor={colors.accent.brightGreen}
              title="Quick Verdict"
              subtitle="Split-second spending verdict tool"
              onPress={() => navigation.navigate('SplitSecondVerdict' as never)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Agent Button */}
      <SafeAreaView style={styles.floatingButtonContainer} edges={['bottom']}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Agent' as never)}
          activeOpacity={0.8}>
          <Icon name="message-text" size={28} color={colors.neutral.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl + 80, // Extra space for floating button
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sectionSpacing,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.regular,
    color: colors.neutral.darkGray,
  },
  profileButton: {
    marginLeft: spacing.md,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  profileInitial: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.white,
  },
  balanceCardContainer: {
    marginBottom: spacing.sectionSpacing,
  },
  featuresSection: {
    gap: spacing.listItemSpacing,
  },
  featureCardWrapper: {
    marginBottom: spacing.listItemSpacing,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    alignItems: 'flex-end',
    paddingRight: spacing.screenPadding,
    paddingBottom: spacing.md,
    pointerEvents: 'box-none',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
  },
});
