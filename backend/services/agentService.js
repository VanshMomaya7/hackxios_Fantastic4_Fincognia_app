/**
 * Agent Service
 * Main orchestrator for financial agent queries
 * Handles intent classification and routes to appropriate handlers
 */

const fetch = require('node-fetch');
const { getRecentTransactions } = require('./transactionService');
const { getQuickForecast } = require('./moneyWeatherService');
const { getQuickTaxPosition } = require('./taxService');
const { firestore } = require('../config/firebaseAdmin');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Classify user intent using Gemini
 */
async function classifyIntent(apiKey, message, history = []) {
  const historyText = history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n');
  
  const prompt = `You are an intent classifier for a financial agent for gig workers in India.

Given the latest user message and short conversation history, classify the intent as one of:
["generic", "explain_money", "can_i_buy", "fix_month", "tax_help", "policy_advice", "fraud_quiz"].

Also, if the user asks "can I buy X?", extract amount and time horizon.
Return strict JSON: { "intent": "...", "amount": number | null, "timeframeDays": number | null }.

Latest message: ${message}
History: ${historyText || 'None'}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);
    return {
      intent: parsed.intent || 'generic',
      amount: parsed.amount || null,
      timeframeDays: parsed.timeframeDays || null,
    };
  } catch (error) {
    console.error('[Agent Service] Error classifying intent:', error);
    return { intent: 'generic', amount: null, timeframeDays: null };
  }
}

/**
 * Generate explanation using Gemini
 */
async function generateGeminiExplanation(apiKey, prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an issue generating a response.';
  } catch (error) {
    console.error('[Agent Service] Error generating explanation:', error);
    return 'I apologize, but I encountered an issue. Please try again.';
  }
}

/**
 * Handle explain_money intent
 */
async function handleExplainMoney(apiKey, userId, message = '') {
  try {
    // Detect time period from message (default to 30 days)
    let days = 30;
    const messageLower = message.toLowerCase();
    if (messageLower.includes('week') || messageLower.includes('7 days')) {
      days = 7;
    } else if (messageLower.includes('month') || messageLower.includes('30 days')) {
      days = 30;
    }

    console.log(`[Agent Service] Fetching transactions for last ${days} days`);

    const transactions = await getRecentTransactions(userId, days);
    console.log(`[Agent Service] Found ${transactions.length} transactions`);

    // Handle empty transactions or Firestore not initialized
    if (transactions.length === 0) {
      // Check if Firestore is available
      const { firestore } = require('../config/firebaseAdmin');
      const isFirestoreAvailable = firestore !== null;
      
      if (!isFirestoreAvailable) {
        // Firestore not configured - provide helpful message
        return {
          messages: [{
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: 'I\'m unable to access your transaction history right now because the database connection isn\'t configured. To use this feature, transactions need to be stored in your account.\n\nYou can:\n• Add transactions manually in the Transactions tab\n• Sync your account to import transactions automatically\n\nOnce you have transactions, I\'ll be able to analyze your financial activity!',
            createdAt: Date.now(),
          }],
          tookActions: ['checked_firestore_status', 'firestore_not_configured'],
        };
      }
      
      // Firestore is available but no transactions found
      const prompt = `The user asked to explain their financial activity for the last ${days} days, but I couldn't find any transactions in their account. Provide a friendly message explaining that there are no transactions found for this period and suggest they may need to add transactions manually in the Transactions tab or sync their account.`;
      const explanation = await generateGeminiExplanation(apiKey, prompt);

      return {
        messages: [{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: explanation,
          createdAt: Date.now(),
        }],
        tookActions: ['fetched_transactions', 'no_transactions_found'],
      };
    }

    const forecast = await getQuickForecast(userId, days);

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending = {};

    transactions.forEach(tx => {
      if (tx.type === 'credit' || tx.amount > 0) {
        totalIncome += Math.abs(tx.amount);
      } else {
        totalExpenses += Math.abs(tx.amount);
        const category = tx.category || 'other';
        categorySpending[category] = (categorySpending[category] || 0) + Math.abs(tx.amount);
      }
    });

    // Top 3 categories
    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amount]) => ({ category: cat, amount }));

    // Check for unusual spikes (amount > 3x average)
    const avgExpense = totalExpenses / Math.max(Object.keys(categorySpending).length, 1);
    const spikes = Object.entries(categorySpending)
      .filter(([_, amount]) => amount > avgExpense * 3)
      .map(([cat, amount]) => ({ category: cat, amount }));

    const periodLabel = days === 7 ? 'last 7 days' : `last ${days} days`;

    const prompt = `Explain this financial summary to a gig worker in India in simple language.

Total Income (${periodLabel}): ₹${totalIncome.toLocaleString('en-IN')}
Total Expenses (${periodLabel}): ₹${totalExpenses.toLocaleString('en-IN')}
Top Spending Categories: ${topCategories.length > 0 ? topCategories.map(c => `${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join(', ') : 'None'}
Risk Level: ${forecast.riskLevel}
${spikes.length > 0 ? `Unusual Spending: ${spikes.map(s => `${s.category}: ₹${s.amount.toLocaleString('en-IN')}`).join(', ')}` : ''}

