/**
 * Bottom Tab Navigator
 */

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../constants/designTokens';
import type { RootTabParamList } from '../types/navigation';

// Screens (will be created next)
import HomeScreen from '../screens/HomeScreen';
import CoachScreen from '../screens/CoachScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import MoneyWeatherScreen from '../screens/MoneyWeatherScreen';
import LearnScreen from '../screens/LearnScreen';

// Import custom icons
const homeIcon = require('../icons/home.jpeg');
const coachIcon = require('../icons/coach.jpeg');
const transactionsIcon = require('../icons/transactions.jpeg');
const weatherIcon = require('../icons/weather.jpeg');
const learnIcon = require('../icons/learn.jpeg');

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.blue,
        tabBarInactiveTintColor: colors.neutral.mediumGray,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.caption,
          fontWeight: typography.weight.medium,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={homeIcon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={CoachScreen}
        options={{
          tabBarLabel: 'Coach',
          tabBarIcon: ({ focused }) => (
            <Image
              source={coachIcon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ focused }) => (
            <Image
              source={transactionsIcon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MoneyWeather"
        component={MoneyWeatherScreen}
        options={{
          tabBarLabel: 'Weather',
          tabBarIcon: ({ focused }) => (
            <Image
              source={weatherIcon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ focused }) => (
            <Image
              source={learnIcon}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
});


