/**
 * Transactions Screen
 * Transaction history with filters, search, and category editing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import { TransactionListItem } from '../components/transactions';
import { Input, Button } from '../components/ui';
import {
  getTransactionsGroupedByDate,
  updateTransactionCategory,
  searchTransactions,
  deleteTransaction,
} from '../services/transactionService';
import { ingestSmsMessages } from '../services/smsIngestionService';
import type { Transaction } from '../types';

interface GroupedTransaction {
  date: string;
  transactions: Transaction[];
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Income',
  'Healthcare',
  'Education',
  'Other',
];

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<GroupedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importingSms, setImportingSms] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let groupedData: { [date: string]: Transaction[] };

      if (searchQuery.trim()) {
        // Search mode
        const searchResults = await searchTransactions(searchQuery);
        groupedData = {};
        searchResults.forEach((tx) => {
          const date = new Date(tx.timestamp).toISOString().split('T')[0];
          if (!groupedData[date]) {
            groupedData[date] = [];
          }
          groupedData[date].push(tx);
        });
      } else {
        // Normal mode
        groupedData = await getTransactionsGroupedByDate(100);
      }

      // Calculate totals from all transactions (before filtering)
      let income = 0;
      let expenses = 0;
      Object.values(groupedData).forEach((txList) => {
        txList.forEach((tx) => {
          if (tx.type === 'credit') {
            income += Math.abs(tx.amount);
          } else {
            expenses += Math.abs(tx.amount);
          }
        });
      });
      setTotalIncome(income);
      setTotalExpenses(expenses);

      // Apply type filter
      if (filterType !== 'all') {
        Object.keys(groupedData).forEach((date) => {
          groupedData[date] = groupedData[date].filter(
            (tx) => tx.type === filterType
          );
        });
      }

      // Convert to array and sort by date (newest first)
      const groupedArray: GroupedTransaction[] = Object.keys(groupedData)
        .filter((date) => groupedData[date].length > 0)
        .sort((a, b) => b.localeCompare(a))
        .map((date) => ({
          date,
          transactions: groupedData[date],
        }));

      setTransactions(groupedArray);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Refresh when screen comes into focus (e.g., after adding transaction)
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleImportSms = async () => {
    Alert.alert(
      'Import SMS Transactions',
      'This will read your SMS messages to find bank/UPI transactions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImportingSms(true);
            try {
              const result = await ingestSmsMessages(100);
              let message = `Total SMS Read: ${result.processed > 0 ? 'Yes' : 'No'}\n`;
              message += `Bank Messages Found: ${result.processed}\n`;
              message += `Transactions Saved: ${result.saved}\n`;
              message += `Errors: ${result.errors}`;
              
              if (result.processed === 0 && result.saved === 0) {
                message += '\n\n';
                message += 'No transactions found. Possible reasons:\n';
                message += '• No SMS messages on device\n';
                message += '• SMS messages don\'t match bank/UPI patterns\n';
                message += '• Check console logs for details';
              }
              
              Alert.alert('Import Complete', message, [
                { text: 'OK', onPress: () => loadTransactions() }
              ]);
            } catch (error: any) {
              console.error('Import error:', error);
              Alert.alert(
                'Import Failed',
                error.message || 'Failed to import SMS transactions. Check console for details.'
              );
            } finally {
              setImportingSms(false);
            }
          },
        },
      ]
    );
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSelectedCategory(transaction.category || '');
    setEditModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!selectedTransaction) return;

    try {
      await updateTransactionCategory(selectedTransaction.id, selectedCategory);
      setEditModalVisible(false);
      setSelectedTransaction(null);
      loadTransactions();
      Alert.alert('Success', 'Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this transaction?\n\n${selectedTransaction.merchant || 'Transaction'}\n₹${Math.abs(selectedTransaction.amount).toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(selectedTransaction.id);
              setEditModalVisible(false);
              setSelectedTransaction(null);
              loadTransactions();
              Alert.alert('Success', 'Transaction deleted');
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', error.message || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionListItem
      transaction={item}
      onPress={() => handleTransactionPress(item)}
    />
  );

  const renderSectionHeader = ({ section }: { section: GroupedTransaction }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{formatDateHeader(section.date)}</Text>
    </View>
  );

  const renderSection = ({ item }: { item: GroupedTransaction }) => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{formatDateHeader(item.date)}</Text>
      </View>
      {item.transactions.map((tx) => (
        <TransactionListItem
          key={tx.id}
          transaction={tx}
          onPress={() => handleTransactionPress(tx)}
        />
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          onPress={handleImportSms}
          disabled={importingSms}
          style={styles.importButton}>
          {importingSms ? (
            <ActivityIndicator size="small" color={colors.primary.blue} />
          ) : (
            <Text style={styles.importButtonText}>Import SMS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, styles.incomeAmount]}>
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryAmount, styles.expenseAmount]}>
            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Input
          variant="search"
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('all')}>
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'all' && styles.filterButtonTextActive,
              ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'credit' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('credit')}>
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'credit' && styles.filterButtonTextActive,
              ]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'debit' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('debit')}>
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'debit' && styles.filterButtonTextActive,
              ]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Transactions will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderSection}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.blue}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction' as never)}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Category Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTransaction?.merchant || 'Transaction'}
            </Text>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={setSelectedCategory}
                  style={styles.picker}>
                  <Picker.Item label="Select category" value="" />
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat.toLowerCase()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleDeleteTransaction}
                style={[styles.modalButton, styles.deleteButton]}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSaveCategory}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  incomeCard: {
    backgroundColor: colors.semantic.success + '15', // 15% opacity
    borderWidth: 1,
    borderColor: colors.semantic.success + '30',
  },
  expenseCard: {
    backgroundColor: colors.semantic.negative + '15', // 15% opacity
    borderWidth: 1,
    borderColor: colors.semantic.negative + '30',
  },
  summaryLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
  },
  incomeAmount: {
    color: colors.semantic.success,
  },
  expenseAmount: {
    color: colors.semantic.negative,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  importButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  importButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  filtersContainer: {
    padding: spacing.screenPadding,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary.blue,
  },
  filterButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
  },
  filterButtonTextActive: {
    color: colors.neutral.white,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.background,
  },
  sectionHeaderText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.mediumGray,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  emptyText: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.lg,
  },
  pickerContainer: {
    marginBottom: spacing.lg,
  },
  pickerLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.semantic.negative,
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.neutral.white,
    lineHeight: 32,
  },
});
