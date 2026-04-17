/**
 * Agent Screen
 * Financial agent chatbot interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import { queryAgent } from '../services/agentService';
import type { AgentMessage } from '../types/agent';
import Button from '../components/ui/Button';

const QUICK_ACTIONS = [
  { id: 'explain_week', label: 'Explain my week', message: 'Explain my last 7 days of money activity.', days: 7 },
  { id: 'can_i_buy', label: 'Can I buy this?', message: 'Can I afford to spend ₹X on Y this week?' },
  { id: 'fix_month', label: 'Fix my month', message: 'Look at my recent income and expenses and give me a 3-step plan to stabilize this month.' },
  { id: 'tax_help', label: 'Tax help', message: 'Check if I am ready for filing ITR this year and summarize my tax position.' },
  { id: 'policy_advice', label: 'Policy advice', message: 'Given my profile as a gig worker, what insurance category should I prioritize right now?' },
  { id: 'fraud_quiz', label: 'Fraud quiz', message: 'Give me a short fraud awareness quiz with one scenario question.' },
];

export default function AgentScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m PaisaBuddy, your financial assistant. How can I help you today?',
      createdAt: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when keyboard appears
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading || !user?.id) {
      return;
    }

    // Add user message
    const userMessage: AgentMessage = {
      id: generateMessageId(),
      role: 'user',
      content: textToSend,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const result = await queryAgent({
        userId: user.id,
        message: textToSend,
        history: messages,
      });

      // Add agent responses
      if (result.messages && result.messages.length > 0) {
        setMessages((prev) => [...prev, ...result.messages]);
      } else {
        // Fallback if no messages returned
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: 'assistant',
            content: 'I apologize, but I encountered an issue. Please try again.',
            createdAt: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error('[Agent Screen] Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your connection and try again.',
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.id === 'can_i_buy') {
      // For "Can I buy this?", prefill the input but let user edit
      setInputText(action.message);
    } else {
      // For other actions, send immediately
      handleSend(action.message);
    }
  };

  const renderMessage = (message: AgentMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const Content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>PaisaBuddy Agent</Text>
      </View>

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsContainer}
        contentContainerStyle={styles.quickActionsContent}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionChip}
            onPress={() => handleQuickAction(action)}
            disabled={loading}>
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area - Fixed at bottom */}
      <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={colors.neutral.mediumGray}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            autoCorrect={true}
            autoCapitalize="sentences"
            underlineColorAndroid="transparent"
            selectionColor={colors.primary.blue}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardView}
          keyboardVerticalOffset={90}>
          {Content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.keyboardView}>{Content}</View>
      )}
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
  quickActionsContainer: {
    maxHeight: 60,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  quickActionsContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickActionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl, // Extra padding at bottom for input area
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  userBubble: {
    backgroundColor: colors.primary.blue,
  },
  assistantBubble: {
    backgroundColor: colors.neutral.white,
    ...shadows.small,
  },
  messageText: {
    fontSize: typography.size.body,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.neutral.white,
  },
  assistantMessageText: {
    color: colors.neutral.black,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemMessageText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  inputSafeArea: {
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.medium,
    fontSize: typography.size.body,
    color: '#000000',
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  sendButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.medium,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral.mediumGray,
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
  },
});

