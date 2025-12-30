/**
 * Budget Planner Service
 * Generates comprehensive budget planning data including cash burnout, policy suggestions, savings tips, and risk analysis
 */

const fetch = require('node-fetch');
const { getRecentTransactions } = require('./transactionService');
const { getQuickForecast } = require('./moneyWeatherService');
const { firestore } = require('../config/firebaseAdmin');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Get comprehensive budget planner data
 */
async function getBudgetPlannerData(userId) {
  try {
    console.log(`[Budget Planner] Generating planner data for user ${userId}`);

    // Fetch user transactions
    const transactions = await getRecentTransactions(userId, 90);
    
    // Calculate current balance
    const currentBalance = transactions.reduce((sum, tx) => {
      return sum + (tx.amount || 0);
    }, 0);

    // Get forecast for cash burnout analysis
    const forecast = await getQuickForecast(userId, 30);
    
    // Calculate cash burnout
    const cashBurnout = calculateCashBurnout(currentBalance, transactions, forecast);
    
    // Get policy suggestions (simplified - can be enhanced with policy advisor service)
    const policySuggestions = await generatePolicySuggestions(userId, transactions);
    
    // Get savings tips
    const savingsTips = await generateSavingsTips(userId, transactions);
    
    // Get goals achievement plans
    const goalsAchievement = await generateGoalsAchievement(userId, transactions);
    
    // Get income risk analysis by month
    const incomeRisks = await generateIncomeRiskAnalysis(userId, transactions);

    return {
      cashBurnout,
      policySuggestions,
      savingsTips,
      goalsAchievement,
      incomeRisks,
    };
  } catch (error) {
    console.error('[Budget Planner] Error generating planner data:', error);
    throw error;
  }
}

/**
 * Calculate cash burnout scenario
 */
function calculateCashBurnout(currentBalance, transactions, forecast) {
  // Calculate average daily expense
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentExpenses = transactions.filter(tx => {
    if (tx.timestamp < thirtyDaysAgo) return false;
    return tx.type === 'debit' || (tx.amount && tx.amount < 0);
  });

  const totalExpenses = recentExpenses.reduce((sum, tx) => {
    return sum + Math.abs(tx.amount || 0);
  }, 0);

  const expenseDays = recentExpenses.length || 1;
  const avgDailyExpense = totalExpenses / expenseDays;

  // Project balance forward
  let projectedBalance = currentBalance;
  const projectedBalanceArray = [currentBalance];
  let daysUntilZero = null;

  for (let day = 1; day <= 30; day++) {
    projectedBalance -= avgDailyExpense;
    projectedBalanceArray.push(Math.max(0, projectedBalance));
    
    if (projectedBalance <= 0 && daysUntilZero === null) {
      daysUntilZero = day;
    }
  }

  return {
    currentBalance: Math.round(currentBalance),
    daysUntilZero,
    projectedBalance: projectedBalanceArray.map(b => Math.round(b)),
  };
}

/**
 * Generate policy suggestions using Gemini
 */
async function generatePolicySuggestions(userId, transactions) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getDefaultPolicySuggestions();
    }

    // Calculate monthly income
    const monthlyIncome = transactions
      .filter(tx => tx.type === 'credit' || (tx.amount && tx.amount > 0))
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / 3; // Rough estimate

    const prompt = `You are a financial advisor for gig workers in India. Based on the following financial profile, suggest 3-5 insurance policies that would be most beneficial:

Monthly Income (estimated): ₹${Math.round(monthlyIncome)}
User Type: Gig Worker

Return a JSON array of policy suggestions with this structure:
[
  {
    "name": "Policy name",
    "type": "bike|health|accident|income",
    "description": "Why this policy is recommended",
    "premium": estimated monthly premium in rupees
  }
]

Return ONLY valid JSON, no markdown, no explanations.`;

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
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    // Try to parse JSON from response
    let suggestions;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(text);
      }
    } catch (parseError) {
      console.warn('[Budget Planner] Failed to parse policy suggestions, using defaults');
      return getDefaultPolicySuggestions();
    }

    return Array.isArray(suggestions) ? suggestions : getDefaultPolicySuggestions();
  } catch (error) {
    console.error('[Budget Planner] Error generating policy suggestions:', error);
    return getDefaultPolicySuggestions();
  }
}

function getDefaultPolicySuggestions() {
  return [
    {
      name: 'Accident Insurance',
      type: 'accident',
      description: 'Critical protection for delivery and ride-hailing gig workers against accidents and injuries',
      premium: 500,
    },
    {
      name: 'Health Insurance',
      type: 'health',
      description: 'Essential coverage for medical expenses, especially important for irregular income workers',
      premium: 800,
    },
  ];
}

/**
 * Generate savings tips using Gemini
 */
