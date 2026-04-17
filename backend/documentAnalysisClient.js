/**
 * Document Analysis Client
 * Handles Gemini multimodal API calls for document understanding and policy comparison
 */

const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Analyze a single document using Gemini multimodal
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<Object>} Document analysis result
 */
async function analyzeDocument(apiKey, imageBase64, mimeType) {
  const prompt = `You are a financial document explainer for gig workers in India.

Analyze this financial document image (loan, insurance, policy, statement, payout summary, offer, etc.) and return STRICT JSON with these exact fields:

{
  "docType": "string (e.g., 'insurance_policy', 'loan_agreement', 'bank_statement', 'payout_summary', etc.)",
  "summary": "string (brief 2-3 sentence summary in simple language)",
  "keyFigures": [
    {"label": "string", "value": "string"}
  ],
  "risks": ["string", "string"],
  "actions": ["string", "string"],
  "confidence": number (0.0 to 1.0)
}

Use simple language that a gig worker can understand.
Focus on what matters: amounts, deadlines, obligations, costs.
DO NOT include any text outside the JSON object.`;

  // Helper function to make API call with retry logic
  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 second timeout
    
    try {
      console.log(`[Gemini Client] Attempting API call (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), timeoutMs);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(
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
                  {
                    inline_data: {
                      mime_type: mimeType || 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      return response;
    } catch (error) {
      const errorCode = error.code || error.errno || '';
      const errorMessage = error.message || String(error);
      
      console.error(`[Gemini Client] API call failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: errorMessage,
        code: errorCode,
        type: error.type
      });
      
      // Check if we should retry
      const isRetryableError = 
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network') ||
        error.type === 'system';
      
      // Retry on network errors or timeouts
      if (retryCount < maxRetries && isRetryableError) {
        const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[Gemini Client] Retrying in ${delayMs}ms (error: ${errorCode || errorMessage})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return makeApiCall(retryCount + 1);
      }
      
      // Don't retry - throw the error
      console.error(`[Gemini Client] All retry attempts exhausted or non-retryable error`);
      throw error;
    }
  };

  try {
    const response = await makeApiCall();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract JSON from response
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

    // Clean the response - remove markdown code blocks if present
    let cleanedJson = jsonText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/```\n?/g, '');
    }

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedJson);
      console.log('[Gemini Client] Parsed JSON successfully');
    } catch (parseError) {
      console.error('[Gemini Client] JSON parse error:', parseError);
      console.error('[Gemini Client] JSON text that failed:', cleanedJson.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Validate and normalize the response
    const result = {
      docType: parsed.docType || 'unknown',
      summary: parsed.summary || 'Could not analyze document.',
      keyFigures: Array.isArray(parsed.keyFigures) ? parsed.keyFigures : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
    
    console.log('[Gemini Client] Final result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error in analyzeDocument:', error);
    throw error;
  }
}

/**
 * Compare two policy documents using Gemini multimodal
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64A - Base64 encoded image of policy A
 * @param {string} imageBase64B - Base64 encoded image of policy B
 * @param {string} mimeTypeA - MIME type of image A
 * @param {string} mimeTypeB - MIME type of image B
 * @returns {Promise<Object>} Policy comparison result
 */
async function comparePolicies(apiKey, imageBase64A, imageBase64B, mimeTypeA, mimeTypeB) {
  const prompt = `You are comparing two financial policies for a gig worker in India.

Compare Policy A and Policy B (shown as two images) and return STRICT JSON with these exact fields:

{
  "policyA": {
    "name": "string | null",
    "summary": "string",
    "premium": "string | null",
    "coverage": ["string"],
    "exclusions": ["string"],
    "idealFor": "string | null"
  },
  "policyB": {
    "name": "string | null",
    "summary": "string",
    "premium": "string | null",
    "coverage": ["string"],
    "exclusions": ["string"],
    "idealFor": "string | null"
  },
  "comparison": {
    "betterForGigWorker": "A" | "B" | "depends",
    "reason": "string (explain why)",
    "keyDifferences": ["string", "string"]
  }
}

Focus on:
- Coverage details
- Exclusions
- Premium amounts
- Hidden terms
- Which is better for a gig worker with volatile income

Use simple language.
DO NOT output anything except the JSON object.`;

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
                {
                  inline_data: {
                    mime_type: mimeTypeA || 'image/jpeg',
                    data: imageBase64A,
                  },
                },
                {
                  text: '\n\n--- Policy B ---\n\n',
                },
                {
                  inline_data: {
                    mime_type: mimeTypeB || 'image/jpeg',
                    data: imageBase64B,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract JSON from response
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
    const parsed = JSON.parse(cleanedJson);

    // Validate and normalize the response
    return {
      policyA: {
        name: parsed.policyA?.name || null,
        summary: parsed.policyA?.summary || 'Could not analyze policy A.',
        premium: parsed.policyA?.premium || null,
        coverage: Array.isArray(parsed.policyA?.coverage) ? parsed.policyA.coverage : [],
        exclusions: Array.isArray(parsed.policyA?.exclusions) ? parsed.policyA.exclusions : [],
        idealFor: parsed.policyA?.idealFor || null,
      },
      policyB: {
        name: parsed.policyB?.name || null,
        summary: parsed.policyB?.summary || 'Could not analyze policy B.',
        premium: parsed.policyB?.premium || null,
        coverage: Array.isArray(parsed.policyB?.coverage) ? parsed.policyB.coverage : [],
        exclusions: Array.isArray(parsed.policyB?.exclusions) ? parsed.policyB.exclusions : [],
        idealFor: parsed.policyB?.idealFor || null,
      },
      comparison: {
        betterForGigWorker: parsed.comparison?.betterForGigWorker || 'depends',
        reason: parsed.comparison?.reason || 'Unable to determine which is better.',
        keyDifferences: Array.isArray(parsed.comparison?.keyDifferences)
          ? parsed.comparison.keyDifferences
          : [],
      },
    };
  } catch (error) {
    console.error('Error in comparePolicies:', error);
    throw error;
  }
}

/**
 * Fetch policies from internet/knowledge using Gemini
 * Generates real policy recommendations based on Indian insurance market knowledge
 * @param {string} apiKey - Gemini API key
 * @param {Object} options - Options object
 * @param {string} options.policyType - Type of policy: 'bike' | 'health' | 'accident' | 'income'
 * @param {string} options.budget - Budget level: 'low' | 'medium' | 'high'
 * @param {string} options.priority - Priority: 'accident' | 'hospital' | 'family' | 'income'
 * @param {Object} options.existingPolicyData - Parsed existing policy data (optional, for existing policy mode)
 * @returns {Promise<Array>} Array of policy objects
 */
async function fetchPoliciesFromKnowledge(apiKey, options) {
  const { policyType, budget, priority, existingPolicyData } = options;
  
  let prompt = '';
  
  if (existingPolicyData) {
    // Existing policy mode - recommend alternatives
    prompt = `You are a policy advisor for gig workers in India.

The user has an existing ${policyType || 'insurance'} policy with these details:
${JSON.stringify(existingPolicyData, null, 2)}

Based on current Indian insurance market information (2024-2025), recommend 5-7 real alternative policies from actual Indian insurance companies that would be better suited for a gig worker.

Focus on:
- Real insurance companies (e.g., HDFC Ergo, ICICI Lombard, Bajaj Allianz, Star Health, Care Health, New India Assurance, Oriental Insurance, etc.)
- Policies actually available in India in 2024-2025
- Better coverage for gig workers with volatile income
- More affordable premiums
- Better claim process
- Fewer exclusions

Return STRICT JSON array with these exact fields for each policy:

[
  {
    "id": "string (unique identifier)",
    "name": "string (policy name)",
    "provider": "string (real insurance company name)",
    "premium": "string (e.g., '₹1,200/year' or '₹3,500/year')",
    "coverage": ["string", "string"],
    "exclusions": ["string", "string"],
    "pros": ["string", "string"],
    "cons": ["string", "string"],
    "idealFor": "string"
  }
]

Use realistic premium ranges for Indian market and actual policy features.
DO NOT output anything except the JSON array.`;
  } else {
    // New policy mode
    const budgetDescription = {
      low: '₹500-₹2,000 per year',
      medium: '₹2,000-₹5,000 per year',
      high: '₹5,000+ per year'
    }[budget] || budget;

    const priorityDescription = {
      accident: 'accident coverage and protection',
      hospital: 'hospital expenses and medical coverage',
      family: 'family protection and coverage',
      income: 'income protection and financial security'
    }[priority] || priority;

    prompt = `You are a policy advisor for gig workers in India.

The user is looking for a new ${policyType} insurance policy with:
- Budget: ${budgetDescription}
- Priority: ${priorityDescription}
- Target: Gig workers with volatile income in India

Based on current Indian insurance market information (2024-2025), recommend 5-7 real policies from actual Indian insurance companies that match their needs.

Focus on:
- Real insurance companies operating in India (e.g., HDFC Ergo, ICICI Lombard, Bajaj Allianz, Star Health, Care Health, New India Assurance, Oriental Insurance, etc.)
- Policies actually available in the Indian market in 2024-2025
- Premium ranges matching the budget: ${budgetDescription}
- Coverage that addresses the priority: ${priorityDescription}
- Suitable for gig workers (volatile income, accident-prone work, need flexibility)

Return STRICT JSON array with these exact fields for each policy:

[
  {
    "id": "string (unique identifier, e.g., 'bike_1', 'health_2')",
    "name": "string (real policy name from the company)",
    "provider": "string (real insurance company name)",
    "premium": "string (e.g., '₹1,200/year' - must match budget range)",
    "coverage": ["string", "string"],
    "exclusions": ["string", "string"],
    "pros": ["string", "string"],
    "cons": ["string", "string"],
    "idealFor": "string (explain who this is good for)"
  }
]

Use realistic premium ranges for the Indian market in 2024-2025. Include actual policy features that exist.
DO NOT output anything except the JSON array.`;
  }

  // Helper function to make API call with retry logic
  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 second timeout
    
    try {
      console.log(`[Policy Fetcher] Attempting to fetch policies from Gemini (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), timeoutMs);
      });
      
      const fetchPromise = fetch(
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
              temperature: 0.2, // Slightly higher for more creative but still focused responses
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      return response;
    } catch (error) {
      const errorCode = error.code || error.errno || '';
      const errorMessage = error.message || String(error);
      
      console.error(`[Policy Fetcher] API call failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: errorMessage,
        code: errorCode,
      });
      
      const isRetryableError = 
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network') ||
        error.type === 'system';
      
      if (retryCount < maxRetries && isRetryableError) {
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`[Policy Fetcher] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return makeApiCall(retryCount + 1);
      }
      
      throw error;
    }
  };

  try {
    const response = await makeApiCall();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Policy Fetcher] Gemini API error:', response.status, errorText);
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

    // Parse JSON array
    let policies;
    try {
      policies = JSON.parse(cleanedJson);
      console.log('[Policy Fetcher] Successfully parsed policies from Gemini:', policies.length);
    } catch (parseError) {
      console.error('[Policy Fetcher] JSON parse error:', parseError);
      console.error('[Policy Fetcher] JSON text that failed:', cleanedJson.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Validate and normalize
    if (!Array.isArray(policies)) {
      throw new Error('Gemini response is not an array');
    }

    // Ensure all policies have required fields
    const validatedPolicies = policies
      .filter(p => p && p.name && p.provider)
      .map((p, index) => ({
        id: p.id || `${policyType}_${index + 1}`,
        name: p.name || 'Unknown Policy',
        provider: p.provider || 'Unknown Provider',
        premium: p.premium || 'Price on request',
        coverage: Array.isArray(p.coverage) ? p.coverage : [],
        exclusions: Array.isArray(p.exclusions) ? p.exclusions : [],
        pros: Array.isArray(p.pros) ? p.pros : [],
        cons: Array.isArray(p.cons) ? p.cons : [],
        idealFor: p.idealFor || 'Gig workers',
      }))
      .slice(0, 7); // Limit to 7 policies max

    console.log(`[Policy Fetcher] Validated ${validatedPolicies.length} policies`);
    return validatedPolicies;
  } catch (error) {
    console.error('[Policy Fetcher] Error fetching policies from knowledge:', error);
    throw error;
  }
}

