/**
 * Document Tools Screen
 * Allows users to understand documents or get policy advice
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../constants/designTokens';
import { DocumentUploadCard, AnalysisResultCard, PolicyRecommendationCard, PolicyComparisonCharts } from '../components/documentAnalysis';
import { pickImage } from '../utils/imagePicker';
import { analyzeDocument, getPolicyAdvice } from '../services/documentAnalysisService';
import type { DocumentAnalysisResult, PolicyAdvisorResult } from '../services/documentAnalysisService';
import Button from '../components/ui/Button';

type Mode = 'understand' | 'advisor';

export default function DocumentToolsScreen() {
  const [mode, setMode] = useState<Mode>('understand');
  
  // Understand mode state
  const [understandImage, setUnderstandImage] = useState<{ uri: string; base64?: string; mimeType?: string } | null>(null);
  const [understandResult, setUnderstandResult] = useState<DocumentAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Policy Advisor mode state
  const [hasExistingPolicy, setHasExistingPolicy] = useState(false);
  const [advisorImage, setAdvisorImage] = useState<{ uri: string; base64?: string; mimeType?: string } | null>(null);
  const [policyType, setPolicyType] = useState<'bike' | 'health' | 'accident' | 'income' | ''>('');
  const [budget, setBudget] = useState<'low' | 'medium' | 'high' | ''>('');
  const [priority, setPriority] = useState<'accident' | 'hospital' | 'family' | 'income' | ''>('');
  const [advisorResult, setAdvisorResult] = useState<PolicyAdvisorResult | null>(null);
  const [gettingAdvice, setGettingAdvice] = useState(false);

  const handlePickImageForUnderstand = async () => {
    try {
      const result = await pickImage({ source: 'both', includeBase64: true });
      if (result) {
        setUnderstandImage(result);
        setUnderstandResult(null); // Clear previous result
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickImageForAdvisor = async () => {
    try {
      const result = await pickImage({ source: 'both', includeBase64: true });
      if (result) {
        setAdvisorImage(result);
        setAdvisorResult(null); // Clear previous result
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!understandImage) {
      Alert.alert('No Image', 'Please upload a document first.');
      return;
    }

    try {
      setAnalyzing(true);
      setUnderstandResult(null); // Clear previous result
      
      console.log('[Document Tools] Starting document analysis...');
      const result = await analyzeDocument(
        understandImage.uri,
        understandImage.base64,
        understandImage.mimeType
      );
      
      console.log('[Document Tools] Analysis complete:', JSON.stringify(result, null, 2));
      
      // Validate result before setting
      if (!result) {
        throw new Error('No result received from analysis service');
      }
      
      if (!result.summary || result.summary.trim() === '') {
        console.warn('[Document Tools] Result missing summary field');
        throw new Error('Analysis returned empty summary. Please try again with a clearer image.');
      }
      
      // Set the result - this triggers UI update
      setUnderstandResult(result);
      console.log('[Document Tools] ✅ Result state set successfully');
      console.log('[Document Tools] Result docType:', result.docType);
      console.log('[Document Tools] Result summary length:', result.summary.length);
    } catch (error) {
      console.error('[Document Tools] Error analyzing document:', error);
      setUnderstandResult(null); // Clear result on error
      Alert.alert('Analysis Failed', error instanceof Error ? error.message : 'Failed to analyze document. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGetAdvice = async () => {
    if (hasExistingPolicy) {
      // Existing policy mode
      if (!advisorImage) {
        Alert.alert('Image Required', 'Please upload your policy document first.');
        return;
      }
    } else {
      // New policy mode
      if (!policyType || !budget || !priority) {
        Alert.alert('Missing Information', 'Please fill in all fields: Policy Type, Budget, and Priority.');
        return;
      }
    }

    try {
      setGettingAdvice(true);
      setAdvisorResult(null);
      
      const result = await getPolicyAdvice({
        ...(hasExistingPolicy && advisorImage
          ? {
              imageUri: advisorImage.uri,
              base64Data: advisorImage.base64,
              mimeType: advisorImage.mimeType,
            }
          : {
              policyType: policyType as 'bike' | 'health' | 'accident' | 'income',
              budget: budget as 'low' | 'medium' | 'high',
              priority: priority as 'accident' | 'hospital' | 'family' | 'income',
            }),
      });
      
      setAdvisorResult(result);
    } catch (error) {
      console.error('Error getting policy advice:', error);
      Alert.alert('Advice Failed', error instanceof Error ? error.message : 'Failed to get policy advice. Please try again.');
    } finally {
      setGettingAdvice(false);
    }
  };

  const handleReset = () => {
    if (mode === 'understand') {
      setUnderstandImage(null);
      setUnderstandResult(null);
    } else {
      setAdvisorImage(null);
      setAdvisorResult(null);
      setPolicyType('');
      setBudget('');
      setPriority('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'understand' && styles.modeButtonActive]}
          onPress={() => {
            setMode('understand');
          }}
          activeOpacity={0.7}>
          <Text style={[styles.modeButtonText, mode === 'understand' && styles.modeButtonTextActive]}>
            Understand Document
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'advisor' && styles.modeButtonActive]}
          onPress={() => {
            setMode('advisor');
            setUnderstandResult(null);
          }}
          activeOpacity={0.7}>
          <Text style={[styles.modeButtonText, mode === 'advisor' && styles.modeButtonTextActive]}>
            Policy Advisor
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {mode === 'understand' ? (
          <>
            {/* Upload Card */}
            <DocumentUploadCard
              label="Upload Document"
              imageUri={understandImage?.uri}
              onPress={handlePickImageForUnderstand}
              loading={analyzing}
            />

            {/* Analyze Button */}
            {understandImage && !understandResult && (
              <View style={styles.buttonContainer}>
                <Button
                  title={analyzing ? 'Analyzing...' : 'Analyze Document'}
                  onPress={handleAnalyze}
                  disabled={analyzing}
                  loading={analyzing}
                />
              </View>
            )}

            {/* Result */}
            {understandResult && (
              <View style={styles.resultContainer}>
                <AnalysisResultCard result={understandResult} />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Analyze Another Document"
                    onPress={handleReset}
                    variant="secondary"
                  />
                </View>
              </View>
            )}

            {/* Loading State - only show if no result yet */}
            {analyzing && !understandResult && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.blue} />
                <Text style={styles.loadingText}>Analyzing your document...</Text>
                <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Toggle: I already have a policy */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>I already have a policy</Text>
              <Switch
                value={hasExistingPolicy}
                onValueChange={(value) => {
                  setHasExistingPolicy(value);
                  setAdvisorImage(null);
                  setAdvisorResult(null);
                  setPolicyType('');
                  setBudget('');
                  setPriority('');
                }}
                trackColor={{ false: colors.neutral.mediumGray, true: colors.primary.blue }}
                thumbColor={colors.neutral.white}
              />
            </View>

            {hasExistingPolicy ? (
              <>
                {/* Upload Card for existing policy */}
                <DocumentUploadCard
                  label="Upload Your Policy"
                  imageUri={advisorImage?.uri}
                  onPress={handlePickImageForAdvisor}
                  loading={gettingAdvice}
                />

                {/* Get Advice Button */}
                {advisorImage && !advisorResult && (
                  <View style={styles.buttonContainer}>
                    <Button
                      title={gettingAdvice ? 'Analyzing...' : 'Get Recommendations'}
                      onPress={handleGetAdvice}
                      disabled={gettingAdvice}
                      loading={gettingAdvice}
                    />
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Form for new policy */}
                <View style={styles.formContainer}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Policy Type</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={policyType}
                        onValueChange={(value) => setPolicyType(value)}
                        style={styles.picker}>
                        <Picker.Item label="Select policy type" value="" />
                        <Picker.Item label="Bike Insurance" value="bike" />
                        <Picker.Item label="Health Insurance" value="health" />
                        <Picker.Item label="Accident Insurance" value="accident" />
                        <Picker.Item label="Income Protection" value="income" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Budget</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={budget}
                        onValueChange={(value) => setBudget(value)}
                        style={styles.picker}>
                        <Picker.Item label="Select budget" value="" />
                        <Picker.Item label="Low (₹500-₹2,000/year)" value="low" />
                        <Picker.Item label="Medium (₹2,000-₹5,000/year)" value="medium" />
                        <Picker.Item label="High (₹5,000+/year)" value="high" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Priority</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={priority}
                        onValueChange={(value) => setPriority(value)}
                        style={styles.picker}>
                        <Picker.Item label="Select priority" value="" />
                        <Picker.Item label="Accident Coverage" value="accident" />
                        <Picker.Item label="Hospital Expenses" value="hospital" />
                        <Picker.Item label="Family Protection" value="family" />
                        <Picker.Item label="Income Security" value="income" />
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Find Policies Button */}
                {policyType && budget && priority && !advisorResult && (
                  <View style={styles.buttonContainer}>
                    <Button
                      title={gettingAdvice ? 'Finding Policies...' : 'Find Policies'}
                      onPress={handleGetAdvice}
                      disabled={gettingAdvice}
                      loading={gettingAdvice}
                    />
                  </View>
                )}
              </>
            )}

            {/* Current Policy Summary (if applicable) */}
            {advisorResult?.detectedPolicy && (
              <View style={styles.resultContainer}>
                <View style={styles.currentPolicyCard}>
                  <Text style={styles.currentPolicyTitle}>Your Current Policy</Text>
                  <Text style={styles.currentPolicyName}>{advisorResult.detectedPolicy.name || 'Unknown Policy'}</Text>
                  {advisorResult.detectedPolicy.premium && (
                    <Text style={styles.currentPolicyPremium}>Premium: {advisorResult.detectedPolicy.premium}</Text>
                  )}
                  <Text style={styles.currentPolicySummary}>{advisorResult.detectedPolicy.summary}</Text>
                </View>
              </View>
            )}

            {/* Recommendations */}
            {advisorResult && advisorResult.recommendations && advisorResult.recommendations.length > 0 && (
              <View style={styles.resultContainer}>
                <Text style={styles.recommendationsTitle}>Recommended Policies</Text>
                {advisorResult.recommendations.map((rec, index) => {
                  // Determine policy type from recommendation or form input
                  let recPolicyType: 'bike' | 'health' | 'accident' | 'income' = 'health';
                  
                  if (hasExistingPolicy) {
                    // If existing policy mode, try to detect from detectedPolicy docType
                    if (advisorResult.detectedPolicy) {
                      const docType = advisorResult.detectedPolicy.name?.toLowerCase() || '';
                      if (docType.includes('bike') || docType.includes('motor')) {
                        recPolicyType = 'bike';
                      } else if (docType.includes('health') || docType.includes('medical')) {
                        recPolicyType = 'health';
                      } else if (docType.includes('accident')) {
                        recPolicyType = 'accident';
                      } else if (docType.includes('income') || docType.includes('disability')) {
                        recPolicyType = 'income';
                      }
                    }
                  } else {
                    // New policy mode - use the selected policy type
                    recPolicyType = policyType as 'bike' | 'health' | 'accident' | 'income';
                  }
                  
                  return (
                    <PolicyRecommendationCard
                      key={rec.id || index}
                      recommendation={rec}
                      isBestForYou={rec.id === advisorResult.verdict.bestPolicyId}
                      policyType={recPolicyType}
                    />
                  );
                })}
                <View style={styles.verdictCard}>
                  <Text style={styles.verdictTitle}>Our Recommendation</Text>
                  <Text style={styles.verdictReason}>{advisorResult.verdict.reason}</Text>
                </View>

                {/* Comparison Charts */}
                <PolicyComparisonCharts recommendations={advisorResult.recommendations} />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Get New Recommendations"
                    onPress={handleReset}
                    variant="secondary"
                  />
                </View>
              </View>
            )}

            {/* Loading State - only show if no result yet */}
            {gettingAdvice && !advisorResult && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.blue} />
                <Text style={styles.loadingText}>
                  {hasExistingPolicy ? 'Analyzing your policy...' : 'Finding best policies for you...'}
                </Text>
                <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    margin: spacing.screenPadding,
    borderRadius: borderRadius.medium,
    padding: spacing.xs,
    ...colors.shadows?.small,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary.blue,
  },
  modeButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
  },
  modeButtonTextActive: {
    color: colors.neutral.white,
    fontWeight: typography.weight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    ...colors.shadows?.small,
  },
  toggleLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
  },
  formContainer: {
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    ...colors.shadows?.small,
  },
  pickerContainer: {
    marginBottom: spacing.md,
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
    borderRadius: borderRadius.small,
    backgroundColor: colors.neutral.white,
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  resultContainer: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  currentPolicyCard: {
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    ...colors.shadows?.small,
  },
  currentPolicyTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  currentPolicyName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
    marginBottom: spacing.xs,
  },
  currentPolicyPremium: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
    marginBottom: spacing.sm,
  },
  currentPolicySummary: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  recommendationsTitle: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  verdictCard: {
    backgroundColor: colors.primary.blue,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  verdictTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.white,
    marginBottom: spacing.sm,
  },
  verdictReason: {
    fontSize: typography.size.body,
    color: colors.neutral.white,
    lineHeight: 22,
  },
});