Output 3-5 short sentences in simple, friendly language.`;

    const explanation = await generateGeminiExplanation(apiKey, prompt);

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: explanation,
        createdAt: Date.now(),
      }],
      tookActions: [`fetched_transactions_${days}d`, 'computed_forecast'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling explain_money:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error analyzing your financial activity. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle can_i_buy intent
 */
async function handleCanIBuy(apiKey, userId, amount, timeframeDays) {
  try {
    if (!amount || !timeframeDays) {
      return {
        messages: [{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'Could you please specify the amount you want to spend and the time period? For example: "Can I afford to spend ₹5000 on a phone this week?"',
          createdAt: Date.now(),
        }],
      };
    }

    const forecast = await getQuickForecast(userId, timeframeDays);
    
    // Simple buffer threshold (7 days of expenses)
    const buffer = forecast.dailyAvgExpenses * 7;
    const verdict = (forecast.projectedMinBalance - amount) >= buffer ? 'YES' : 'NO';

    const prompt = `Given the verdict = ${verdict}, amount = ₹${amount.toLocaleString('en-IN')}, buffer = ₹${buffer.toLocaleString('en-IN')}, and projected minimum balance = ₹${forecast.projectedMinBalance.toLocaleString('en-IN')}, explain to a gig worker if they can safely afford this purchase and why, in 3-4 short sentences. Be decisive.`;

    const explanation = await generateGeminiExplanation(apiKey, prompt);

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: explanation,
        createdAt: Date.now(),
      }],
      tookActions: ['ran_forecast', 'checked_buffer'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling can_i_buy:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error checking your affordability. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle fix_month intent
 */
async function handleFixMonth(apiKey, userId) {
  try {
    const transactions = await getRecentTransactions(userId, 30);
    const forecast = await getQuickForecast(userId, 30);

    // This month's totals
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let monthIncome = 0;
    let monthExpenses = 0;
    let subscriptionsTotal = 0;
    let discretionary = 0;
    let essential = 0;

    const discretionaryCategories = ['shopping', 'entertainment', 'food'];
    const subscriptions = new Set();

    transactions.forEach(tx => {
      if (tx.timestamp >= monthStart) {
        if (tx.type === 'credit' || tx.amount > 0) {
          monthIncome += Math.abs(tx.amount);
        } else {
          monthExpenses += Math.abs(tx.amount);
          const category = (tx.category || 'other').toLowerCase();
          
          if (discretionaryCategories.includes(category)) {
            discretionary += Math.abs(tx.amount);
          } else {
            essential += Math.abs(tx.amount);
          }

          // Check if recurring (simple heuristic: same merchant multiple times)
          if (tx.merchant) {
            if (subscriptions.has(tx.merchant)) {
              subscriptionsTotal += Math.abs(tx.amount);
            } else {
              subscriptions.add(tx.merchant);
            }
          }
        }
      }
    });

    // Simple 3-step strategy
    const reduceDiscretionary = discretionary * 0.3; // Reduce by 30%
    const pauseSubscriptions = subscriptionsTotal * 0.5; // Pause half
    const dailyCap = (monthIncome - essential) / 30 * 0.8; // 80% of remaining income per day

    const strategyData = {
      monthIncome,
      monthExpenses,
      subscriptionsTotal,
      discretionary,
      essential,
      reduceBy: reduceDiscretionary,
      pauseAmount: pauseSubscriptions,
      dailyCap,
    };

    const prompt = `Turn this JSON into a 3-step action plan for a gig worker to stabilize this month. Use bullets and simple language.

${JSON.stringify(strategyData, null, 2)}

Format as:
• Step 1: [action]
• Step 2: [action]
• Step 3: [action]`;

    const explanation = await generateGeminiExplanation(apiKey, prompt);

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: explanation,
        createdAt: Date.now(),
      }],
      tookActions: ['analyzed_month_spending', 'computed_strategy'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling fix_month:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error analyzing your month. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle tax_help intent
 */
async function handleTaxHelp(apiKey, userId) {
  try {
    const taxPosition = await getQuickTaxPosition(userId);

    if (!taxPosition.hasTaxData) {
      const prompt = `The user needs to upload documents for ITR filing. Create a friendly message explaining: "You need to upload X/Y documents first" where X is payout summary and Y is Form 26AS. Use simple language.`;
      const message = await generateGeminiExplanation(apiKey, prompt);

      return {
        messages: [{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: taxPosition.message || message,
          createdAt: Date.now(),
        }],
        tookActions: ['checked_tax_position'],
      };
    }

    // If tax data exists (future enhancement)
    const prompt = `Summarize this tax position for a gig worker:
