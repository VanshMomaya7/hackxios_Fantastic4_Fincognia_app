/**
 * Gemini API Client
 * Handles communication with Google Gemini API for SMS parsing
 */

const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Parse a single SMS message using Gemini API
 */
async function parseSmsWithGemini(apiKey, sender, body) {
  const prompt = `You are a parser for Indian financial SMS notifications (bank alerts, UPI, card transactions).

Parse the following SMS and return ONLY a valid JSON object with these exact keys:
- isFinancial: boolean
- channel: "upi" | "card" | "bank_transfer" | "salary" | "cashback" | "unknown"
- direction: "debit" | "credit" | "unknown"
- amount: number | null
- currency: "INR" | null
- counterpartyName: string | null (merchant/recipient name)
- counterpartyHandle: string | null (UPI ID, phone number, etc.)
- bank: string | null (bank name if mentioned)
- accountType: "savings" | "credit_card" | "wallet" | "unknown" | null
- timestampHint: ISO string | null (if date/time is mentioned)
- category: "food" | "transport" | "shopping" | "rent" | "utilities" | "salary" | "refund" | "other" | "unknown"
- narration: string | null (transaction description)
- confidence: number (0.0 to 1.0)
- shouldSkip: boolean (true if not a financial transaction or cannot parse)

SMS Details:
Sender: ${sender}
Body: ${body}
Locale: India

Return ONLY the JSON object, no explanations, no markdown, no code blocks.`;

  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text in Gemini response');
    }

    // Clean the response - remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    return {
      isFinancial: parsed.isFinancial ?? false,
      channel: parsed.channel || 'unknown',
      direction: parsed.direction || 'unknown',
      amount: parsed.amount ?? null,
      currency: parsed.currency || 'INR',
      counterpartyName: parsed.counterpartyName || null,
      counterpartyHandle: parsed.counterpartyHandle || null,
      bank: parsed.bank || null,
      accountType: parsed.accountType || null,
      timestampHint: parsed.timestampHint || null,
      category: parsed.category || 'unknown',
      narration: parsed.narration || null,
      confidence: parsed.confidence ?? 0.5,
      shouldSkip: parsed.shouldSkip ?? false,
    };
  } catch (error) {
    console.error('Error parsing SMS with Gemini:', error);
    // Return safe default
    return {
      isFinancial: false,
      channel: 'unknown',
      direction: 'unknown',
      amount: null,
      currency: null,
      counterpartyName: null,
      counterpartyHandle: null,
      bank: null,
      accountType: null,
      timestampHint: null,
      category: 'unknown',
      narration: null,
      confidence: 0.0,
      shouldSkip: true,
    };
  }
}

/**
 * Parse a batch of SMS messages
 */
async function parseSmsBatch(apiKey, messages) {
  const results = [];

  // Process messages one by one (Gemini can handle batch, but one-by-one is more reliable)
  for (const message of messages) {
    try {
      const parsed = await parseSmsWithGemini(
        apiKey,
        message.sender,
        message.body
      );

      results.push({
        id: message.id,
        ...parsed,
      });
    } catch (error) {
      console.error(`Error parsing message ${message.id}:`, error);
      results.push({
        id: message.id,
        isFinancial: false,
        channel: 'unknown',
        direction: 'unknown',
        amount: null,
        currency: null,
        counterpartyName: null,
        counterpartyHandle: null,
        bank: null,
        accountType: null,
        timestampHint: null,
        category: 'unknown',
        narration: null,
        confidence: 0.0,
        shouldSkip: true,
      });
    }
  }

  return results;
}

module.exports = {
  parseSmsBatch,
};