async function generateSavingsTips(userId, transactions) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return getDefaultSavingsTips();
    }

    // Analyze spending patterns
    const categories = {};
    transactions.forEach(tx => {
      const cat = tx.category || 'other';
      categories[cat] = (categories[cat] || 0) + Math.abs(tx.amount || 0);
    });

    const prompt = `You are a financial coach for gig workers in India. Based on this spending pattern, provide 5-7 actionable savings tips:

Spending Categories:
${JSON.stringify(categories, null, 2)}

Return a JSON array of strings, each string being one savings tip. Tips should be:
- Specific and actionable
- Tailored for gig workers
- Practical and easy to implement

Return ONLY a valid JSON array of strings, no markdown, no explanations. Example: ["Tip 1", "Tip 2", ...]`;

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
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const tips = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
      return Array.isArray(tips) && tips.length > 0 ? tips : getDefaultSavingsTips();
    } catch (parseError) {
      return getDefaultSavingsTips();
    }
  } catch (error) {
    console.error('[Budget Planner] Error generating savings tips:', error);
    return getDefaultSavingsTips();
  }
}

function getDefaultSavingsTips() {
  return [
    'Set aside 10% of each gig payout immediately for emergencies',
    'Use a separate savings account for goals to avoid temptation',
    'Track all small expenses - they add up quickly',
    'Plan meals in advance to reduce food delivery costs',
    'Consider switching to a cheaper mobile/data plan',
  ];
}

/**
 * Generate goals achievement plans
 */
async function generateGoalsAchievement(userId, transactions) {
  try {
    // Fetch user goals from Firestore
    let goals = [];
    if (firestore) {
      const goalsSnapshot = await firestore
        .collection('goals')
        .where('userId', '==', userId)
        .get();

      goals = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    if (goals.length === 0) {
      return [];
    }

    // Calculate monthly surplus
    const monthlyIncome = transactions
      .filter(tx => tx.type === 'credit' || (tx.amount && tx.amount > 0))
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / 3;

    const monthlyExpenses = transactions
      .filter(tx => tx.type === 'debit' || (tx.amount && tx.amount < 0))
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0) / 3;

    const monthlySurplus = monthlyIncome - monthlyExpenses;

    // Generate achievement plans for each goal
    return goals.map(goal => {
      const remaining = goal.targetAmount - (goal.currentAmount || 0);
      const monthsRemaining = Math.max(1, Math.ceil((goal.targetDate - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
      const recommendedMonthly = Math.round(remaining / monthsRemaining);

      return {
        goalName: goal.name,
        strategy: `Contribute ₹${recommendedMonthly.toLocaleString('en-IN')} monthly for ${monthsRemaining} months to reach your goal`,
        monthlyContribution: recommendedMonthly,
      };
    });
  } catch (error) {
    console.error('[Budget Planner] Error generating goals achievement:', error);
    return [];
  }
}

/**
 * Generate income risk analysis by month
 */
async function generateIncomeRiskAnalysis(userId, transactions) {
  try {
    // Group income by month for last 6 months
    const monthlyIncome = {};
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyIncome[monthKey] = 0;
    }

    transactions
      .filter(tx => tx.type === 'credit' || (tx.amount && tx.amount > 0))
      .forEach(tx => {
        const date = new Date(tx.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyIncome[monthKey] !== undefined) {
          monthlyIncome[monthKey] += Math.abs(tx.amount || 0);
        }
      });

    // Calculate average and identify risks
    const values = Object.values(monthlyIncome).filter(v => v > 0);
    const avgIncome = values.reduce((a, b) => a + b, 0) / values.length || 1;
    const volatility = values.length > 1 
      ? Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avgIncome, 2), 0) / values.length) / avgIncome
      : 0;

    // Generate risks for next 6 months
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const risks = [];

    for (let i = 1; i <= 6; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      const monthName = monthNames[date.getMonth()];
      
      // Determine risk level based on historical patterns
      let riskLevel = 'medium';
      if (volatility > 0.3) riskLevel = 'high';
      if (volatility < 0.15 && values.length >= 3) riskLevel = 'low';

      risks.push({
        month: `${monthName} ${date.getFullYear()}`,
        riskLevel,
        description: volatility > 0.3 
          ? 'High income volatility detected. Income may vary significantly this month.'
          : volatility < 0.15
          ? 'Stable income pattern. Expect consistent earnings this month.'
          : 'Moderate income volatility. Plan for some variation in earnings.',
        suggestedActions: [
          volatility > 0.3 ? 'Build emergency buffer before this month' : 'Continue regular savings',
          'Diversify income sources if possible',
          'Review and reduce non-essential expenses',
        ],
      });
    }

    return risks;
  } catch (error) {
    console.error('[Budget Planner] Error generating income risk analysis:', error);
    return [];
  }
}

module.exports = {
  getBudgetPlannerData,
};

