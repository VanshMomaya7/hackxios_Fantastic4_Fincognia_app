/**
 * SMS Ingestion Service
 * Handles reading SMS and converting to transactions
 */

import SmsModule, { type SmsMessage } from '../native/SmsModule';
import { useAuthStore } from '../store/useAuthStore';
import { saveRawMessage, saveTransaction, linkRawMessageToTransaction } from './dataIngestionService';
import { parseSmsBatchWithLLM, type LlmParsedSms } from './llmSmsParserService';

// Common bank/UPI sender patterns (Indian context)
const BANK_SENDER_PATTERNS = [
  'VK-', // Various banks
  'AX-', // Axis Bank
  'HDFC',
  'ICICI',
  'SBI',
  'PNB',
  'UPI',
  'PAYTM',
  'GPay',
  'PhonePe',
  'BHIM',
  'RZPAY',
  'AMAZON',
  'FLIPKART',
];

/**
 * Check if SMS is from a bank/UPI sender
 * Made more lenient for testing - will catch more messages
 */
function isBankMessage(sender: string, body: string): boolean {
  if (!body || body.trim().length < 5) {
    return false; // Too short to be a transaction message
  }

  const upperSender = sender.toUpperCase();
  const upperBody = body.toUpperCase();

  // Check sender patterns
  for (const pattern of BANK_SENDER_PATTERNS) {
    if (upperSender.includes(pattern) || upperBody.includes(pattern)) {
      console.log(`    ✓ Matched sender pattern: ${pattern}`);
      return true;
    }
  }

  // Check for common transaction keywords
  const transactionKeywords = [
    'DEBITED',
    'CREDITED',
    'PAID',
    'RECEIVED',
    'BALANCE',
    'TRANSACTION',
    'RS.',
    'INR',
    '₹',
    'ACCOUNT',
    'AMOUNT',
    'TRANSFER',
    'WITHDRAWAL',
    'DEPOSIT',
    'PURCHASE',
    'PAYMENT',
  ];

  const hasKeyword = transactionKeywords.some((keyword) => {
    if (upperBody.includes(keyword)) {
      console.log(`    ✓ Matched keyword: ${keyword}`);
      return true;
    }
    return false;
  });
  
  // More flexible amount detection
  // Pattern 1: Currency symbol followed by numbers
  const pattern1 = /(?:RS\.?|INR|₹|RUPEES?)\s*[\d,]+\.?\d*/i.test(body);
  // Pattern 2: Numbers followed by currency
  const pattern2 = /\d+[\d,]*\.?\d*\s*(?:RS\.?|INR|₹)/i.test(body);
  // Pattern 3: Just numbers (if message is long enough and has keywords)
  const pattern3 = /[\d,]+\.?\d*/.test(body) && body.length > 20;

  const hasAmount = pattern1 || pattern2 || (pattern3 && hasKeyword);

  if (hasAmount) {
    console.log(`    ✓ Has amount pattern`);
  }

  // More lenient: If it has keywords OR has amount pattern
  const result = hasKeyword || hasAmount;
  
  if (!result) {
    console.log(`    ✗ Not a bank message (no keywords or amount pattern)`);
  }
  
  return result;
}

/**
 * Parse amount from SMS body
 * Returns positive for credit, negative for debit
 * More flexible parsing for various formats
 */