Estimated Taxable Income: ₹${taxPosition.estimatedTaxableIncome?.toLocaleString('en-IN') || 0}
TDS Credits: ₹${taxPosition.tdsCredits?.toLocaleString('en-IN') || 0}

Provide next steps in simple language.`;

    const explanation = await generateGeminiExplanation(apiKey, prompt);

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: explanation,
        createdAt: Date.now(),
      }],
      tookActions: ['checked_tax_position'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling tax_help:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error checking your tax position. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle policy_advice intent
 */
async function handlePolicyAdvice(apiKey, userId) {
  try {
    // Get user profile
    let userProfile = null;
    if (firestore) {
      try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
        }
      } catch (error) {
        console.warn('[Agent Service] Could not fetch user profile:', error);
      }
    }

    const incomeType = userProfile?.incomeType || 'gig';

    const prompt = `Given that the user is a ${incomeType} worker in India, recommend which insurance category (accident/health/income protection/bike) is highest priority and provide a rough premium range to target. Return 3-5 sentences in simple language.`;

    const explanation = await generateGeminiExplanation(apiKey, prompt);

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: explanation,
        createdAt: Date.now(),
      }],
      tookActions: ['fetched_user_profile'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling policy_advice:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error providing policy advice. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle fraud_quiz intent
 */
async function handleFraudQuiz(apiKey) {
  try {
    const prompt = `Create a short fraud-awareness quiz for a gig worker in India.

Output JSON with:
{
  "scenario": "string (fraud scenario description)",
  "options": ["string", "string", "string", "string"],
  "correctIndex": number (0-3),
  "explanation": "string (why this is correct)"
}

Return only the JSON object.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const quiz = JSON.parse(jsonText);

    // Format as message
    const options = quiz.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n');
    const content = `${quiz.scenario}\n\n${options}\n\n(I'll reveal the answer and explanation after you respond!)`;

    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content,
        metadata: {
          correctIndex: quiz.correctIndex,
          explanation: quiz.explanation,
        },
        createdAt: Date.now(),
      }],
      tookActions: ['generated_fraud_quiz'],
    };
  } catch (error) {
    console.error('[Agent Service] Error handling fraud_quiz:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error generating the quiz. Please try again later.',
        createdAt: Date.now(),
      }],
    };
  }
}

/**
 * Handle generic intent (fallback chat)
 */
async function handleGeneric(apiKey, message, history = []) {
  const systemMessage = `You are PaisaBuddy, a financial coach for Indian gig workers. Be helpful, friendly, and use simple language. Avoid making up specific government integrations or bank product names. Keep responses concise (2-4 sentences).`;

  const historyText = history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n');
  
  const prompt = `${systemMessage}\n\nConversation history:\n${historyText || 'None'}\n\nUser: ${message}\n\nAssistant:`;

  const explanation = await generateGeminiExplanation(apiKey, prompt);

  return {
    messages: [{
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: explanation,
      createdAt: Date.now(),
    }],
  };
}

/**
 * Main handler for agent queries
 */
async function handleAgentQuery({ userId, message, history = [] }, apiKey) {
  try {
    // Classify intent
    const { intent, amount, timeframeDays } = await classifyIntent(apiKey, message, history);

    console.log(`[Agent Service] Classified intent: ${intent}, amount: ${amount}, timeframe: ${timeframeDays}`);

    let result;

    // Route to appropriate handler
    switch (intent) {
      case 'explain_money':
        result = await handleExplainMoney(apiKey, userId, message);
        break;
      case 'can_i_buy':
        result = await handleCanIBuy(apiKey, userId, amount, timeframeDays);
        break;
      case 'fix_month':
        result = await handleFixMonth(apiKey, userId);
        break;
      case 'tax_help':
        result = await handleTaxHelp(apiKey, userId);
        break;
      case 'policy_advice':
        result = await handlePolicyAdvice(apiKey, userId);
        break;
      case 'fraud_quiz':
        result = await handleFraudQuiz(apiKey);
        break;
      case 'generic':
      default:
        result = await handleGeneric(apiKey, message, history);
        break;
    }

    return {
      ...result,
      intent,
    };
  } catch (error) {
    console.error('[Agent Service] Error handling agent query:', error);
    return {
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an unexpected error. Please try again later.',
        createdAt: Date.now(),
      }],
      intent: 'generic',
    };
  }
}

module.exports = {
  handleAgentQuery,
};