/**
 * Get policy advice using Gemini multimodal
 * @param {string} apiKey - Gemini API key
 * @param {Object} options - Options object
 * @param {string} options.imageBase64 - Base64 encoded image of existing policy (optional)
 * @param {string} options.mimeType - MIME type of the image (optional)
 * @param {string} options.policyType - Type of policy: 'bike' | 'health' | 'accident' | 'income' (optional)
 * @param {string} options.budget - Budget level: 'low' | 'medium' | 'high' (optional)
 * @param {string} options.priority - Priority: 'accident' | 'hospital' | 'family' | 'income' (optional)
 * @param {Array} options.candidatePolicies - Array of candidate policies from JSON file
 * @returns {Promise<Object>} Policy advisor result
 */
async function getPolicyAdvice(apiKey, options) {
  const { imageBase64, mimeType, policyType, budget, priority, candidatePolicies } = options;
  
  let prompt = '';
  
  if (imageBase64) {
    // Existing policy mode
    prompt = `You are a policy advisor for gig workers in India.

The user has uploaded their existing policy document (shown as an image). Analyze it and recommend the top 5 alternative policies from the candidate list below that would be better suited for a gig worker.

Candidate Policies:
${JSON.stringify(candidatePolicies, null, 2)}

Return STRICT JSON with these exact fields:

{
  "detectedPolicy": {
    "name": "string | null",
    "summary": "string",
    "premium": "string | null",
    "coverage": ["string"],
    "exclusions": ["string"]
  },
  "recommendations": [
    {
      "id": "string",
      "name": "string",
      "provider": "string",
      "premium": "string",
      "coverage": ["string"],
      "exclusions": ["string"],
      "pros": ["string"],
      "cons": ["string"],
      "idealFor": "string",
      "whyRecommended": "string (explain why this is better for gig worker)"
    }
  ],
  "verdict": {
    "bestPolicyId": "string (id of best policy)",
    "reason": "string (explain why this is the best choice)"
  }
}

Focus on:
- Better coverage for gig workers
- More affordable premiums
- Better suited for volatile income
- Fewer exclusions
- Better claim process

Use simple language.
DO NOT output anything except the JSON object.`;
  } else {
    // New policy mode
    prompt = `You are a policy advisor for gig workers in India.

The user is looking for a new policy with these preferences:
- Policy Type: ${policyType}
- Budget: ${budget}
- Priority: ${priority}

Recommend the top 5 policies from the candidate list below that best match their needs.

Candidate Policies:
${JSON.stringify(candidatePolicies, null, 2)}

Return STRICT JSON with these exact fields:

{
  "detectedPolicy": null,
  "recommendations": [
    {
      "id": "string",
      "name": "string",
      "provider": "string",
      "premium": "string",
      "coverage": ["string"],
      "exclusions": ["string"],
      "pros": ["string"],
      "cons": ["string"],
      "idealFor": "string",
      "whyRecommended": "string (explain why this matches their needs)"
    }
  ],
  "verdict": {
    "bestPolicyId": "string (id of best policy)",
    "reason": "string (explain why this is the best choice)"
  }
}

Focus on matching:
- Budget level (${budget})
- Priority (${priority})
- Policy type (${policyType})
- Gig worker needs (volatile income, accident-prone work)

Use simple language.
DO NOT output anything except the JSON object.`;
  }

  // Helper function to make API call with retry logic
  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 second timeout
    
    try {
      console.log(`[Gemini Client] Attempting policy advice API call (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), timeoutMs);
      });
      
      // Build request body
      const requestBody = {
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
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };
      
      // Add image if provided
      if (imageBase64) {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }
      
      // Create the fetch promise
      const fetchPromise = fetch(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      return response;
    } catch (error) {
      const errorCode = error.code || error.errno || '';
      const errorMessage = error.message || String(error);
      
      console.error(`[Gemini Client] Policy advice API call failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: errorMessage,
        code: errorCode,
        type: error.type
      });
      
      // Check if we should retry
      const isRetryableError = 
        errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('network') ||
        error.type === 'system';
      
      // Retry on network errors or timeouts
      if (retryCount < maxRetries && isRetryableError) {
        const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[Gemini Client] Retrying in ${delayMs}ms (error: ${errorCode || errorMessage})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return makeApiCall(retryCount + 1);
      }
      
      // Don't retry - throw the error
      console.error(`[Gemini Client] All retry attempts exhausted or non-retryable error`);
      throw error;
    }
  };

  try {
    const response = await makeApiCall();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract JSON from response
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

    // Clean the response - remove markdown code blocks if present
    let cleanedJson = jsonText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/```\n?/g, '');
    }

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedJson);
      console.log('[Gemini Client] Parsed policy advice JSON successfully');
    } catch (parseError) {
      console.error('[Gemini Client] JSON parse error:', parseError);
      console.error('[Gemini Client] JSON text that failed:', cleanedJson.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Validate and normalize the response
    const result = {
      detectedPolicy: parsed.detectedPolicy || null,
      recommendations: Array.isArray(parsed.recommendations) 
        ? parsed.recommendations.slice(0, 5) // Ensure max 5 recommendations
        : [],
      verdict: parsed.verdict || {
        bestPolicyId: parsed.recommendations?.[0]?.id || null,
        reason: 'Unable to determine best policy.',
      },
    };
    
    console.log('[Gemini Client] Policy advice result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error in getPolicyAdvice:', error);
    throw error;
  }
}

module.exports = {
  analyzeDocument,
  comparePolicies,
  getPolicyAdvice,
  fetchPoliciesFromKnowledge,
};

