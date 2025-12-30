/**
 * Credit Screen
 * Credit score simulator and manager
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Account {
  id: number;
  type: string;
  provider: string;
  accountNumber: string;
  creditLimit?: number;
  currentBalance: number;
  minimumDue?: number;
  originalAmount?: number;
  emiAmount?: number;
  dueDate: string;
  status: string;
  openDate: string;
  paymentStatus: string;
}

interface PaymentHistoryItem {
  date: string;
  account: string;
  amount: number;
  status: string;
  impact: string;
}

interface Inquiry {
  date: string;
  type: string;
  provider: string;
  product: string;
  impact: string;
}

interface CreditActivity {
  id: number;
  type: string;
  description: string;
  impact: number;
  date: string;
  timestamp: number;
}

interface CreditFactor {
  score: number;
  current: number;
  status: string;
}

interface UserProfile {
  name: string;
  age: number;
  location: string;
  employment: string;
  monthlyIncome: number;
  yearsEmployed: number;
}

export default function CreditScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'payments'>('dashboard');
  const [creditScore, setCreditScore] = useState(680);
  const [previousScore, setPreviousScore] = useState(680);
  const [creditHistory, setCreditHistory] = useState<CreditActivity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [userProfile] = useState<UserProfile>({
    name: 'Vansh Momaya',
    age: 28,
    location: 'Mumbai, Maharashtra',
    employment: 'Software Engineer',
    monthlyIncome: 75000,
    yearsEmployed: 3.5,
  });

  const [creditFactors, setCreditFactors] = useState<{
    paymentHistory: CreditFactor;
    creditUtilization: CreditFactor;
    creditLength: CreditFactor;
    creditMix: CreditFactor;
    newCredit: CreditFactor;
  }>({
    paymentHistory: { score: 35, current: 78, status: 'Good' },
    creditUtilization: { score: 30, current: 45, status: 'Fair' },
    creditLength: { score: 15, current: 60, status: 'Good' },
    creditMix: { score: 10, current: 85, status: 'Excellent' },
    newCredit: { score: 10, current: 70, status: 'Good' },
  });

  // Initialize mock data
  useEffect(() => {
    setAccounts([
      {
        id: 1,
        type: "Credit Card",
        provider: "HDFC Bank",
        accountNumber: "****4567",
        creditLimit: 200000,
        currentBalance: 45000,
        minimumDue: 4500,
        dueDate: "2025-01-05",
        status: "Active",
        openDate: "2021-03-15",
        paymentStatus: "Current",
      },
      {
        id: 2,
        type: "Credit Card",
        provider: "ICICI Bank",
        accountNumber: "****8901",
        creditLimit: 150000,
        currentBalance: 28000,
        minimumDue: 2800,
        dueDate: "2025-01-10",
        status: "Active",
        openDate: "2020-08-22",
        paymentStatus: "Current",
      },
      {
        id: 3,
        type: "Personal Loan",
        provider: "SBI",
        accountNumber: "****2345",
        originalAmount: 500000,
        currentBalance: 180000,
        emiAmount: 12500,
        dueDate: "2025-01-01",
        status: "Active",
        openDate: "2023-06-10",
        paymentStatus: "Current",
      },
    ])

    setPaymentHistory([
      {
        date: "2024-12-01",
        account: "HDFC Credit Card",
        amount: 5000,
        status: "On Time",
        impact: "+2",
      },
      {
        date: "2024-11-28",
        account: "SBI Personal Loan",
        amount: 12500,
        status: "On Time",
        impact: "+2",
      },
      {
        date: "2024-11-25",
        account: "ICICI Credit Card",
        amount: 3500,
        status: "On Time",
        impact: "+2",
      },
      {
        date: "2024-11-01",
        account: "HDFC Credit Card",
        amount: 4800,
        status: "2 Days Late",
        impact: "-8",
      },
      {
        date: "2024-10-28",
        account: "SBI Personal Loan",
        amount: 12500,
        status: "On Time",
        impact: "+2",
      },
    ])

    setInquiries([
      {
        date: "2024-11-15",
        type: "Hard Inquiry",
        provider: "Axis Bank",
        product: "Home Loan",
        impact: "-3",
      },
      {
        date: "2024-09-22",
        type: "Soft Inquiry",
        provider: "Bajaj Finserv",
        product: "Personal Loan",
        impact: "0",
      },
      {
        date: "2024-07-10",
        type: "Hard Inquiry",
        provider: "HDFC Bank",
        product: "Credit Card",
        impact: "-5",
      },
    ])
  }, [])

  // Utility Functions
  const getCreditScoreColor = (score: number): string => {
    if (score >= 750) return '#10b981';
    if (score >= 650) return '#06b6d4';
    if (score >= 550) return '#f97316';
    return '#ef4444';
  };

  const getCreditScoreLabel = (score: number): string => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  };

  const getCreditScoreBg = (score: number): [string, string] => {
    if (score >= 750) return ['#059669', '#047857'];
    if (score >= 650) return ['#0891b2', '#0e7490'];
    if (score >= 550) return ['#ea580c', '#c2410c'];
    return ['#dc2626', '#b91c1c'];
  };

  const getTotalCreditUtilization = (): number => {
    const creditCards = accounts.filter((acc) => acc.type === 'Credit Card');
    const totalLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
    const totalBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
    return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  };

  const addCreditActivity = (type: string, description: string, impact: number): void => {
    const activity: CreditActivity = {
      id: Date.now(),
      type,
      description,
      impact,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    };
    setCreditHistory((prev) => [activity, ...prev].slice(0, 10));
  };

  const makePayment = (accountId: number, amount: number, onTime: boolean = true): void => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const payment: PaymentHistoryItem = {
      date: new Date().toLocaleDateString(),
      account: `${account.provider} ${account.type}`,
      amount,
      status: onTime ? 'On Time' : '15 Days Late',
      impact: onTime ? '+5' : '-15',
    };

    setPaymentHistory((prev) => [payment, ...prev].slice(0, 15));

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, currentBalance: Math.max(0, acc.currentBalance - amount) } : acc,
      ),
    );

    const scoreChange = onTime ? 5 : -15;
    setPreviousScore(creditScore);
    setCreditScore((prev) => Math.max(300, Math.min(850, prev + scoreChange)));

    addCreditActivity(
      onTime ? 'On-time Payment' : 'Late Payment',
      `${onTime ? 'Paid' : 'Late payment for'} ${account.provider} ${account.type} - ₹${amount.toLocaleString()}`,
      scoreChange,
    );

    setCreditFactors((prev) => ({
      ...prev,
      paymentHistory: {
        ...prev.paymentHistory,
        current: onTime ? Math.min(100, prev.paymentHistory.current + 2) : Math.max(0, prev.paymentHistory.current - 5),
      },
    }));
  };

  const improveUtilization = (): void => {
    const creditCards = accounts.filter((acc) => acc.type === 'Credit Card');
    if (creditCards.length === 0) return;

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.type === 'Credit Card' ? { ...acc, currentBalance: Math.max(0, acc.currentBalance * 0.7) } : acc,
      ),
    );

    setPreviousScore(creditScore);
    setCreditScore((prev) => Math.min(850, prev + 15));

    addCreditActivity('Improved Credit Utilization', 'Paid down credit card balances, reducing utilization ratio', 15);

    setCreditFactors((prev) => ({
      ...prev,
      creditUtilization: {
        ...prev.creditUtilization,
        current: Math.min(100, prev.creditUtilization.current + 10),
      },
    }));
  };

  const Dashboard = (): React.JSX.Element => (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Credit Score Overview */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: getCreditScoreBg(creditScore)[0],
            borderRadius: 16,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.scoreHeader}>
          <View style={styles.scoreContent}>
            <Text style={styles.scoreTitle}>Credit Score</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreValue}>{creditScore}</Text>
              <View style={styles.scoreLabel}>
                <Text style={styles.scoreLabelText}>{getCreditScoreLabel(creditScore)}</Text>
                {creditScore !== previousScore && (
                  <Text style={styles.scoreChange}>
                    {creditScore > previousScore ? "+" : ""}
                    {creditScore - previousScore} from last
                  </Text>
                )}
              </View>
            </View>
          </View>
          <Text style={styles.scoreIcon}>🏆</Text>
        </View>

        {/* Score Range Indicator */}
        <View style={styles.scoreRangeContainer}>
          <View style={styles.scoreRangeLabels}>
            <Text style={styles.rangeLabel}>300</Text>
            <Text style={styles.rangeLabel}>550</Text>
            <Text style={styles.rangeLabel}>750</Text>
            <Text style={styles.rangeLabel}>850</Text>
          </View>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarSegment, { backgroundColor: "#ef4444" }]} />
            <View style={[styles.scoreBarSegment, { backgroundColor: "#f97316" }]} />
            <View style={[styles.scoreBarSegment, { backgroundColor: "#06b6d4" }]} />
            <View style={[styles.scoreBarSegment, { backgroundColor: "#10b981" }]} />
          </View>
          <View style={[styles.scoreIndicator, { left: `${((creditScore - 300) / 550) * 100}%` }]} />
        </View>
      </View>

      {/* Credit Score Factors */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Credit Score Breakdown</Text>
        <Text style={styles.cardSubtitle}>Factors affecting your credit score</Text>

        <View style={styles.factorsContainer}>
          {Object.entries(creditFactors).map(([key, factor]) => (
            <View key={key} style={styles.factorItem}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        factor.status === "Excellent"
                          ? "#10b98122"
                          : factor.status === "Good"
                            ? "#06b6d422"
                            : factor.status === "Fair"
                              ? "#f9731622"
                              : "#ef444422",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          factor.status === "Excellent"
                            ? "#10b981"
                            : factor.status === "Good"
                              ? "#06b6d4"
                              : factor.status === "Fair"
                                ? "#f97316"
                                : "#ef4444",
                      },
                    ]}
                  >
                    {factor.status}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${factor.current}%`,
                      backgroundColor:
                        factor.current >= 80
                          ? "#10b981"
                          : factor.current >= 60
                            ? "#06b6d4"
                            : factor.current >= 40
                              ? "#f97316"
                              : "#ef4444",
                    },
                  ]}
                />
              </View>
              <Text style={styles.factorScore}>{factor.score}% of score</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score Improvement Actions</Text>
        <Text style={styles.cardSubtitle}>Simulate different scenarios to see their impact</Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#10b981" }]}
            onPress={() => makePayment(1, 5000, true)}
          >
            <Text style={styles.actionTitle}>On-time Payment</Text>
            <Text style={styles.actionHint}>Pay credit card bill (+5 points)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#06b6d4" }]} onPress={improveUtilization}>
            <Text style={styles.actionTitle}>Reduce Utilization</Text>
            <Text style={styles.actionHint}>Pay down balances (+15 points)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
            onPress={() => makePayment(2, 3000, false)}
          >
            <Text style={styles.actionTitle}>Late Payment</Text>
            <Text style={styles.actionHint}>Pay bill 15 days late (-15 points)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Credit Activities</Text>

        {creditHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🕐</Text>
            <Text style={styles.emptyText}>No recent activities</Text>
            <Text style={styles.emptyHint}>Use the actions above to see how different behaviors affect your score</Text>
          </View>
        ) : (
          <FlatList
            data={creditHistory}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <Text style={styles.activityType}>{item.type}</Text>
                  <Text style={styles.activityDescription}>{item.description}</Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
                <Text
                  style={[
                    styles.activityImpact,
                    {
                      color: item.impact >= 0 ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {item.impact >= 0 ? "+" : ""}
                  {item.impact}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  )

  const Accounts = (): React.JSX.Element => (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Account Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Credit Limit</Text>
            <Text style={styles.summaryValue}>
              ₹
              {accounts
                .filter((acc) => acc.type === 'Credit Card')
                .reduce((sum, acc) => sum + (acc.creditLimit || 0), 0)
                .toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryValue}>
              ₹{accounts.reduce((sum, acc) => sum + acc.currentBalance, 0).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Available</Text>
            <Text style={styles.summaryValue}>
              ₹
              {(
                accounts.filter((acc) => acc.type === 'Credit Card').reduce((sum, acc) => sum + (acc.creditLimit || 0), 0) -
                accounts.filter((acc) => acc.type === 'Credit Card').reduce((sum, acc) => sum + acc.currentBalance, 0)
              ).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Accounts List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Accounts</Text>

        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View>
                  <Text style={styles.accountType}>{item.type}</Text>
                  <Text style={styles.accountProvider}>{item.provider}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: "#10b98122" }]}>
                  <Text style={[styles.statusText, { color: "#10b981" }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.accountDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailValue}>{item.accountNumber}</Text>
                </View>

                {item.type === "Credit Card" ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Credit Limit</Text>
                      <Text style={styles.detailValue}>₹{(item.creditLimit || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Balance</Text>
                      <Text style={styles.detailValue}>₹{item.currentBalance.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Minimum Due</Text>
                      <Text style={styles.detailValue}>₹{(item.minimumDue || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Balance</Text>
                      <Text style={styles.detailValue}>₹{item.currentBalance.toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>EMI Amount</Text>
                      <Text style={styles.detailValue}>₹{(item.emiAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  </>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{item.dueDate}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  )

  const PaymentHistoryView = (): React.JSX.Element => (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment History</Text>

        <FlatList
          data={paymentHistory}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.paymentItem}>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentAccount}>{item.account}</Text>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentDate}>{item.date}</Text>
                  <Text style={styles.paymentStatus}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.paymentAmount}>
                <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
                <Text
                  style={[
                    styles.impactText,
                    {
                      color: item.impact.includes("+") ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {item.impact}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Credit Manager</Text>
          <Text style={styles.headerSubtitle}>{userProfile.name}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Text style={[styles.tabText, activeTab === "dashboard" && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "accounts" && styles.activeTab]}
          onPress={() => setActiveTab("accounts")}
        >
          <Text style={[styles.tabText, activeTab === "accounts" && styles.activeTabText]}>Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "payments" && styles.activeTab]}
          onPress={() => setActiveTab("payments")}
        >
          <Text style={[styles.tabText, activeTab === "payments" && styles.activeTabText]}>Payments</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'accounts' && <Accounts />}
      {activeTab === 'payments' && <PaymentHistoryView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: "#16213e",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a0a0a0",
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#16213e",
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#06b6d4",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#7a7a7a",
  },
  activeTabText: {
    color: "#06b6d4",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  scoreContent: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
    marginRight: 12,
  },
  scoreLabel: {
    paddingTop: 4,
  },
  scoreLabelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  scoreChange: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  scoreIcon: {
    fontSize: 40,
    opacity: 0.6,
  },
  scoreRangeContainer: {
    paddingTop: 12,
  },
  scoreRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  scoreBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  scoreBarSegment: {
    flex: 1,
  },
  scoreIndicator: {
    position: "absolute",
    width: 3,
    height: 10,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 2,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    alignItems: "center",
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#7a7a7a",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  metricHint: {
    fontSize: 10,
    color: "#7a7a7a",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#7a7a7a",
    marginBottom: 12,
  },
  factorsContainer: {
    gap: 12,
  },
  factorItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  factorName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  factorScore: {
    fontSize: 11,
    color: "#7a7a7a",
  },
  actionsContainer: {
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 3,
  },
  actionHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: "#7a7a7a",
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  activityContent: {
    flex: 1,
    marginRight: 12,
  },
  activityType: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: "#a0a0a0",
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 11,
    color: "#5a5a5a",
  },
  activityImpact: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#7a7a7a",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  accountCard: {
    backgroundColor: "#0f3460",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#0a1f35",
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  accountType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  accountProvider: {
    fontSize: 12,
    color: "#7a7a7a",
    marginTop: 2,
  },
  accountDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  paymentContent: {
    flex: 1,
    marginRight: 12,
  },
  paymentAccount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 4,
  },
  paymentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentDate: {
    fontSize: 11,
    color: "#7a7a7a",
  },
  paymentStatus: {
    fontSize: 11,
    color: "#06b6d4",
    fontWeight: "500",
  },
  paymentAmount: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  impactText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
