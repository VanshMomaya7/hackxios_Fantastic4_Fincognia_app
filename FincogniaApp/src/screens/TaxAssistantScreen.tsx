/**
 * Tax Assistant Screen
 * ITR Filing Assistant - Upload documents and generate ITR draft
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import { getUserProfile } from '../services/userService';
import { generateItrDraft, type ItrDraftResult } from '../services/taxService';
import { pickImage } from '../utils/imagePicker';
import { API_ENDPOINTS } from '../config/env';
import DocumentUploadCard from '../components/documentAnalysis/DocumentUploadCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function TaxAssistantScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [financialYear, setFinancialYear] = useState<string>('2024-25');
  const [payoutImage, setPayoutImage] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [form26asImage, setForm26asImage] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [bankStatementImage, setBankStatementImage] = useState<{ uri: string; mimeType?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [itrResult, setItrResult] = useState<ItrDraftResult | null>(null);

  const financialYears = ['2024-25', '2023-24', '2022-23'];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!user?.id) {
      setLoadingProfile(false);
      return;
    }

    try {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePickPayoutImage = async () => {
    try {
      const result = await pickImage({ source: 'both', includeBase64: true });
      if (result) {
        setPayoutImage({ uri: result.uri, mimeType: result.mimeType });
      }
    } catch (error) {
      console.error('Error picking payout image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickForm26asImage = async () => {
    try {
      const result = await pickImage({ source: 'both', includeBase64: true });
      if (result) {
        setForm26asImage({ uri: result.uri, mimeType: result.mimeType });
      }
    } catch (error) {
      console.error('Error picking Form 26AS image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickBankStatementImage = async () => {
    try {
      const result = await pickImage({ source: 'both', includeBase64: true });
      if (result) {
        setBankStatementImage({ uri: result.uri, mimeType: result.mimeType });
      }
    } catch (error) {
      console.error('Error picking bank statement image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleGenerateDraft = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!payoutImage) {
      Alert.alert('Required Document', 'Please upload at least the gig payout summary to generate ITR draft.');
      return;
    }

    try {
      setLoading(true);
      setItrResult(null);

      const result = await generateItrDraft({
        userId: user.id,
        financialYear,
        payoutImage: payoutImage ? { uri: payoutImage.uri, mimeType: payoutImage.mimeType } : undefined,
        form26asImage: form26asImage ? { uri: form26asImage.uri, mimeType: form26asImage.mimeType } : undefined,
        bankStatementImage: bankStatementImage ? { uri: bankStatementImage.uri, mimeType: bankStatementImage.mimeType } : undefined,
      });

      setItrResult(result);
    } catch (error) {
      console.error('Error generating ITR draft:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate ITR draft. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!itrResult?.pdfUrl) {
      Alert.alert('PDF Not Available', 'PDF is being generated. Please try again later.');
      return;
    }

    try {
      const url = itrResult.pdfUrl.startsWith('http') 
        ? itrResult.pdfUrl 
        : `${API_ENDPOINTS.generateItr.replace('/api/itr/generate', '')}${itrResult.pdfUrl}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open PDF URL');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  const canGenerate = payoutImage !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ITR Filing Assistant</Text>
            <Text style={styles.subtitle}>Auto-generate your tax draft</Text>
          </View>

          {/* Overview Section */}
          <Card style={styles.overviewCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.overviewText}>
              Upload 2-3 documents and we'll build an ITR draft for you as a gig worker.
            </Text>
            
            {loadingProfile ? (
              <ActivityIndicator size="small" color={colors.primary.blue} style={styles.loadingSpinner} />
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Name:</Text>
                  <Text style={styles.profileValue}>{userProfile?.fullName || user?.email || 'N/A'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Income Type:</Text>
                  <Text style={styles.profileValue}>{userProfile?.incomeType || 'gig'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Financial Year:</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={financialYear}
                      onValueChange={setFinancialYear}
                      style={styles.picker}>
                      {financialYears.map((fy) => (
                        <Picker.Item key={fy} label={fy} value={fy} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Document Upload Section */}
          <Card style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>
            
            {/* Payout Image - Required */}
            <View style={styles.uploadSlot}>
              <Text style={styles.uploadLabel}>
                Platform Payout Screenshot (Income) *
              </Text>
              <DocumentUploadCard
                label="Upload gig payout summary (Zomato/Uber/Rapido)"
                imageUri={payoutImage?.uri}
                onPress={handlePickPayoutImage}
              />
            </View>

            {/* Form 26AS - Optional */}
            <View style={styles.uploadSlot}>
              <Text style={styles.uploadLabel}>
                Form 26AS Screenshot (TDS) <Text style={styles.optional}>(optional but recommended)</Text>
              </Text>
              <DocumentUploadCard
                label="Upload Form 26AS"
                imageUri={form26asImage?.uri}
                onPress={handlePickForm26asImage}
              />
            </View>

            {/* Bank Statement - Optional */}
            <View style={styles.uploadSlot}>
              <Text style={styles.uploadLabel}>
                Bank Statement Screenshot (Expenses) <Text style={styles.optional}>(optional)</Text>
              </Text>
              <DocumentUploadCard
                label="Upload bank statement screenshot"
                imageUri={bankStatementImage?.uri}
                onPress={handlePickBankStatementImage}
              />
            </View>
          </Card>

          {/* Generate Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Generating ITR Draft...' : 'Generate ITR Draft'}
              onPress={handleGenerateDraft}
              disabled={!canGenerate || loading}
              loading={loading}
            />
          </View>

          {/* Results Section */}
          {itrResult && (
            <Card style={styles.resultsCard}>
              <Text style={styles.sectionTitle}>ITR Draft Summary</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>ITR Form:</Text>
                <Text style={styles.resultValue}>{itrResult.itrForm}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Financial Year:</Text>
                <Text style={styles.resultValue}>{itrResult.financialYear}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Gross Receipts:</Text>
                <Text style={styles.resultValue}>₹{itrResult.grossReceipts.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Presumptive Income:</Text>
                <Text style={styles.resultValue}>₹{itrResult.presumptiveIncome.toLocaleString('en-IN')}</Text>
              </View>

              {Object.keys(itrResult.expensesSummary).length > 0 && (
                <View style={styles.expensesSection}>
                  <Text style={styles.expensesTitle}>Expenses Breakdown:</Text>
                  {Object.entries(itrResult.expensesSummary).map(([key, value]) => (
                    <View key={key} style={styles.expenseRow}>
                      <Text style={styles.expenseLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                      <Text style={styles.expenseValue}>₹{value.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>TDS Credits:</Text>
                <Text style={styles.resultValue}>₹{itrResult.tdsCredits.toLocaleString('en-IN')}</Text>
              </View>

              {itrResult.taxPayable > 0 ? (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Tax Payable:</Text>
                  <Text style={[styles.resultValue, styles.taxPayable]}>₹{itrResult.taxPayable.toLocaleString('en-IN')}</Text>
                </View>
              ) : (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Refund:</Text>
                  <Text style={[styles.resultValue, styles.refund]}>₹{Math.abs(itrResult.refund).toLocaleString('en-IN')}</Text>
                </View>
              )}

              <View style={styles.explanationSection}>
                <Text style={styles.explanationTitle}>Explanation:</Text>
                <Text style={styles.explanationText}>{itrResult.explanation}</Text>
              </View>
            </Card>
          )}

          {/* Required Documents Section */}
          {itrResult && (
            <Card style={styles.documentsCard}>
              <Text style={styles.sectionTitle}>Documents Required for ITR Filing</Text>
              <View style={styles.documentsList}>
                {[
                  'PAN Card (Permanent Account Number)',
                  'Aadhaar Card (linked with PAN)',
                  'Form 26AS (Tax Credit Statement)',
                  'Bank account statements for the financial year',
                  'Platform payout summaries (Zomato/Uber/Rapido/Swiggy, etc.)',
                  'TDS certificates (Form 16, Form 16A) if any tax was deducted',
                  'Expense receipts and bills (fuel, maintenance, phone, internet)',
                  'Bank account details for tax refund (if applicable)',
                  'Investment proofs (if claiming deductions)',
                  'Insurance premium receipts (health, life insurance)',
                  'PPF/ELSS/NSC investment statements',
                  'Medical bills (if claiming medical expenses)',
                  'GST registration details (if registered)',
                  'Any other income documents',
                ].map((doc, index) => (
                  <View key={index} style={styles.documentItem}>
                    <Text style={styles.documentBullet}>•</Text>
                    <Text style={styles.documentText}>{doc}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.documentsNote}>
                Note: Keep all original documents safely. You may be required to produce them during assessment.
              </Text>

              {itrResult.pdfUrl && (
                <View style={styles.pdfButtonContainer}>
                  <Button
                    title="Download PDF"
                    onPress={handleDownloadPDF}
                    variant="secondary"
                  />
                </View>
              )}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  overviewCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  overviewText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  loadingSpinner: {
    marginVertical: spacing.md,
  },
  profileInfo: {
    gap: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  profileLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    fontWeight: typography.weight.medium,
  },
  profileValue: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    fontWeight: typography.weight.semiBold,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.small,
    backgroundColor: colors.neutral.white,
    width: 150,
  },
  picker: {
    height: 50,
  },
  uploadSection: {
    marginBottom: spacing.md,
  },
  uploadSlot: {
    marginBottom: spacing.md,
  },
  uploadLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  optional: {
    color: colors.neutral.mediumGray,
    fontWeight: typography.weight.normal,
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  resultsCard: {
    marginTop: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  resultLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    fontWeight: typography.weight.medium,
  },
  resultValue: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    fontWeight: typography.weight.bold,
  },
  taxPayable: {
    color: colors.semantic.error,
  },
  refund: {
    color: colors.semantic.success,
  },
  expensesSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  expensesTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs / 2,
  },
  expenseLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  expenseValue: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    fontWeight: typography.weight.medium,
  },
  explanationSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  explanationTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  explanationText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  pdfButtonContainer: {
    marginTop: spacing.md,
  },
  documentsCard: {
    marginTop: spacing.md,
  },
  documentsList: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    paddingVertical: spacing.xs / 2,
    alignItems: 'flex-start',
  },
  documentBullet: {
    fontSize: typography.size.body,
    color: colors.primary.blue,
    marginRight: spacing.xs,
    fontWeight: typography.weight.bold,
  },
  documentText: {
    flex: 1,
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 20,
  },
  documentsNote: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