function parseAmount(body: string): { amount: number; type: 'credit' | 'debit' } | null {
  if (!body || body.trim().length === 0) {
    return null;
  }

  let amount: number | null = null;
  let matchedPattern: string | null = null;

  // Define all patterns to try, in order of specificity
  const amountPatterns = [
    // Pattern 1: "debited by X" or "credited by X" (most specific)
    {
      regex: /\bdebited\s+by\s+([\d,]+(?:\.\d+)?)/i,
      name: 'debited-by',
    },
    {
      regex: /\bcredited\s+by\s+([\d,]+(?:\.\d+)?)/i,
      name: 'credited-by',
    },
    // Pattern 2: Currency symbol followed by numbers (Rs. 1000, ₹500, INR 2000)
    {
      regex: /(?:RS\.?|INR|₹|RUPEES?)\s*([\d,]+(?:\.\d+)?)/i,
      name: 'currency-prefix',
    },
    // Pattern 3: Numbers followed by currency (1000 Rs, 500 INR)
    {
      regex: /([\d,]+(?:\.\d+)?)\s*(?:RS\.?|INR|₹|RUPEES?)/i,
      name: 'currency-suffix',
    },
  ];

  // Try each pattern in order
  for (const pattern of amountPatterns) {
    const match = body.match(pattern.regex);
    if (match && match[1]) {
      // Extract the amount from the captured group
      const amountStr = match[1].replace(/,/g, '');
      const parsedAmount = parseFloat(amountStr);
      
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
        matchedPattern = pattern.name;
        
        // Debug log for debited-by pattern
        if (pattern.name === 'debited-by') {
          console.log(`    [SMS AMOUNT] matched debited-by pattern`);
        }
        
        break; // Found a valid amount, stop trying patterns
      }
    }
  }

  // Pattern 4: Fallback - Just numbers (if message has transaction keywords)
  if (amount === null) {
    const upperBody = body.toUpperCase();
    if (upperBody.includes('DEBITED') || upperBody.includes('CREDITED') || 
        upperBody.includes('PAID') || upperBody.includes('RECEIVED')) {
      // Extract all numbers
      const numberMatches = body.match(/[\d,]+(?:\.\d+)?/g);
      if (numberMatches && numberMatches.length > 0) {
        // Get the largest number (usually the transaction amount)
        const numbers = numberMatches
          .map(m => parseFloat(m.replace(/,/g, '')))
          .filter(n => !isNaN(n) && n > 0);
        
        if (numbers.length > 0) {
          const maxAmount = Math.max(...numbers);
          // If amount is reasonable (between 1 and 1 crore)
          if (maxAmount >= 1 && maxAmount <= 10000000) {
            amount = maxAmount;
            matchedPattern = 'fallback-largest';
          }
        }
      }
    }
  }

  if (amount === null) {
    console.log(`    ✗ No amount pattern found in: ${body.substring(0, 50)}`);
    return null;
  }

  // Determine type from keywords
  const upperBody = body.toUpperCase();
  const isCredit =
    upperBody.includes('CREDITED') ||
    upperBody.includes('RECEIVED') ||
    upperBody.includes('DEPOSIT') ||
    upperBody.includes('CREDIT');

  const result = {
    amount: isCredit ? amount : -amount,
    type: isCredit ? 'credit' : 'debit',
  };

  console.log(`    ✓ Amount parsed: ${result.amount} (${result.type}) [pattern: ${matchedPattern}]`);
  return result;
}

/**
 * Extract merchant/description from SMS
 */
function extractMerchant(body: string): string | null {
  // Try to extract merchant name
  // Common patterns: "to MERCHANT NAME", "from MERCHANT", etc.
  const toPattern = /(?:to|at)\s+([A-Z][A-Z\s]+?)(?:\s|$|\.|,)/i;
  const fromPattern = /(?:from)\s+([A-Z][A-Z\s]+?)(?:\s|$|\.|,)/i;

  const toMatch = body.match(toPattern);
  if (toMatch && toMatch[1]) {
    return toMatch[1].trim();
  }

  const fromMatch = body.match(fromPattern);
  if (fromMatch && fromMatch[1]) {
    return fromMatch[1].trim();
  }

  return null;
}

/**
 * Extract category from SMS (basic heuristics)
 */
