/**
 * ITR Document Analysis Utility
 * Uses Gemini Vision to extract data from payout summaries, Form 26AS, and bank statements
 */

const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Extract income data from payout summary (gig platform screenshots)
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<{grossReceipts: number, tdsDeducted: number}>}
 */
async function extractPayoutData(apiKey, imageBase64, mimeType) {
  const prompt = `This is a payout summary screenshot for a gig worker in India (from platforms like Zomato, Uber, Rapido, Swiggy, etc.).

Extract the following information and return ONLY valid JSON (no markdown, no extra text):
{
  "grossReceipts": number (total earnings/receipts amount, default to 0 if not found),
  "tdsDeducted": number (TDS deducted amount, default to 0 if not found)
}

Focus on: total earnings, total payout, gross receipts, TDS, tax deducted.
Return only the JSON object.`;

  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000;
    
    try {
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
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ITR Document Analysis] Gemini API error (attempt ${retryCount + 1}):`, response.status, errorText);
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[ITR Document Analysis] Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeApiCall(retryCount + 1);
        }
        
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

      // Clean JSON
      let cleanedJson = jsonText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedJson);
      
      return {
        grossReceipts: typeof parsed.grossReceipts === 'number' ? parsed.grossReceipts : 0,
        tdsDeducted: typeof parsed.tdsDeducted === 'number' ? parsed.tdsDeducted : 0,
      };
    } catch (error) {
      if (retryCount < maxRetries && error.message !== 'Request timeout after 60 seconds') {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[ITR Document Analysis] Error on attempt ${retryCount + 1}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiCall(retryCount + 1);
      }
      throw error;
    }
  };

  return makeApiCall();
}

/**
 * Extract TDS total from Form 26AS screenshot
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<{tdsTotal: number}>}
 */
async function extractForm26asData(apiKey, imageBase64, mimeType) {
  const prompt = `This is a cropped screenshot of Form 26AS for an Indian taxpayer.

Extract the total TDS amount for the financial year and return ONLY valid JSON (no markdown, no extra text):
{
  "tdsTotal": number (total TDS amount for the financial year, default to 0 if not found)
}

Focus on: total TDS, tax deducted at source, summary section.
Return only the JSON object.`;

  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000;
    
    try {
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
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ITR Document Analysis] Gemini API error (attempt ${retryCount + 1}):`, response.status, errorText);
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeApiCall(retryCount + 1);
        }
        
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

      let cleanedJson = jsonText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedJson);
      
      return {
        tdsTotal: typeof parsed.tdsTotal === 'number' ? parsed.tdsTotal : 0,
      };
    } catch (error) {
      if (retryCount < maxRetries && error.message !== 'Request timeout after 60 seconds') {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiCall(retryCount + 1);
      }
      throw error;
    }
  };

  return makeApiCall();
}

/**
 * Extract expense categories from bank statement screenshot
 * @param {string} apiKey - Gemini API key
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<{fuel: number, maintenance: number, phoneInternet: number, otherWorkExpenses: number}>}
 */
async function extractBankStatementData(apiKey, imageBase64, mimeType) {
  const prompt = `This is a screenshot of a bank statement for a gig worker in India.

Identify approximate totals for these expense categories and return ONLY valid JSON (no markdown, no extra text):
{
  "fuel": number (fuel expenses, default to 0 if not found),
  "maintenance": number (vehicle/equipment maintenance, default to 0 if not found),
  "phoneInternet": number (phone and internet expenses, default to 0 if not found),
  "otherWorkExpenses": number (other work-related expenses, default to 0 if not found)
}

Look for: fuel payments, maintenance charges, phone bills, internet bills, work-related expenses.
Return only the JSON object.`;

  const makeApiCall = async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 60000;
    
    try {
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
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ITR Document Analysis] Gemini API error (attempt ${retryCount + 1}):`, response.status, errorText);
        
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeApiCall(retryCount + 1);
        }
        
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

      let cleanedJson = jsonText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedJson);
      
      return {
        fuel: typeof parsed.fuel === 'number' ? parsed.fuel : 0,
        maintenance: typeof parsed.maintenance === 'number' ? parsed.maintenance : 0,
        phoneInternet: typeof parsed.phoneInternet === 'number' ? parsed.phoneInternet : 0,
        otherWorkExpenses: typeof parsed.otherWorkExpenses === 'number' ? parsed.otherWorkExpenses : 0,
      };
    } catch (error) {
      if (retryCount < maxRetries && error.message !== 'Request timeout after 60 seconds') {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiCall(retryCount + 1);
      }
      throw error;
    }
  };

  return makeApiCall();
}

module.exports = {
  extractPayoutData,
  extractForm26asData,
  extractBankStatementData,
};

