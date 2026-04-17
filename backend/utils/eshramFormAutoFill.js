/**
 * e-Shram Form Auto-fill using Gemini
 * Intelligently fills mock e-Shram form fields based on user profile and transaction data
 */

const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Auto-fill mock e-Shram form with intelligent data generation
 * @param {string} apiKey - Gemini API key
 * @param {Object} options - Options object
 * @param {Object} options.userProfile - User profile from Firestore
 * @param {Array} options.transactions - Recent transactions from Firestore
 * @returns {Promise<Object>} Auto-fill result with form data
 */
async function autoFillEShramForm(apiKey, options) {
  const { userProfile, transactions } = options;

  // Calculate income estimate from transactions
  const incomeTransactions = transactions.filter(tx => tx.type === 'credit' || tx.amount > 0);
  const last90Days = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const recentIncome = incomeTransactions
    .filter(tx => tx.timestamp && tx.timestamp >= last90Days)
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  const estimatedMonthlyIncome = recentIncome / 3; // Rough estimate
  let incomeRange = '<1L';
  if (estimatedMonthlyIncome > 41666) { // ~5L/year
    incomeRange = '>5L';
  } else if (estimatedMonthlyIncome > 25000) { // ~3L/year
    incomeRange = '3-5L';
  } else if (estimatedMonthlyIncome > 8333) { // ~1L/year
    incomeRange = '1-3L';
  }

  // Build comprehensive prompt for realistic form filling
  const prompt = `You are helping to fill out a mock e-Shram registration form for a gig worker in India. 

**Available User Data from Database:**
${JSON.stringify({
  email: userProfile?.email || '',
  fullName: userProfile?.fullName || '',
  incomeType: userProfile?.incomeType || 'gig',
}, null, 2)}

**Estimated Monthly Income from Transactions:**
Approximately ₹${Math.round(estimatedMonthlyIncome)}/month (${incomeRange} range)

**IMPORTANT INSTRUCTIONS:**
1. Use the provided user data where available (email, fullName)
2. For MISSING fields, generate REALISTIC, contextually appropriate data that:
   - Matches a gig worker profile in India
   - Is consistent with existing data
   - Feels natural and realistic (not AI-generated)
   - Follows Indian naming conventions, phone number formats (10 digits), etc.
   - Age should be realistic for a gig worker (typically 18-50)

3. Generate data that feels human-written:
   - Use natural variations
   - Use realistic Indian names, cities, areas
   - Phone numbers should be valid 10-digit Indian mobile numbers starting with 6-9
   - Age should be between 18-50 for gig workers

4. Fill ALL required form fields.

**Form Fields to Fill:**

- name: Full name (use from userProfile if available, else generate realistic Indian name)
- mobile: 10-digit mobile number starting with 6-9
- email: Email (use from userProfile if available)
- ageOrDob: Either age (e.g., "28") or date of birth (DD/MM/YYYY format)
- state: Indian state (generate realistic state, e.g., Maharashtra, Delhi, Karnataka)
- occupation: Gig worker occupation (e.g., "Delivery Worker", "Cab Driver", "Freelance Designer", "Food Delivery Partner")
- incomeRange: One of: "<1L", "1-3L", "3-5L", ">5L" (use the estimated range: ${incomeRange})

Return STRICT JSON with this exact structure:

{
  "name": "string",
  "mobile": "string (10 digits)",
  "email": "string",
  "ageOrDob": "string (age or DD/MM/YYYY)",
  "state": "string (Indian state)",
  "occupation": "string",
  "incomeRange": "<1L" | "1-3L" | "3-5L" | ">5L",
  "notes": "string (optional brief note about the auto-fill)"
}

DO NOT output anything except the JSON object. Make sure generated data is realistic and contextually appropriate.`;

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
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[e-Shram Auto-fill] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    let jsonText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        jsonText = parts[0].text;
      }
    }

    if (!jsonText) {
      throw new Error('No text in Gemini response');
    }

    // Clean the response
    let cleanedJson = jsonText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/```\n?/g, '');
    }

    // Parse JSON
    let result;
    try {
      result = JSON.parse(cleanedJson);
      console.log('[e-Shram Auto-fill] Successfully parsed auto-fill result');
    } catch (parseError) {
      console.error('[e-Shram Auto-fill] JSON parse error:', parseError);
      console.error('[e-Shram Auto-fill] JSON text:', cleanedJson.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Override with user profile data if available
    if (userProfile?.email) {
      result.email = userProfile.email;
    }
    if (userProfile?.fullName) {
      result.name = userProfile.fullName;
    }
    
    // Ensure income range matches our calculation
    result.incomeRange = incomeRange;

    return result;
  } catch (error) {
    console.error('[e-Shram Auto-fill] Error:', error);
    throw error;
  }
}

module.exports = {
  autoFillEShramForm,
};

