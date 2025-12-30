/**
 * Express Server for SMS Parsing with Gemini API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseSmsBatch } = require('./geminiClient');
const { analyzeDocument, comparePolicies, getPolicyAdvice, fetchPoliciesFromKnowledge } = require('./documentAnalysisClient');
const { autoFillPolicyForm } = require('./utils/formAutoFill');
const { generatePolicyApplicationPDF } = require('./utils/pdfGenerator');
const { sendPolicyApplicationEmail } = require('./utils/emailService');
const { getUserEmail, firestore } = require('./config/firebaseAdmin');
const { extractPayoutData, extractForm26asData, extractBankStatementData } = require('./utils/itrDocumentAnalysis');
const { calculateItr4, generateExplanation } = require('./utils/itrCalculator');
const { generateItrDraftPDF } = require('./utils/itrPdfGenerator');
const { handleAgentQuery } = require('./services/agentService');
const { getAdaptiveBudget } = require('./services/budgetService');
const { getBudgetPlannerData } = require('./services/budgetPlannerService');
const { generateBudgetPlannerPDF } = require('./utils/budgetPlannerPdfGenerator');
const { autoFillEShramForm } = require('./utils/eshramFormAutoFill');
const { generateEShramPDF } = require('./utils/eshramPdfGenerator');
const { sendEShramEmail } = require('./utils/emailService');
const { getRecentTransactions } = require('./services/transactionService');
const { getQuickForecast } = require('./services/moneyWeatherService');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve generated files (PDFs)
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sms-parser' });
});

// SMS parsing endpoint
app.post('/api/parse-sms-batch', async (req, res) => {
  try {
    const { userId, messages } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required and must not be empty' });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.id || !msg.sender || !msg.body || !msg.receivedAt) {
        return res.status(400).json({ error: 'Each message must have id, sender, body, and receivedAt' });
      }
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Parse messages with Gemini
    console.log(`Parsing ${messages.length} SMS messages for user ${userId}`);
    const results = await parseSmsBatch(apiKey, messages);

    res.json({ results });
  } catch (error) {
    console.error('Error in /api/parse-sms-batch:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Document analysis endpoint
app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Convert file buffer to base64
    let imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    console.log(`[Server] Analyzing document for user ${userId}, size: ${req.file.size} bytes, type: ${mimeType}`);
    console.log(`[Server] Image base64 length: ${imageBase64.length} characters`);
    
    // Warn if image is very large (base64 encoded size)
    if (imageBase64.length > 4000000) { // ~3MB base64 = ~2.25MB actual image
      console.warn(`[Server] Warning: Image is very large (${(imageBase64.length / 1024 / 1024).toFixed(2)}MB base64). This may cause timeout.`);
      console.warn(`[Server] Consider compressing images to < 2MB before upload.`);
    }

    // Analyze document with Gemini
    let result;
    try {
      result = await analyzeDocument(apiKey, imageBase64, mimeType);
      console.log(`[Server] Analysis complete. Doc type: ${result.docType}, Summary length: ${result.summary?.length || 0}`);
    } catch (analysisError) {
      console.error(`[Server] Error analyzing document:`, {
        message: analysisError.message,
        code: analysisError.code,
        errno: analysisError.errno,
        type: analysisError.type,
      });
      
      // Provide user-friendly error message for network issues
      const errorMessage = analysisError.message || 'Unknown error';
      if (errorMessage.includes('timeout') || 
          errorMessage.includes('ECONNRESET') || 
          errorMessage.includes('socket hang up') ||
          analysisError.code === 'ECONNRESET' ||
          analysisError.errno === 'ECONNRESET') {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable', 
          message: 'The document analysis service timed out. This may be due to network issues, large image size, or API rate limits. Please try again with a smaller image (under 2MB) or wait a few moments.',
          details: errorMessage
        });
      }
      
      throw analysisError; // Re-throw to be caught by outer catch
    }

    res.json(result);
  } catch (error) {
    console.error('Error in /api/analyze-document:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Policy advisor endpoint
app.post('/api/policy-advisor', upload.single('file'), async (req, res) => {
  try {
    const { userId, policyType, budget, priority } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Determine mode and get candidate policies
    let candidatePolicies = [];
    let imageBase64 = null;
    let mimeType = null;
    let existingPolicyData = null;
    let usingFallback = false;

    if (req.file) {
      // Existing policy mode - analyze uploaded policy
      imageBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
      
      console.log(`[Policy Advisor] Existing policy mode for user ${userId}, file size: ${req.file.size} bytes`);
      
      // First, analyze the uploaded policy to determine type and extract details
      let detectedPolicyType = 'health'; // Default
      try {
        const analyzedPolicy = await analyzeDocument(apiKey, imageBase64, mimeType);
        existingPolicyData = {
          docType: analyzedPolicy.docType,
          summary: analyzedPolicy.summary,
          keyFigures: analyzedPolicy.keyFigures,
        };
        
        // Determine policy type from docType
        const docTypeLower = analyzedPolicy.docType.toLowerCase();
        if (docTypeLower.includes('bike') || docTypeLower.includes('motor')) {
          detectedPolicyType = 'bike';
        } else if (docTypeLower.includes('health') || docTypeLower.includes('medical')) {
          detectedPolicyType = 'health';
        } else if (docTypeLower.includes('accident')) {
          detectedPolicyType = 'accident';
        } else if (docTypeLower.includes('income') || docTypeLower.includes('disability')) {
          detectedPolicyType = 'income';
        }
        
        console.log(`[Policy Advisor] Detected policy type: ${detectedPolicyType} from docType: ${analyzedPolicy.docType}`);
        
        // Try to fetch alternative policies from Gemini knowledge
        try {
          candidatePolicies = await fetchPoliciesFromKnowledge(apiKey, {
            policyType: detectedPolicyType,
            budget: 'medium', // Default for existing policy mode
            priority: 'hospital',
            existingPolicyData: existingPolicyData,
          });
          console.log(`[Policy Advisor] Fetched ${candidatePolicies.length} policies from Gemini knowledge`);
        } catch (fetchError) {
          console.warn('[Policy Advisor] Failed to fetch policies from Gemini, using JSON fallback:', fetchError.message);
          usingFallback = true;
        }
      } catch (analyzeError) {
        console.warn('[Policy Advisor] Failed to analyze existing policy, will use all policies as candidates:', analyzeError.message);
        // Continue with fallback - will use all policies from JSON
      }
      
      // Fallback to JSON if Gemini fetch failed or no policies fetched
      if (candidatePolicies.length === 0) {
        usingFallback = true;
      }
    } else {
      // New policy mode - use form inputs
      if (!policyType || !budget || !priority) {
        return res.status(400).json({ error: 'policyType, budget, and priority are required when no file is uploaded' });
      }

      console.log(`[Policy Advisor] New policy mode for user ${userId}, type: ${policyType}, budget: ${budget}, priority: ${priority}`);
      
      // Try to fetch policies from Gemini knowledge first
      try {
        candidatePolicies = await fetchPoliciesFromKnowledge(apiKey, {
          policyType,
          budget,
          priority,
        });
        console.log(`[Policy Advisor] Fetched ${candidatePolicies.length} policies from Gemini knowledge`);
      } catch (fetchError) {
        console.warn('[Policy Advisor] Failed to fetch policies from Gemini, using JSON fallback:', fetchError.message);
        usingFallback = true;
      }
    }

    // Fallback to JSON file if Gemini fetch failed
    if (candidatePolicies.length === 0 || usingFallback) {
      console.log('[Policy Advisor] Loading policies from JSON fallback file...');
      const policiesPath = path.join(__dirname, 'data', 'policies.json');
      let allPolicies = {};
      try {
        const policiesData = fs.readFileSync(policiesPath, 'utf8');
        allPolicies = JSON.parse(policiesData);
        
        if (req.file) {
          // Existing policy mode - get all policies as candidates
          candidatePolicies = [
            ...(allPolicies.bike || []),
            ...(allPolicies.health || []),
            ...(allPolicies.accident || []),
            ...(allPolicies.income || []),
          ];
        } else {
          // New policy mode - get policies for selected type
          candidatePolicies = allPolicies[policyType] || [];
        }
        
        if (candidatePolicies.length === 0) {
          return res.status(400).json({ error: `No policies found for type: ${policyType}` });
        }
        
        console.log(`[Policy Advisor] Loaded ${candidatePolicies.length} policies from JSON fallback`);
      } catch (fileError) {
        console.error('[Policy Advisor] Error reading policies.json:', fileError);
        return res.status(500).json({ error: 'Failed to load policy data from both Gemini and JSON file' });
      }
    }

    // Get policy advice from Gemini
    const result = await getPolicyAdvice(apiKey, {
      imageBase64,
      mimeType,
      policyType,
      budget,
      priority,
      candidatePolicies,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in /api/policy-advisor:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Auto-fill form endpoint
app.post('/api/auto-fill-form', async (req, res) => {
  try {
    const { userId, policyType, userData, policyDetails } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!policyType || !userData || !policyDetails) {
      return res.status(400).json({ error: 'policyType, userData, and policyDetails are required' });
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log(`[Auto-fill Form] Auto-filling form for user ${userId}, policy type: ${policyType}`);

    // Auto-fill form with Gemini
    const result = await autoFillPolicyForm(apiKey, {
      policyType,
      userData,
      policyDetails,
    });

    console.log(`[Auto-fill Form] Auto-fill complete. Filled: ${result.filledFields?.length || 0}, Generated: ${result.generatedFields?.length || 0}`);

    res.json(result);
  } catch (error) {
    console.error('Error in /api/auto-fill-form:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Submit policy application and send PDF via email
app.post('/api/submit-policy-application', async (req, res) => {
  try {
    const { userId, formData, policyData, signatureData } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!formData || !policyData || !signatureData) {
      return res.status(400).json({ error: 'formData, policyData, and signatureData are required' });
    }

    console.log(`[Submit Application] Processing application for user ${userId}`);
    console.log(`[Submit Application] Form data received with ${Object.keys(formData || {}).length} fields`);
    console.log(`[Submit Application] Policy: ${policyData?.name || 'N/A'}`);

    // Get user email from Firebase
    let userEmail = await getUserEmail(userId);
    
    if (!userEmail) {
      // Fallback to email from formData if Firebase Admin not configured
      userEmail = formData.email;
      console.warn(`[Submit Application] Could not fetch email from Firebase, using form email: ${userEmail}`);
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Generate PDF
    console.log('[Submit Application] Generating PDF...');
    let pdfBuffer;
    try {
      pdfBuffer = await generatePolicyApplicationPDF({
        formData,
        policyData,
        signatureData: {
          ...signatureData,
          timestamp: signatureData.timestamp || new Date().toISOString(),
          userId,
        },
      });
      console.log(`[Submit Application] PDF generated. Size: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      console.error('[Submit Application] PDF generation failed:', pdfError);
      return res.status(500).json({ 
        error: 'PDF generation failed', 
        message: pdfError.message || 'Failed to generate PDF document'
      });
    }

    // Send email with PDF attachment
    let emailResult = null;
    let emailError = null;
    try {
      console.log(`[Submit Application] Sending email to ${userEmail}...`);
      emailResult = await sendPolicyApplicationEmail({
        toEmail: userEmail,
        pdfBuffer,
        policyData,
        applicantName: formData.fullName || 'Customer',
      });
      console.log(`[Submit Application] Email sent successfully. Message ID: ${emailResult.messageId}`);
    } catch (err) {
      emailError = err;
      console.error('[Submit Application] Email sending failed:', emailError.message || emailError);
      console.error('[Submit Application] Email error details:', {
        name: emailError.name,
        code: emailError.code,
        message: emailError.message,
        stack: emailError.stack,
      });
      // Email failure is not fatal - we can still return success but warn about email
      console.warn('[Submit Application] Continuing despite email failure. PDF was generated successfully.');
    }

    // Return success even if email failed (PDF generation is the critical part)
    res.json({
      success: true,
      message: emailResult 
        ? 'Application submitted successfully. PDF sent to your email.'
        : 'Application submitted successfully. PDF was generated but email delivery failed. Please check your email service configuration.',
      emailMessageId: emailResult?.messageId || null,
      emailSent: !!emailResult,
      emailError: emailError?.message || null,
    });
  } catch (error) {
    console.error('='.repeat(50));
    console.error('[Submit Application] CRITICAL ERROR:', error);
    console.error('[Submit Application] Error name:', error.name);
    console.error('[Submit Application] Error message:', error.message);
    console.error('[Submit Application] Error code:', error.code);
    if (error.stack) {
      console.error('[Submit Application] Error stack:', error.stack);
    }
    console.error('='.repeat(50));
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message || 'An unexpected error occurred',
    });
  }
});

// ITR generation endpoint
app.post('/api/itr/generate', upload.fields([
  { name: 'payoutImage', maxCount: 1 },
  { name: 'form26asImage', maxCount: 1 },
  { name: 'bankStatementImage', maxCount: 1 },
]), async (req, res) => {
  try {
    const { userId, financialYear } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!financialYear) {
      return res.status(400).json({ error: 'financialYear is required' });
    }

    const payoutFile = req.files?.payoutImage?.[0];
    const form26asFile = req.files?.form26asImage?.[0];
    const bankStatementFile = req.files?.bankStatementImage?.[0];

    if (!payoutFile) {
      return res.status(400).json({ error: 'At least payout image is required' });
    }

    console.log(`[ITR Generation] Processing ITR draft for user ${userId}, FY: ${financialYear}`);

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[ITR Generation] GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Fetch user profile from Firestore
    let userProfile = null;
    if (firestore) {
      try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
        }
      } catch (firebaseError) {
        console.warn('[ITR Generation] Could not fetch user profile:', firebaseError.message);
      }
    }

    // Initialize variables
    let incomeFromDocs = 0;
    let tdsFromDocs = 0;
    let expensesFromDocs = {};

    // Extract data from payout image
    if (payoutFile) {
      try {
        console.log('[ITR Generation] Extracting payout data...');
        const imageBase64 = payoutFile.buffer.toString('base64');
        const mimeType = payoutFile.mimetype || 'image/jpeg';
        
        const payoutData = await extractPayoutData(apiKey, imageBase64, mimeType);
        incomeFromDocs += payoutData.grossReceipts || 0;
        tdsFromDocs += payoutData.tdsDeducted || 0;
        
        console.log(`[ITR Generation] Payout extracted: ₹${payoutData.grossReceipts}, TDS: ₹${payoutData.tdsDeducted}`);
      } catch (error) {
        console.error('[ITR Generation] Error extracting payout data:', error);
        // Continue with other documents
      }
    }

    // Extract TDS from Form 26AS
    if (form26asFile) {
      try {
        console.log('[ITR Generation] Extracting Form 26AS data...');
        const imageBase64 = form26asFile.buffer.toString('base64');
        const mimeType = form26asFile.mimetype || 'image/jpeg';
        
        const form26asData = await extractForm26asData(apiKey, imageBase64, mimeType);
        tdsFromDocs += form26asData.tdsTotal || 0;
        
        console.log(`[ITR Generation] Form 26AS TDS: ₹${form26asData.tdsTotal}`);
      } catch (error) {
        console.error('[ITR Generation] Error extracting Form 26AS data:', error);
        // Continue - Form 26AS is optional
      }
    }

    // Extract expenses from bank statement
    if (bankStatementFile) {
      try {
        console.log('[ITR Generation] Extracting bank statement data...');
        const imageBase64 = bankStatementFile.buffer.toString('base64');
        const mimeType = bankStatementFile.mimetype || 'image/jpeg';
        
        const bankData = await extractBankStatementData(apiKey, imageBase64, mimeType);
        expensesFromDocs = {
          fuel: bankData.fuel || 0,
          maintenance: bankData.maintenance || 0,
          phoneInternet: bankData.phoneInternet || 0,
          otherWorkExpenses: bankData.otherWorkExpenses || 0,
        };
        
        console.log('[ITR Generation] Bank statement expenses extracted:', expensesFromDocs);
      } catch (error) {
        console.error('[ITR Generation] Error extracting bank statement data:', error);
        // Continue - bank statement is optional
      }
    }

    const grossReceipts = incomeFromDocs;
    const tdsCredits = tdsFromDocs;

    // Calculate ITR-4
    console.log('[ITR Generation] Calculating ITR-4...');
    const itrCalculation = calculateItr4({
      grossReceipts,
      expensesSummary: expensesFromDocs,
      tdsCredits,
      financialYear,
    });

    const presumptiveIncome = itrCalculation.presumptiveIncome;

    // Generate explanation
    console.log('[ITR Generation] Generating explanation...');
    const explanation = await generateExplanation({
      itrForm: 'ITR-4',
      financialYear,
      grossReceipts,
      presumptiveIncome,
      expensesSummary: expensesFromDocs,
      tdsCredits,
      taxPayable: itrCalculation.taxPayable,
      refund: itrCalculation.refund,
    }, apiKey);

    // Build result object
    const result = {
      itrForm: 'ITR-4',
      financialYear,
      grossReceipts,
      presumptiveIncome,
      expensesSummary: expensesFromDocs,
      tdsCredits,
      taxPayable: itrCalculation.taxPayable,
      refund: itrCalculation.refund,
      explanation,
    };

    // Generate PDF
    let pdfUrl = null;
    try {
      console.log('[ITR Generation] Generating PDF...');
      const pdfBuffer = await generateItrDraftPDF({
        itrResult: result,
        userProfile,
      });

      // Save PDF to disk (create directory if needed)
      const pdfDir = path.join(__dirname, 'generated', 'itr-drafts');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfFileName = `itr-${userId}-${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFileName);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Return relative URL path
      pdfUrl = `/generated/itr-drafts/${pdfFileName}`;
      console.log(`[ITR Generation] PDF saved: ${pdfPath}`);
    } catch (pdfError) {
      console.error('[ITR Generation] Error generating PDF:', pdfError);
      // Continue without PDF - PDF is optional
    }

    // Return result
    res.json({
      ...result,
      pdfUrl,
    });

  } catch (error) {
    console.error('[ITR Generation] Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Agent query endpoint
app.post('/api/agent/query', async (req, res) => {
  try {
    const { userId, message, history } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required and must be a non-empty string' });
    }

    console.log(`[Agent Query] Processing query for user ${userId}`);

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Agent Query] GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Handle agent query
    const result = await handleAgentQuery({ userId, message, history: history || [] }, apiKey);

    res.json(result);
  } catch (error) {
    console.error('[Agent Query] Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Adaptive Budget endpoint
app.get('/api/budget/adaptive', async (req, res) => {
  try {
    const { userId, month, mode } = req.query;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Default to current month if not provided
    const targetMonth = month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    }

    console.log(`[Budget Service] Generating adaptive budget for user ${userId}, month ${targetMonth}, mode: ${mode || 'auto'}`);

    // Get adaptive budget
    const result = await getAdaptiveBudget(userId, targetMonth, mode || null);

    res.json(result);
  } catch (error) {
    console.error('[Budget Service] Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Budget Planner endpoints

// Get comprehensive budget planner data
app.post('/api/budget/planner', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[Budget Planner] Generating planner data for user ${userId}`);

    const plannerData = await getBudgetPlannerData(userId);

    res.json(plannerData);
  } catch (error) {
    console.error('[Budget Planner] Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Generate Budget Planner PDF
app.post('/api/budget/planner/pdf', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`[Budget Planner PDF] Generating PDF for user ${userId}`);

    // Get planner data
    const plannerData = await getBudgetPlannerData(userId);

    // Fetch user profile
    let userProfile = null;
    if (firestore) {
      try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
        }
      } catch (error) {
        console.warn('[Budget Planner PDF] Could not fetch user profile:', error.message);
      }
    }

    // Generate PDF
    const pdfBuffer = await generateBudgetPlannerPDF({
      plannerData,
      userProfile,
    });

    // Save PDF to generated folder
    const generatedDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const pdfFilename = `budget-planner-${userId}-${Date.now()}.pdf`;
    const pdfPath = path.join(generatedDir, pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Return PDF URL (relative path that can be served statically)
    const pdfUrl = `/generated/${pdfFilename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${pdfUrl}`;

    console.log(`[Budget Planner PDF] PDF generated successfully: ${pdfFilename}`);

    res.json({ pdfUrl: fullUrl, filename: pdfFilename });
  } catch (error) {
    console.error('[Budget Planner PDF] Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Social Security / e-Shram endpoints

// Auto-fill mock e-Shram form
app.post('/api/social-security/prefill', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Fetch user profile from Firestore
    let userProfile = null;
    try {
      if (firestore) {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
        }
      }
    } catch (error) {
      console.error('[Social Security] Error fetching user profile:', error);
      // Continue with null profile
    }

    // Fetch recent transactions for income estimation
    let transactions = [];
    try {
      transactions = await getRecentTransactions(userId, 90);
    } catch (error) {
      console.error('[Social Security] Error fetching transactions:', error);
      // Continue with empty transactions
    }

    console.log(`[Social Security] Auto-filling form for user ${userId}`);

    // Auto-fill form using Gemini
    const result = await autoFillEShramForm(apiKey, {
      userProfile,
      transactions,
    });

    res.json(result);
  } catch (error) {
    console.error('[Social Security] Error in /api/social-security/prefill:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Submit mock e-Shram form and generate PDF
app.post('/api/social-security/submit', async (req, res) => {
  try {
    const { userId, form } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!form) {
      return res.status(400).json({ error: 'form data is required' });
    }

    // Validate required fields
    const requiredFields = ['name', 'mobile', 'email', 'ageOrDob', 'state', 'occupation', 'incomeRange'];
    const missingFields = requiredFields.filter(field => !form[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    console.log(`[Social Security] Submitting form for user ${userId}`);

    // Get user email from Firestore
    const userEmail = await getUserEmail(userId);
    if (!userEmail) {
      console.warn(`[Social Security] Could not fetch email for user ${userId}, using form email`);
    }

    const emailToUse = userEmail || form.email;

    // Generate PDF
    const pdfBuffer = await generateEShramPDF({
      formData: form,
      userEmail: emailToUse,
    });

    // Save PDF to disk (optional, for reference)
    const pdfDir = path.join(__dirname, 'generated');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const pdfFileName = `eshram_${userId}_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Send email with PDF
    let emailSent = false;
    let emailError = null;
    try {
      await sendEShramEmail({
        toEmail: emailToUse,
        pdfBuffer,
        applicantName: form.name,
      });
      emailSent = true;
      console.log(`[Social Security] Email sent successfully to ${emailToUse}`);
    } catch (emailErr) {
      console.error('[Social Security] Error sending email:', emailErr);
      emailError = emailErr.message || 'Unknown error';
      // Continue even if email fails - PDF was generated
    }

    res.json({
      success: true,
      message: emailSent
        ? 'We\'ve emailed you a mock e-Shram registration and your benefits summary.'
        : `PDF generated successfully. ${emailError ? `Email sending failed: ${emailError}` : 'Email sent.'}`,
      pdfUrl: `/generated/${pdfFileName}`,
    });
  } catch (error) {
    console.error('[Social Security] Error in /api/social-security/submit:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Spend Verdict endpoint - Split-Second Spending Verdict
app.post('/api/spend-verdict', async (req, res) => {
  try {
    const { userId, amount, description, timeframeDays } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const timeframe = timeframeDays || 7;

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log(`[Spend Verdict] Getting verdict for user ${userId}, amount: ₹${amount}, timeframe: ${timeframe} days`);

    // Get forecast
    const forecast = await getQuickForecast(userId, timeframe);
    
    console.log(`[Spend Verdict] Forecast data:`, {
      projectedMinBalance: forecast.projectedMinBalance,
      dailyAvgExpenses: forecast.dailyAvgExpenses,
      currentBalance: forecast.currentBalance,
      riskLevel: forecast.riskLevel,
    });

    // Calculate buffer threshold (7 days of expenses)
    // Use minimum buffer only if there are actual expenses, otherwise use 0 for small purchases
    const calculatedBuffer = forecast.dailyAvgExpenses * 7;
    const buffer = calculatedBuffer > 0 ? Math.max(calculatedBuffer, 1000) : 0;
    const remainingAfterPurchase = forecast.projectedMinBalance - amount;

    // Determine verdict with smarter logic
    let verdict = 'NO';
    
    // ALWAYS allow very small amounts (≤ ₹100) regardless of balance
    // This handles edge cases like ₹10 for a cup of tea
    if (amount <= 100) {
      // For tiny amounts, always allow unless balance is severely negative
      if (forecast.projectedMinBalance < -1000) {
        verdict = 'DEFER';
      } else {
        verdict = 'YES';
      }
    }
    // Edge case: No transaction history (zero balance and no expenses)
    else if (forecast.projectedMinBalance === 0 && forecast.dailyAvgExpenses === 0) {
      // If no transaction history, be lenient with reasonable amounts
      if (amount <= 500) {
        verdict = 'YES';
      } else if (amount <= 2000) {
        verdict = 'DEFER';
      } else {
        verdict = 'NO';
      }
    }
    // Negative projected balance - be careful but allow small amounts
    else if (forecast.projectedMinBalance < 0) {
      // If balance is negative, only allow very small amounts
      if (amount <= 200) {
        verdict = 'DEFER'; // Can technically afford but risky
      } else {
        verdict = 'NO';
      }
    }
    // Positive balance - apply smart logic
    else {
      // For small amounts (₹100-500), allow if remaining balance stays positive
      if (amount <= 500) {
        if (remainingAfterPurchase >= 0) {
          verdict = 'YES';
        } else {
          // Would go negative, but it's a small amount - defer
          verdict = 'DEFER';
        }
      }
      // For medium amounts (₹500 - ₹2000), check remaining balance
      else if (amount <= 2000) {
        if (remainingAfterPurchase >= 0) {
          verdict = buffer > 0 && remainingAfterPurchase < buffer ? 'DEFER' : 'YES';
        } else {
          verdict = 'NO';
        }
      }
      // For larger amounts (₹2000+), check against buffer
      else {
        if (buffer === 0) {
          // No buffer calculated, just check if balance remains positive
          verdict = remainingAfterPurchase >= 0 ? 'YES' : 'NO';
        } else {
          // Check against buffer threshold
          if (remainingAfterPurchase >= buffer) {
            verdict = 'YES';
          } else if (remainingAfterPurchase >= 0 && remainingAfterPurchase >= buffer * 0.5) {
            verdict = 'DEFER';
          } else if (remainingAfterPurchase >= 0) {
            // Can afford but below buffer threshold
            verdict = 'DEFER';
          } else {
            verdict = 'NO';
          }
        }
      }
    }
    
    console.log(`[Spend Verdict] Calculated verdict: ${verdict}`, {
      amount,
      projectedMinBalance: forecast.projectedMinBalance,
      buffer,
      remainingAfterPurchase,
    });

    // Generate explanation using Gemini
    const prompt = `Given the verdict = ${verdict}, amount = ₹${amount.toLocaleString('en-IN')}, description = "${description || 'a purchase'}", buffer = ₹${buffer.toLocaleString('en-IN')}, projected minimum balance = ₹${forecast.projectedMinBalance.toLocaleString('en-IN')}, and remaining after purchase = ₹${remainingAfterPurchase.toLocaleString('en-IN')}, explain to a gig worker in India if they can safely afford this purchase and why. Be decisive and clear in 3-4 short sentences. Consider their emergency buffer and upcoming expenses.`;

    let explanation = '';
    try {
      const fetch = require('node-fetch');
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
      
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate explanation.';
      } else {
        explanation = `Based on your financial forecast, your projected minimum balance over the next ${timeframe} days is ₹${forecast.projectedMinBalance.toLocaleString('en-IN')}. After this purchase, you would have ₹${remainingAfterPurchase.toLocaleString('en-IN')} remaining, which ${remainingAfterPurchase >= buffer ? 'is sufficient' : 'may be insufficient'} to cover your emergency buffer of ₹${buffer.toLocaleString('en-IN')}.`;
      }
    } catch (error) {
      console.error('[Spend Verdict] Error generating explanation:', error);
      explanation = `Based on your financial forecast, your projected minimum balance over the next ${timeframe} days is ₹${forecast.projectedMinBalance.toLocaleString('en-IN')}. After this purchase, you would have ₹${remainingAfterPurchase.toLocaleString('en-IN')} remaining, which ${remainingAfterPurchase >= buffer ? 'is sufficient' : 'may be insufficient'} to cover your emergency buffer.`;
    }

    res.json({
      verdict,
      explanation,
      projectedMinBalance: forecast.projectedMinBalance,
      bufferAmount: buffer,
      riskLevel: forecast.riskLevel,
    });
  } catch (error) {
    console.error('[Spend Verdict] Error in /api/spend-verdict:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Test SMTP configuration endpoint (for debugging)
app.get('/api/test-smtp', async (req, res) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || '587';

    res.json({
      configured: !!(smtpUser && smtpPass),
      smtpHost,
      smtpPort,
      smtpUser: smtpUser ? `${smtpUser.substring(0, 3)}***@${smtpUser.split('@')[1] || 'unknown'}` : 'Not set',
      smtpPass: smtpPass ? '***' : 'Not set',
      message: smtpUser && smtpPass 
        ? 'SMTP credentials are configured' 
        : 'SMTP credentials are missing. Add SMTP_USER and SMTP_PASS to .env file',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`SMS Parser Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SMTP test: http://localhost:${PORT}/api/test-smtp`);
  
  // Log SMTP configuration status on startup
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    console.log(`[SMTP] ✅ Configuration found: ${smtpUser.substring(0, 3)}***@${smtpUser.split('@')[1] || 'unknown'}`);
  } else {
    console.warn('[SMTP] ⚠️  SMTP credentials not configured. Email sending will fail.');
    console.warn('[SMTP] Add SMTP_USER and SMTP_PASS to backend/.env file');
  }
});