function extractCategory(body: string, merchant: string | null): string {
  const upperBody = body.toUpperCase();
  const upperMerchant = merchant?.toUpperCase() || '';

  // Category detection based on keywords
  if (upperBody.includes('GROCERY') || upperBody.includes('FOOD') || upperMerchant.includes('FOOD')) {
    return 'food';
  }
  if (upperBody.includes('FUEL') || upperBody.includes('PETROL') || upperBody.includes('TAXI') || upperBody.includes('UBER') || upperBody.includes('OLA')) {
    return 'transport';
  }
  if (upperBody.includes('BILL') || upperBody.includes('ELECTRICITY') || upperBody.includes('WATER') || upperBody.includes('RENT')) {
    return 'bills';
  }
  if (upperBody.includes('SALARY') || upperBody.includes('CREDITED') || upperBody.includes('DEPOSIT')) {
    return 'income';
  }

  return 'other';
}

/**
 * Read and ingest SMS messages
 */
export async function ingestSmsMessages(limit: number = 100): Promise<{
  processed: number;
  saved: number;
  errors: number;
}> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check permission
  const hasPermission = await SmsModule.hasPermission();
  if (!hasPermission) {
    const granted = await SmsModule.requestPermission();
    if (!granted) {
      throw new Error('SMS permission not granted');
    }
  }

  // Read SMS messages
  console.log('Reading SMS messages...');
  const messages = await SmsModule.readSms(limit);
  console.log(`Found ${messages.length} SMS messages`);

  if (messages.length === 0) {
    console.warn('No SMS messages found. Check if device has SMS messages.');
    return { processed: 0, saved: 0, errors: 0 };
  }

  // Log first few messages for debugging
  console.log('Sample SMS messages:');
  messages.slice(0, 3).forEach((msg, idx) => {
    console.log(`Message ${idx + 1}:`);
    console.log(`  From: ${msg.address}`);
    console.log(`  Body: ${msg.body.substring(0, 100)}...`);
    console.log(`  Date: ${new Date(msg.date).toISOString()}`);
  });

  // Step 1: Filter to bank/UPI messages (candidates for LLM parsing)
  const candidateMessages: SmsMessage[] = [];
  for (const message of messages) {
    const isBank = isBankMessage(message.address, message.body);
    if (isBank) {
      candidateMessages.push(message);
    }
  }

  console.log(`\n[Step 1] Filtered ${candidateMessages.length} bank/UPI messages from ${messages.length} total`);

  if (candidateMessages.length === 0) {
    console.log('No financial messages found. Import complete.');
    return { processed: 0, saved: 0, errors: 0 };
  }

  // Step 2: Call LLM parser for batch
  console.log(`[Step 2] Sending ${candidateMessages.length} messages to LLM parser...`);
  const llmBatch = candidateMessages.map((msg) => ({
    id: msg.id || `${msg.address}-${msg.date}`,
    sender: msg.address,
    body: msg.body,
    receivedAt: msg.date,
  }));

  let llmResults: LlmParsedSms[] = [];
  try {
    llmResults = await parseSmsBatchWithLLM({
      userId,
      messages: llmBatch,
    });
    console.log(`[Step 2] LLM parser returned ${llmResults.length} results`);
  } catch (error) {
    console.error('[Step 2] LLM parsing failed, falling back to regex only:', error);
  }

  // Create a map for quick lookup: message id -> LLM result
  const llmById = new Map<string, LlmParsedSms>();
  for (const result of llmResults) {
    llmById.set(result.id, result);
  }

  // Step 3: Process each candidate message, merging regex + LLM
  let processed = 0;
  let saved = 0;
  let errors = 0;
  let noAmount = 0;
  let skippedByLLM = 0;
  let merchantFromLLM = 0;
  let merchantFromFallback = 0;

  for (const message of candidateMessages) {
    try {
      const messageId = message.id || `${message.address}-${message.date}`;
      const llm = llmById.get(messageId);

      console.log(`\n[${processed + 1}/${candidateMessages.length}] Processing SMS:`);
      console.log(`  From: ${message.address}`);
      console.log(`  Body: ${message.body.substring(0, 80)}...`);
      if (llm) {
        console.log(`  LLM: ${llm.isFinancial ? 'Financial' : 'Non-financial'}, confidence: ${llm.confidence}`);
      }

      // Check if LLM says to skip
      if (llm?.shouldSkip) {
        skippedByLLM++;
        console.log(`  → Skipped: LLM marked as shouldSkip`);
        continue;
      }

      // Parse amount using regex (primary) or LLM (fallback)
      const amountDataRegex = parseAmount(message.body);
      const amountLLM = llm?.amount ?? null;
      const directionLLM = llm?.direction;

      let amount: number | null = null;
      let direction: 'credit' | 'debit' = 'debit';

      if (amountDataRegex) {
        amount = amountDataRegex.amount;
        direction = amountDataRegex.type;
        console.log(`  Amount (regex): ${amount} (${direction})`);
      } else if (amountLLM !== null) {
        // Use LLM amount, but need to determine direction
        amount = Math.abs(amountLLM);
        if (directionLLM === 'credit') {
          direction = 'credit';
          amount = amount; // positive for credit
        } else if (directionLLM === 'debit') {
          direction = 'debit';
          amount = -amount; // negative for debit
        } else {
          // Unknown direction, default to debit (negative)
          direction = 'debit';
          amount = -amount;
        }
        console.log(`  Amount (LLM): ${amount} (${direction})`);
      }

      // Validate: must have amount and valid direction
      if (!amount || direction === 'unknown') {
        noAmount++;
        console.log(`  → Skipped: No valid amount or direction`);
        continue;
      }

      processed++;

      // Determine merchant: LLM first, then fallback
      let merchant: string | null = null;
      if (llm?.counterpartyName?.trim()) {
        merchant = llm.counterpartyName.trim();
        merchantFromLLM++;
        console.log(`  Merchant (LLM counterpartyName): ${merchant}`);
      } else if (llm?.counterpartyHandle?.trim()) {
        merchant = llm.counterpartyHandle.trim();
        merchantFromLLM++;
        console.log(`  Merchant (LLM counterpartyHandle): ${merchant}`);
      } else if (llm?.bank?.trim()) {
        merchant = llm.bank.trim();
        merchantFromLLM++;
        console.log(`  Merchant (LLM bank): ${merchant}`);
      } else {
        // Fallback to regex extraction
        merchant = extractMerchant(message.body) || 'Other';
        merchantFromFallback++;
        console.log(`  Merchant (fallback): ${merchant}`);
      }

      // Determine category: LLM first, then fallback
      let category = llm?.category || extractCategory(message.body, merchant);
      if (category === 'unknown') {
        category = 'other';
      }
      console.log(`  Category: ${category}`);

      // Save raw message
      const rawMessageId = await saveRawMessage({
        userId,
        sender: message.address,
        body: message.body,
        receivedAt: message.date,
        source: 'sms',
        parsedTransactionId: null,
      });

      // Save transaction
      const transactionId = await saveTransaction({
        userId,
        timestamp: message.date,
        amount,
        type: direction,
        merchant,
        category,
        source: 'sms',
        rawMessageId,
        isRecurring: false,
        account: null,
      });

      // Link raw message to transaction
      await linkRawMessageToTransaction(rawMessageId, transactionId);

      saved++;
      console.log(`    ✓ Successfully saved transaction: ${transactionId}`);
    } catch (error) {
      console.error('    ✗ Error processing SMS message:', error);
      errors++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Total SMS read: ${messages.length}`);
  console.log(`Bank/UPI messages found: ${candidateMessages.length}`);
  console.log(`LLM results received: ${llmResults.length}`);
  console.log(`Processed (with amount): ${processed}`);
  console.log(`Saved to Firestore: ${saved}`);
  console.log(`Skipped (no amount): ${noAmount}`);
  console.log(`Skipped (by LLM): ${skippedByLLM}`);
  console.log(`Merchant from LLM: ${merchantFromLLM}`);
  console.log(`Merchant from fallback: ${merchantFromFallback}`);
  console.log(`Errors: ${errors}`);
  console.log(`=====================\n`);

  return { processed, saved, errors };
}

/**
 * Read SMS from specific sender (e.g., specific bank)
 */
export async function ingestSmsFromSender(
  sender: string,
  limit: number = 50
): Promise<{
  processed: number;
  saved: number;
  errors: number;
}> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check permission
  const hasPermission = await SmsModule.hasPermission();
  if (!hasPermission) {
    const granted = await SmsModule.requestPermission();
    if (!granted) {
      throw new Error('SMS permission not granted');
    }
  }

  // Read SMS from sender
  const messages = await SmsModule.getSmsFromSender(sender, limit);

  if (messages.length === 0) {
    return { processed: 0, saved: 0, errors: 0 };
  }

  // Filter to bank/UPI messages
  const candidateMessages = messages.filter((msg) =>
    isBankMessage(msg.address, msg.body)
  );

  if (candidateMessages.length === 0) {
    return { processed: 0, saved: 0, errors: 0 };
  }

  // Call LLM parser
  const llmBatch = candidateMessages.map((msg) => ({
    id: msg.id || `${msg.address}-${msg.date}`,
    sender: msg.address,
    body: msg.body,
    receivedAt: msg.date,
  }));

  let llmResults: LlmParsedSms[] = [];
  try {
    llmResults = await parseSmsBatchWithLLM({
      userId,
      messages: llmBatch,
    });
  } catch (error) {
    console.error('LLM parsing failed, falling back to regex only:', error);
  }

  const llmById = new Map<string, LlmParsedSms>();
  for (const result of llmResults) {
    llmById.set(result.id, result);
  }

  let processed = 0;
  let saved = 0;
  let errors = 0;

  for (const message of candidateMessages) {
    try {
      const messageId = message.id || `${message.address}-${message.date}`;
      const llm = llmById.get(messageId);

      if (llm?.shouldSkip) {
        continue;
      }

      // Parse amount
      const amountDataRegex = parseAmount(message.body);
      const amountLLM = llm?.amount ?? null;
      const directionLLM = llm?.direction;

      let amount: number | null = null;
      let direction: 'credit' | 'debit' = 'debit';

      if (amountDataRegex) {
        amount = amountDataRegex.amount;
        direction = amountDataRegex.type;
      } else if (amountLLM !== null) {
        amount = Math.abs(amountLLM);
        if (directionLLM === 'credit') {
          direction = 'credit';
          amount = amount;
        } else if (directionLLM === 'debit') {
          direction = 'debit';
          amount = -amount;
        } else {
          direction = 'debit';
          amount = -amount;
        }
      }

      if (!amount || direction === 'unknown') {
        continue;
      }

      processed++;

      // Determine merchant
      let merchant: string | null = null;
      if (llm?.counterpartyName?.trim()) {
        merchant = llm.counterpartyName.trim();
      } else if (llm?.counterpartyHandle?.trim()) {
        merchant = llm.counterpartyHandle.trim();
      } else if (llm?.bank?.trim()) {
        merchant = llm.bank.trim();
      } else {
        merchant = extractMerchant(message.body) || 'Other';
      }

      // Determine category
      let category = llm?.category || extractCategory(message.body, merchant);
      if (category === 'unknown') {
        category = 'other';
      }

      // Save raw message
      const rawMessageId = await saveRawMessage({
        userId,
        sender: message.address,
        body: message.body,
        receivedAt: message.date,
        source: 'sms',
        parsedTransactionId: null,
      });

      // Save transaction
      const transactionId = await saveTransaction({
        userId,
        timestamp: message.date,
        amount,
        type: direction,
        merchant,
        category,
        source: 'sms',
        rawMessageId,
        isRecurring: false,
        account: null,
      });

      // Link raw message to transaction
      await linkRawMessageToTransaction(rawMessageId, transactionId);

      saved++;
    } catch (error) {
      console.error('Error processing SMS message:', error);
      errors++;
    }
  }

  return { processed, saved, errors };
}

