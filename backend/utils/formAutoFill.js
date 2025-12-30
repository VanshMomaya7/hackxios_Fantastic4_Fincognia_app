/**
 * Form Auto-fill using Gemini
 * Intelligently fills missing form fields with realistic, contextually matching data
 */

const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Auto-fill policy application form with intelligent data generation
 * @param {string} apiKey - Gemini API key
 * @param {Object} options - Options object
 * @param {string} options.policyType - Type of policy: 'bike' | 'health' | 'accident' | 'income'
 * @param {Object} options.userData - User data from Firebase
 * @param {Object} options.policyDetails - Selected policy details
 * @returns {Promise<Object>} Auto-fill result with form data
 */
async function autoFillPolicyForm(apiKey, options) {
  const { policyType, userData, policyDetails } = options;

  // Build comprehensive prompt for realistic form filling
  const prompt = `You are helping to fill out a ${policyType} insurance application form for a gig worker in India. 

**Available User Data from Database:**
${JSON.stringify(userData, null, 2)}

**Selected Policy Details:**
- Provider: ${policyDetails.provider}
- Policy Name: ${policyDetails.name}
- Premium: ${policyDetails.premium}
- Coverage: ${policyDetails.coverage.join(', ')}

**IMPORTANT INSTRUCTIONS:**
1. Use the provided user data where available (email, fullName, etc.)
2. For MISSING fields, generate REALISTIC, contextually appropriate data that:
   - Matches the user's profile (gig worker in India)
   - Is consistent with existing data (e.g., if city is Mumbai, address should be in Mumbai)
   - Feels natural and realistic (not AI-generated)
   - Follows Indian naming conventions, address formats, phone number formats (10 digits), etc.
   - Age should match dateOfBirth
   - Nominee relationship should make sense with user's age/profile
   - Policy-specific fields should align with the selected policy type

3. Generate data that feels human-written:
   - Use natural variations (e.g., "Flat 304, Sunshine Apartments" not "House 123, Street 456")
   - Use realistic Indian names, cities, areas
   - Phone numbers should be valid 10-digit Indian mobile numbers starting with 6-9
   - Aadhaar should be 12 digits
   - Pincodes should be valid 6-digit Indian pincodes
   - Use natural language for addresses

4. Fill ALL 20-25 form fields. Missing fields should be generated realistically.

**Form Fields to Fill (${policyType} policy):**

**Personal Information (7 fields):**
- fullName: Full name (use from userData if available, else generate realistic Indian name)
- dateOfBirth: YYYY-MM-DD format (generate realistic DOB, age 25-45 for gig worker)
- gender: Male/Female/Other
- email: Email (use from userData, or generate matching email)
- phoneNumber: 10-digit mobile number (generate if not in userData)
- alternatePhone: 10-digit alternate number
- aadhaarNumber: 12-digit Aadhaar number

**Address Information (5 fields):**
- currentAddress: Full address with apartment/flat number, building name, area
- city: Indian city (generate realistic, e.g., Mumbai, Delhi, Bangalore, Pune)
- state: Indian state matching the city
- pincode: 6-digit valid pincode matching city
- permanentAddressSame: boolean (true/false)

**Policy-Specific Fields (5-8 fields based on type):**
${getPolicySpecificFieldsPrompt(policyType)}

**Nominee Information (5 fields):**
- nomineeName: Full name (generate realistic, appropriate relationship)
- nomineeRelationship: Spouse/Parent/Sibling/Child/etc. (should match age/profile)
- nomineeDateOfBirth: YYYY-MM-DD
- nomineePhoneNumber: 10-digit number
- nomineeAddress: Full address (can be same or different)

**Payment Information (3 fields):**
- paymentMethod: UPI/Card/Net Banking/Bank Transfer
- bankAccountNumber: 9-18 digit account number
- ifscCode: Valid 11-character IFSC code (format: XXXX0XXXXXX)

**Declaration (2 fields):**
- declarationConsent: true
- medicalDisclosureConsent: true

**Additional Details (2 fields):**
- howDidYouHear: Referral/Friend/Online Ad/Social Media/etc.
- additionalNotes: Empty string or brief note

Return STRICT JSON with this exact structure:

{
  "formData": {
    // All 20-25 fields with realistic values
  },
  "filledFields": ["field1", "field2", ...], // Fields that came from userData
  "generatedFields": ["field1", "field2", ...], // Fields that were generated
  "confidence": 0.95 // Confidence score
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
            temperature: 0.3, // Lower temperature for more consistent, realistic data
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Form Auto-fill] Gemini API error:', response.status, errorText);
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
      console.log('[Form Auto-fill] Successfully parsed auto-fill result');
    } catch (parseError) {
      console.error('[Form Auto-fill] JSON parse error:', parseError);
      console.error('[Form Auto-fill] JSON text:', cleanedJson.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    // Validate result structure
    if (!result.formData) {
      throw new Error('Invalid response structure: missing formData');
    }

    return {
      formData: result.formData,
      filledFields: result.filledFields || [],
      generatedFields: result.generatedFields || [],
      confidence: result.confidence || 0.9,
    };
  } catch (error) {
    console.error('[Form Auto-fill] Error:', error);
    throw error;
  }
}

/**
 * Get policy-specific fields prompt based on policy type
 */
function getPolicySpecificFieldsPrompt(policyType) {
  const prompts = {
    bike: `
- bikeMake: Manufacturer (e.g., Honda, Bajaj, Hero, TVS, Yamaha)
- bikeModel: Model name (e.g., Activa, Pulsar, Splendor, Apache)
- registrationNumber: Format: XX##XX#### (e.g., MH12AB1234)
- yearOfManufacture: YYYY (2018-2024)
- engineCC: Engine capacity (e.g., 125cc, 150cc, 200cc)
`,

    health: `
- height: Height in cm (150-180)
- weight: Weight in kg (50-90)
- bloodGroup: A+/A-/B+/B-/O+/O-/AB+/AB-
- preExistingConditions: None or realistic condition (e.g., "None", "Mild hypertension")
- anyExistingHealthInsurance: true/false
- existingPolicyNumber: Policy number if anyExistingHealthInsurance is true, else empty
`,

    accident: `
- occupation: Realistic gig worker occupation (e.g., Delivery Driver, Cab Driver, Freelance Designer)
- employmentType: Self-Employed/Contractor/Freelancer
- preferredCoverageAmount: Coverage amount in ₹ (e.g., "₹5 Lakh", "₹10 Lakh")
`,

    income: `
- monthlyIncome: Monthly income in ₹ (15000-50000 for gig worker)
- occupationDetails: Detailed occupation description
- disabilityHistory: None or brief description
`,
  };

  return prompts[policyType] || '';
}

module.exports = {
  autoFillPolicyForm,
};

