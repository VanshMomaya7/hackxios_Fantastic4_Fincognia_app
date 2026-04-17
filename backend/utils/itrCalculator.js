/**
 * ITR Calculator Utility
 * Calculates ITR-4 for gig workers using presumptive taxation model
 */

/**
 * Calculate ITR-4 for a gig worker
 * Uses presumptive taxation model (Section 44ADA for professionals/small businesses)
 * Simplified for gig workers: either 6% of receipts OR receipts minus expenses, whichever is higher (more conservative)
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.grossReceipts - Total gross receipts
 * @param {Record<string, number>} params.expensesSummary - Expense breakdown
 * @param {number} params.tdsCredits - TDS already deducted
 * @param {string} params.financialYear - Financial year (e.g., "2024-25")
 * @returns {Object} ITR calculation result
 */
function calculateItr4(params) {
  const { grossReceipts, expensesSummary, tdsCredits = 0, financialYear } = params;

  // Calculate total expenses
  const totalExpenses = Object.values(expensesSummary || {}).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

  // Presumptive income calculation
  // Option 1: 6% of gross receipts (presumptive rate for professionals)
  // Option 2: Gross receipts minus expenses
  // Use whichever is higher (more conservative, i.e., more taxable income)
  const presumptiveIncomeOption1 = Math.max(0, 0.06 * grossReceipts);
  const presumptiveIncomeOption2 = Math.max(0, grossReceipts - totalExpenses);
  const presumptiveIncome = Math.max(presumptiveIncomeOption1, presumptiveIncomeOption2);

  // Calculate taxable income (presumptive income is the taxable income for Section 44ADA)
  // For simplicity, we're assuming no other deductions/income
  const taxableIncome = presumptiveIncome;

  // Tax slabs for FY 2024-25 (Non-senior individual, resident)
  // 0 - 3,00,000: Nil
  // 3,00,001 - 7,00,000: 5%
  // 7,00,001 - 10,00,000: 10%
  // 10,00,001 - 12,00,000: 15%
  // 12,00,001 - 15,00,000: 20%
  // Above 15,00,000: 30%
  
  let taxOnIncome = 0;
  
  if (taxableIncome > 1500000) {
    taxOnIncome = 0 + // 0-3L: 0%
      (700000 - 300000) * 0.05 + // 3L-7L: 5%
      (1000000 - 700000) * 0.10 + // 7L-10L: 10%
      (1200000 - 1000000) * 0.15 + // 10L-12L: 15%
      (1500000 - 1200000) * 0.20 + // 12L-15L: 20%
      (taxableIncome - 1500000) * 0.30; // Above 15L: 30%
  } else if (taxableIncome > 1200000) {
    taxOnIncome = 0 +
      (700000 - 300000) * 0.05 +
      (1000000 - 700000) * 0.10 +
      (1200000 - 1000000) * 0.15 +
      (taxableIncome - 1200000) * 0.20;
  } else if (taxableIncome > 1000000) {
    taxOnIncome = 0 +
      (700000 - 300000) * 0.05 +
      (1000000 - 700000) * 0.10 +
      (taxableIncome - 1000000) * 0.15;
  } else if (taxableIncome > 700000) {
    taxOnIncome = 0 +
      (700000 - 300000) * 0.05 +
      (taxableIncome - 700000) * 0.10;
  } else if (taxableIncome > 300000) {
    taxOnIncome = 0 +
      (taxableIncome - 300000) * 0.05;
  } else {
    taxOnIncome = 0;
  }

  // Add health and education cess (4% of tax)
  const cess = taxOnIncome * 0.04;
  const totalTax = taxOnIncome + cess;

  // Calculate tax payable or refund
  const taxPayable = Math.max(0, totalTax - tdsCredits);
  const refund = Math.max(0, tdsCredits - totalTax);

  return {
    presumptiveIncome: Math.round(presumptiveIncome),
    taxableIncome: Math.round(taxableIncome),
    taxOnIncome: Math.round(taxOnIncome),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax),
    taxPayable: Math.round(taxPayable),
    refund: Math.round(refund),
  };
}

/**
 * Generate plain-language explanation for ITR summary
 * @param {Object} params - ITR summary data
 * @param {string} apiKey - Gemini API key (optional, if not provided, returns basic explanation)
 * @returns {Promise<string>} Plain-language explanation
 */
async function generateExplanation(params, apiKey = null) {
  const {
    itrForm,
    financialYear,
    grossReceipts,
    presumptiveIncome,
    expensesSummary,
    tdsCredits,
    taxPayable,
    refund,
  } = params;

  // Basic explanation without Gemini (fallback)
  const basicExplanation = `
• Your gross receipts for ${financialYear} are ₹${grossReceipts.toLocaleString('en-IN')}.
• Based on presumptive taxation (Section 44ADA), your taxable income is ₹${presumptiveIncome.toLocaleString('en-IN')}.
• ${taxPayable > 0 ? `You owe ₹${taxPayable.toLocaleString('en-IN')} in taxes.` : `You are eligible for a refund of ₹${Math.abs(refund).toLocaleString('en-IN')}.`}
• TDS credits of ₹${tdsCredits.toLocaleString('en-IN')} have been considered.
${Object.keys(expensesSummary || {}).length > 0 ? `• Expenses claimed: ${Object.entries(expensesSummary).map(([k, v]) => `${k}: ₹${v.toLocaleString('en-IN')}`).join(', ')}.` : ''}
`.trim();

  // If API key is provided, try to get a more detailed explanation from Gemini
  if (apiKey) {
    try {
      const fetch = require('node-fetch');
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const prompt = `Explain this ITR summary to a gig worker in India in simple language. Input JSON:
${JSON.stringify({ itrForm, financialYear, grossReceipts, presumptiveIncome, expensesSummary, tdsCredits, taxPayable, refund }, null, 2)}

Respond with 3-5 short bullet points, plain English, no legal jargon. Keep it friendly and easy to understand.`;

      const response = await fetch(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = data.candidates[0].content.parts;
          if (parts && parts[0] && parts[0].text) {
            return parts[0].text.trim();
          }
        }
      }
    } catch (error) {
      console.error('[ITR Calculator] Error generating explanation with Gemini:', error);
      // Fall through to basic explanation
    }
  }

  return basicExplanation;
}

module.exports = {
  calculateItr4,
  generateExplanation,
};

