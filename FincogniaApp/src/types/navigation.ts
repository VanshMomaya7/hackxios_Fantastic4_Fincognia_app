/**
 * Navigation Type Definitions
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  Coach: undefined;
  Transactions: undefined;
  MoneyWeather: undefined;
  Learn: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Profile: undefined;
  AddTransaction: undefined;
  Credit: undefined;
  FraudQuiz: undefined;
  StockSimulator: undefined;
  News: undefined;
  DocumentTools: undefined;
  Onboarding: undefined;
  PlannerSetup: undefined;
  Goals: undefined;
  Settings: undefined;
  SplitSecondVerdict: undefined;
  TransactionDetail: { transactionId: string };
  GoalDetail: { goalId: string };
  Playground: undefined;
  PolicyApplication: { policy: any; policyType: 'bike' | 'health' | 'accident' | 'income' };
  TaxAssistant: undefined;
  Agent: undefined;
  Budget: undefined;
  BudgetPlanner: undefined;
  SocialSecurity: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

