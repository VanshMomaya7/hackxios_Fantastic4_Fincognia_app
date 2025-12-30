/**
 * Fraud Quiz Screen
 * Interactive quiz for fraud detection and prevention education
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizData {
  questions: Question[];
}

const GEMINI_API_KEY = 'AIzaSyBxGdu4KE2_AHIiy4pCY-VDlWMBynvAdPk';

export default function FraudQuizScreen() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuiz = async (): Promise<void> => {
    setIsLoading(true);
    setQuizData(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setIsFinished(false);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are a fraud detection expert for fintech.
Generate 5 multiple-choice questions about financial fraud detection, scam prevention, and fintech security.
Each question must:
- Be realistic and educational
- Have exactly 4 options
- Include only one correct answer
- Focus on Indian financial context (UPI, bank SMS, credit card fraud, phishing)
Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0
    }
  ]
}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API request failed: ${errorText}`);
      }

      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!textContent) {
        throw new Error('Empty response from Gemini API');
      }

      const cleaned = textContent.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('Invalid quiz format received');
      }

      setQuizData(parsed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later';
      Alert.alert('Failed to load quiz', errorMessage);
      console.error('[Fraud Quiz] Error fetching quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (optionIndex: number): void => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);

    if (quizData && optionIndex === quizData.questions[currentQuestion].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = (): void => {
    if (!quizData) return;

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsFinished(true);
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#00FFC6" />
          <Text style={styles.loadingText}>Generating your quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- No Quiz Data ---
  if (!quizData || quizData.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.card}>
          <Text style={styles.errorTitle}>Unable to load quiz</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuiz}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Quiz Finished ---
  if (isFinished) {
    const percentage = Math.round((score / quizData.questions.length) * 100);
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.card}>
          <Text style={styles.finishTitle}>Quiz Complete!</Text>
          <Text style={styles.percentageScore}>{percentage}%</Text>
          <Text style={styles.scoreDetails}>
            You scored {score} out of {quizData.questions.length}
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={fetchQuiz}>
            <Text style={styles.restartButtonText}>Try Another Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Active Quiz Question ---
  const question = quizData.questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1} of {quizData.questions.length}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === question.answer
              const showAsCorrect = showFeedback && isCorrect
              const showAsWrong = showFeedback && isSelected && !isCorrect

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswer(index)}
                  disabled={showFeedback}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: showAsCorrect
                        ? "#00FFC615"
                        : showAsWrong
                          ? "#FF4B4B15"
                          : isSelected
                            ? "#00FFC608"
                            : "rgba(255,255,255,0.05)",
                      borderColor: showAsCorrect ? "#00FFC6" : showAsWrong ? "#FF4B4B" : "rgba(255,255,255,0.2)",
                    },
                  ]}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Feedback & Next Button */}
        {showFeedback && (
          <View style={styles.feedbackSection}>
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: selectedAnswer === question.answer ? "rgba(0,255,198,0.15)" : "rgba(255,75,75,0.15)",
                  borderColor: selectedAnswer === question.answer ? "#00FFC6" : "#FF4B4B",
                },
              ]}
            >
              <Text style={styles.feedbackText}>{selectedAnswer === question.answer ? "Correct! ✓" : "Wrong ✗"}</Text>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentQuestion < quizData.questions.length - 1 ? "Next Question" : "See Results"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F2D',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 40,
    marginVertical: 40,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: "#B0B5C0",
    fontSize: 16,
    fontWeight: "500",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#00FFC6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#0A0F2D",
    fontSize: 16,
    fontWeight: "600",
  },
  finishTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  percentageScore: {
    fontSize: 48,
    fontWeight: "700",
    color: "#00FFC6",
    textAlign: "center",
    marginBottom: 12,
  },
  scoreDetails: {
    fontSize: 16,
    color: "#B0B5C0",
    textAlign: "center",
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: "#00FFC6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  restartButtonText: {
    color: "#0A0F2D",
    fontSize: 16,
    fontWeight: "600",
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  progressText: {
    fontSize: 12,
    color: "#B0B5C0",
  },
  scoreText: {
    fontSize: 12,
    color: "#B0B5C0",
  },
  questionSection: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  optionText: {
    fontSize: 14,
    color: "white",
  },
  feedbackSection: {
    gap: 12,
  },
  feedbackBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  nextButton: {
    backgroundColor: "#00FFC6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#0A0F2D",
    fontSize: 16,
    fontWeight: "600",
  },
})

