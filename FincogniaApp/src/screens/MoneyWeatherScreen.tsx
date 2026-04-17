/**
 * Money Weather Screen
 * Forecast charts, cash burn simulator, events, subscriptions, emergency buffer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/designTokens';
import {
  ForecastChart,
  CashBurnSimulator,
  SubscriptionCard,
  EmergencyBufferCard,
  EventList,
} from '../components/moneyWeather';
import { getForecast } from '../services/forecastService';
import { getSubscriptions, detectSubscriptions, updateSubscription } from '../services/subscriptionService';
import { calculateEmergencyBuffer } from '../services/bufferService';
import { getUpcomingEvents } from '../services/eventService';
import { getTransactions } from '../services/transactionService';
import type { CashflowForecast } from '../types';
import type { BufferInfo } from '../services/bufferService';
import type { Subscription } from '../types';
import type { Event } from '../types';
import type { Transaction } from '../types';

export default function MoneyWeatherScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [forecast, setForecast] = useState<CashflowForecast | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bufferInfo, setBufferInfo] = useState<BufferInfo | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [
        forecastData,
        subscriptionsData,
        bufferData,
        eventsData,
        transactionsData,
      ] = await Promise.all([
        getForecast(selectedPeriod),
        getSubscriptions().catch(() => []), // Fallback to empty array
        calculateEmergencyBuffer().catch(() => null), // Fallback to null
        getUpcomingEvents(10).catch(() => []), // Fallback to empty array
        getTransactions(1000).catch(() => []), // Fallback to empty array
      ]);

      setForecast(forecastData);
      setSubscriptions(subscriptionsData);
      setBufferInfo(bufferData);
      setEvents(eventsData);
      setTransactions(transactionsData);

      // If no subscriptions, try to detect them
      if (subscriptionsData.length === 0 && transactionsData.length > 0) {
        try {
          const detected = await detectSubscriptions();
          if (detected.length > 0) {
            setSubscriptions(await getSubscriptions());
          }
        } catch (error) {
          console.warn('Error detecting subscriptions:', error);
        }
      }
    } catch (error) {
      console.error('Error loading Money Weather data:', error);
      Alert.alert('Error', 'Failed to load Money Weather data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePeriodChange = (period: '7d' | '30d' | '90d') => {
    setSelectedPeriod(period);
    // Forecast will reload via useEffect
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'Pause Subscription',
      'Are you sure you want to pause this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            try {
              await updateSubscription(subscriptionId, 'paused');
              await loadData();
              Alert.alert('Success', 'Subscription paused');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to pause subscription');
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateSubscription(subscriptionId, 'cancelled');
              await loadData();
              Alert.alert('Success', 'Subscription cancelled');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  // Calculate current balance from transactions
  const currentBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Money Weather</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading forecast...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Money Weather</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.blue}
          />
        }>
        {/* Forecast Chart */}
        <ForecastChart
          forecast={forecast}
          onPeriodChange={handlePeriodChange}
          selectedPeriod={selectedPeriod}
          loading={loading}
        />

        {/* Cash Burn Simulator */}
        <CashBurnSimulator
          currentBalance={currentBalance}
          transactions={transactions}
        />

        {/* Emergency Buffer */}
        <EmergencyBufferCard bufferInfo={bufferInfo} loading={loading} onRefresh={loadData} />

        {/* Upcoming Events */}
        <EventList events={events} loading={loading} />

        {/* Subscriptions */}
        <SubscriptionCard
          subscriptions={subscriptions}
          onPause={handlePauseSubscription}
          onCancel={handleCancelSubscription}
          onRefresh={loadData}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
});
