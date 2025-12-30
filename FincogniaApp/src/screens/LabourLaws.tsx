import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  SafeAreaView,
} from 'react-native';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface DailyHours {
  date: string;
  dayLabel: string;
  hoursWorked: number;
}

interface WeeklyLegalMetrics {
  userId: string;
  weekLabel: string;
  state: string;
  sector: string;
  totalHours: number;
  legalMaxWeeklyHours: number;
  overtimeHours: number;
  effectiveHourlyWage: number;
  legalMinHourlyWage: number;
  wageDelta: number;
  totalEarnings: number;
  expectedOvertimePay: number;
  actualOvertimePay: number;
  overtimePayGap: number;
  legalFairnessScore: number;
  dailyHours: DailyHours[];
  flags: {
    underMinimumWage: boolean;
    excessiveOvertime: boolean;
    unpaidOvertime: boolean;
  };
}

// ============================================================================
// COLORS & DESIGN TOKENS (from design.json)
// ============================================================================

const COLORS = {
  primary: '#0066FF',
  cyan: '#00D4FF',
  brightGreen: '#00FF9D',
  purple: '#A855F7',
  pink: '#EC4899',
  white: '#FFFFFF',
  background: '#F8F9FB',
  lightGray: '#F3F4F6',
  mediumGray: '#9CA3AF',
  darkGray: '#6B7280',
  black: '#1F2937',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// ============================================================================
// MOCK DATA
// ============================================================================

const mockWeeklyData: WeeklyLegalMetrics = {
  userId: 'GW_IND_2025_001',
  weekLabel: 'Week of 10–16 Mar 2025',
  state: 'Maharashtra',
  sector: 'delivery',
  totalHours: 52,
  legalMaxWeeklyHours: 48,
  overtimeHours: 4,
  effectiveHourlyWage: 145.5,
  legalMinHourlyWage: 150,
  wageDelta: -4.5,
  totalEarnings: 7566,
  expectedOvertimePay: 1200,
  actualOvertimePay: 580,
  overtimePayGap: 620,
  legalFairnessScore: 58,
  dailyHours: [
    { date: '2025-03-10', dayLabel: 'Mon', hoursWorked: 8 },
    { date: '2025-03-11', dayLabel: 'Tue', hoursWorked: 9 },
    { date: '2025-03-12', dayLabel: 'Wed', hoursWorked: 8 },
    { date: '2025-03-13', dayLabel: 'Thu', hoursWorked: 9 },
    { date: '2025-03-14', dayLabel: 'Fri', hoursWorked: 8.5 },
    { date: '2025-03-15', dayLabel: 'Sat', hoursWorked: 9.5 },
    { date: '2025-03-16', dayLabel: 'Sun', hoursWorked: 0 },
  ],
  flags: {
    underMinimumWage: true,
    excessiveOvertime: true,
    unpaidOvertime: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Protected';
  if (score >= 60) return 'At Risk';
  return 'Exploited';
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatHours = (hours: number): string => {
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  return `${fullHours}h ${minutes}m`;
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Header Component
const Header: React.FC = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Loop 2</Text>
    <Text style={styles.headerSubtitle}>Overtime Protection</Text>
  </View>
);

// Legal Fairness Score Card
interface FairnessScoreCardProps {
  score: number;
  flags: WeeklyLegalMetrics['flags'];
}

const FairnessScoreCard: React.FC<FairnessScoreCardProps> = ({
  score,
  flags,
}) => {
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const hasViolations = flags.underMinimumWage || flags.excessiveOvertime || flags.unpaidOvertime;

  return (
    <View style={styles.card}>
      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.scoreCircle,
            { borderColor: scoreColor, backgroundColor: `${scoreColor}15` },
          ]}
        >
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {Math.round(score)}
          </Text>
          <Text style={[styles.scorePercent, { color: scoreColor }]}>%</Text>
        </View>
        <View style={styles.scoreText}>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
          <Text style={styles.scoreStatus}>
            {hasViolations ? 'Violations detected' : 'No violations'}
          </Text>
        </View>
      </View>

      {/* Violation Flags */}
      <View style={styles.flagsContainer}>
        {flags.underMinimumWage && (
          <View style={styles.flag}>
            <View style={[styles.flagIcon, { backgroundColor: COLORS.error }]}>
              <Text style={styles.flagIconText}>⚠</Text>
            </View>
            <Text style={styles.flagText}>Below minimum wage</Text>
          </View>
        )}
        {flags.excessiveOvertime && (
          <View style={styles.flag}>
            <View style={[styles.flagIcon, { backgroundColor: COLORS.warning }]}>
              <Text style={styles.flagIconText}>⚡</Text>
            </View>
            <Text style={styles.flagText}>Excessive overtime</Text>
          </View>
        )}
        {flags.unpaidOvertime && (
          <View style={styles.flag}>
            <View style={[styles.flagIcon, { backgroundColor: COLORS.pink }]}>
              <Text style={styles.flagIconText}>💰</Text>
            </View>
            <Text style={styles.flagText}>Unpaid overtime gap</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Weekly Hours Overview
interface WeeklyOverviewProps {
  totalHours: number;
  legalMax: number;
  overtimeHours: number;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  totalHours,
  legalMax,
  overtimeHours,
}) => {
  const percentage = Math.min((totalHours / legalMax) * 100, 100);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Weekly Hours</Text>

      <View style={styles.overviewRow}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Total Worked</Text>
          <Text style={styles.overviewValue}>{formatHours(totalHours)}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Legal Maximum</Text>
          <Text style={styles.overviewValue}>{formatHours(legalMax)}</Text>
        </View>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Overtime</Text>
          <Text style={[styles.overviewValue, { color: COLORS.error }]}>
            {formatHours(overtimeHours)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor:
                  percentage > 100 ? COLORS.error : COLORS.success,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(percentage)}% of legal limit</Text>
      </View>
    </View>
  );
};

// Daily Hours Breakdown
interface DailyHoursBreakdownProps {
  dailyHours: DailyHours[];
}

const DailyHoursBreakdown: React.FC<DailyHoursBreakdownProps> = ({
  dailyHours,
}) => {
  const renderDayItem = ({ item }: { item: DailyHours }) => {
    const isOvertime = item.hoursWorked > 8;
    const isRest = item.hoursWorked === 0;

    return (
      <View style={styles.dayItem}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayLabel}>{item.dayLabel}</Text>
          <Text style={styles.dayDate}>{item.date.slice(5)}</Text>
        </View>

        <View style={styles.dayBar}>
          <View
            style={[
              styles.dayBarFill,
              {
                width: `${Math.min((item.hoursWorked / 8) * 100, 100)}%`,
                backgroundColor: isRest
                  ? COLORS.lightGray
                  : isOvertime
                    ? COLORS.error
                    : COLORS.brightGreen,
              },
            ]}
          />
        </View>

        <Text
          style={[
            styles.dayHours,
            {
              color: isRest ? COLORS.mediumGray : isOvertime ? COLORS.error : COLORS.black,
            },
          ]}
        >
          {isRest ? 'Rest day' : formatHours(item.hoursWorked)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Daily Breakdown</Text>
      <FlatList
        data={dailyHours}
        renderItem={renderDayItem}
        keyExtractor={(item) => item.date}
        scrollEnabled={false}
      />
    </View>
  );
};

// Wage Analysis Card
interface WageAnalysisProps {
  totalEarnings: number;
  effectiveHourlyWage: number;
  legalMinHourlyWage: number;
  wageDelta: number;
  expectedOvertimePay: number;
  actualOvertimePay: number;
  overtimePayGap: number;
}

const WageAnalysis: React.FC<WageAnalysisProps> = ({
  totalEarnings,
  effectiveHourlyWage,
  legalMinHourlyWage,
  wageDelta,
  expectedOvertimePay,
  actualOvertimePay,
  overtimePayGap,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Wage Analysis</Text>

      {/* Total Earnings */}
      <View style={styles.wageRow}>
        <Text style={styles.wageLabel}>Total Earnings</Text>
        <Text style={styles.wageValueLarge}>{formatCurrency(totalEarnings)}</Text>
      </View>

      {/* Hourly Rates */}
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Effective Hourly Rate</Text>
          <Text
            style={[
              styles.metricValue,
              { color: effectiveHourlyWage < legalMinHourlyWage ? COLORS.error : COLORS.success },
            ]}
          >
            {formatCurrency(effectiveHourlyWage)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Legal Minimum Rate</Text>
          <Text style={[styles.metricValue, { color: COLORS.primary }]}>
            {formatCurrency(legalMinHourlyWage)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Wage Difference</Text>
          <Text
            style={[
              styles.metricValue,
              { color: wageDelta >= 0 ? COLORS.success : COLORS.error },
            ]}
          >
            {wageDelta >= 0 ? '+' : ''}{formatCurrency(wageDelta)}
          </Text>
        </View>
      </View>

      {/* Overtime Pay Section */}
      <View style={[styles.section, { marginTop: SPACING.lg }]}>
        <Text style={styles.sectionTitle}>Overtime Compensation</Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Expected 2x Pay</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              {formatCurrency(expectedOvertimePay)}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Actual Payment</Text>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>
              {formatCurrency(actualOvertimePay)}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Unpaid Gap</Text>
            <Text
              style={[
                styles.metricValue,
                { color: overtimePayGap > 0 ? COLORS.error : COLORS.success },
              ]}
            >
              {formatCurrency(overtimePayGap)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Worker Context Card
interface WorkerContextProps {
  userId: string;
  weekLabel: string;
  state: string;
  sector: string;
}

const WorkerContext: React.FC<WorkerContextProps> = ({
  userId,
  weekLabel,
  state,
  sector,
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Worker Context</Text>
    <View style={styles.contextRow}>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>Worker ID</Text>
        <Text style={styles.contextValue}>{userId}</Text>
      </View>
    </View>
    <View style={styles.contextRow}>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>Period</Text>
        <Text style={styles.contextValue}>{weekLabel}</Text>
      </View>
    </View>
    <View style={styles.contextRow}>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>State</Text>
        <Text style={styles.contextValue}>{state}</Text>
      </View>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>Sector</Text>
        <Text style={styles.contextValue}>{sector}</Text>
      </View>
    </View>
  </View>
);

// Action Button
interface ActionButtonProps {
  title: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.actionButton,
      pressed && styles.actionButtonPressed,
    ]}
    onPress={onPress}
  >
    <Text style={styles.actionButtonText}>{title}</Text>
  </Pressable>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================

const OvertimeProtectionScreen: React.FC = () => {
  const data = mockWeeklyData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.content}>
          <FairnessScoreCard
            score={data.legalFairnessScore}
            flags={data.flags}
          />

          <WeeklyOverview
            totalHours={data.totalHours}
            legalMax={data.legalMaxWeeklyHours}
            overtimeHours={data.overtimeHours}
          />

          <DailyHoursBreakdown dailyHours={data.dailyHours} />

          <WageAnalysis
            totalEarnings={data.totalEarnings}
            effectiveHourlyWage={data.effectiveHourlyWage}
            legalMinHourlyWage={data.legalMinHourlyWage}
            wageDelta={data.wageDelta}
            expectedOvertimePay={data.expectedOvertimePay}
            actualOvertimePay={data.actualOvertimePay}
            overtimePayGap={data.overtimePayGap}
          />

          <WorkerContext
            userId={data.userId}
            weekLabel={data.weekLabel}
            state={data.state}
            sector={data.sector}
          />

          <View style={styles.actionContainer}>
            <ActionButton
              title="View Legal Documentation"
              onPress={() => console.log('Legal docs')}
            />
            <ActionButton
              title="File a Complaint"
              onPress={() => console.log('File complaint')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.mediumGray,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },

  // Score Card
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: '700',
  },
  scorePercent: {
    fontSize: 13,
    fontWeight: '500',
  },
  scoreText: {
    flex: 1,
    gap: SPACING.xs,
  },
  scoreLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.black,
  },
  scoreStatus: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.mediumGray,
  },
  flagsContainer: {
    gap: SPACING.md,
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  flagIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagIconText: {
    fontSize: 16,
  },
  flagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.darkGray,
    flex: 1,
  },

  // Weekly Overview
  overviewRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  overviewItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
  },
  overviewValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
  },
  progressContainer: {
    gap: SPACING.sm,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },

  // Daily Hours
  dayItem: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: SPACING.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  dayDate: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.mediumGray,
  },
  dayBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dayBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dayHours: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Wage Analysis
  wageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: SPACING.lg,
  },
  wageLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  wageValueLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },
  metricsContainer: {
    gap: SPACING.md,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.darkGray,
    flex: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },

  // Worker Context
  contextRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  contextItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
  },
  contextValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },

  // Action Container
  actionContainer: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default OvertimeProtectionScreen;