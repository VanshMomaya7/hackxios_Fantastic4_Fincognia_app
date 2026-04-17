/**
 * Root App Navigator (Stack Navigator)
 * Conditionally shows AuthNavigator or MainTabs based on authentication state
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import type { RootStackParamList } from '../types/navigation';

import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import CreditScreen from '../screens/learn/CreditScreen';
import FraudQuizScreen from '../screens/learn/FraudQuizScreen';
import StockSimulatorScreen from '../screens/learn/StockSimulator';
import NewsScreen from '../screens/learn/NewsScreen';
import DocumentToolsScreen from '../screens/DocumentToolsScreen';
import PolicyApplicationScreen from '../screens/PolicyApplicationScreen';
import TaxAssistantScreen from '../screens/TaxAssistantScreen';
import AgentScreen from '../screens/AgentScreen';
import BudgetScreen from '../screens/BudgetScreen';
import BudgetPlannerScreen from '../screens/BudgetPlannerScreen';
import SocialSecurityScreen from '../screens/SocialSecurityScreen';
import SplitSecondVerdictScreen from '../screens/SplitSecondVerdictScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initialize().then(() => {
      setIsInitialized(true);
    });
  }, [initialize]);

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.neutral.white,
            },
            headerTintColor: colors.neutral.black,
            headerTitleStyle: {
              fontWeight: typography.weight.bold,
              fontSize: typography.size.h2,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.neutral.background,
            },
          }}>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ title: 'Add Transaction' }}
          />
          <Stack.Screen
            name="Credit"
            component={CreditScreen}
            options={{ 
              title: 'Credit Manager',
              headerStyle: { backgroundColor: '#16213e' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="FraudQuiz"
            component={FraudQuizScreen}
            options={{ 
              title: 'Fraud Detection Quiz',
              headerStyle: { backgroundColor: '#0A0F2D' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="StockSimulator"
            component={StockSimulatorScreen}
            options={{ 
              title: 'Stock Portfolio Simulator',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="News"
            component={NewsScreen}
            options={{ 
              title: 'Stock Market News',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="DocumentTools"
            component={DocumentToolsScreen}
            options={{ 
              title: 'Document Assistant',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="PolicyApplication"
            component={PolicyApplicationScreen}
            options={{ 
              title: 'Apply for Policy',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="TaxAssistant"
            component={TaxAssistantScreen}
            options={{ 
              title: 'ITR Filing Assistant',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="Agent"
            component={AgentScreen}
            options={{ 
              title: 'PaisaBuddy Agent',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="Budget"
            component={BudgetScreen}
            options={{ 
              title: 'Adaptive Budget',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="BudgetPlanner"
            component={BudgetPlannerScreen}
            options={{ 
              title: 'Budget Planner',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="SocialSecurity"
            component={SocialSecurityScreen}
            options={{ 
              title: 'Social Security / e-Shram',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen
            name="SplitSecondVerdict"
            component={SplitSecondVerdictScreen}
            options={{ 
              title: 'Split-Second Verdict',
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
});

