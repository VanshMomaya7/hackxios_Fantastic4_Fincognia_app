/**
 * Environment Configuration
 * Centralized config for API endpoints and environment variables
 */

// Backend API base URL
// IMPORTANT: For physical Android device, replace with your computer's IP address
// To find your IP:
//   Windows: ipconfig (look for IPv4 Address, usually 192.168.x.x)
//   Mac/Linux: ifconfig or ip addr (look for inet, usually 192.168.x.x)
// 
// Examples:
//   Android Emulator: 'http://10.0.2.2:3000'
//   Physical Device: 'http://192.168.1.100:3000' (replace with your actual IP)
//   Production: 'https://your-backend-url.com'

// PC connected to Android hotspot
// Current IP: 10.57.208.145
// ⚠️ IMPORTANT: If you can't connect, check:
// 1. Run 'ipconfig' on PC to verify this is the hotspot adapter IP
// 2. Test from device browser: http://10.57.208.145:3000/health
// 3. If hotspot uses different range (e.g., 192.168.43.x), update below
const PHYSICAL_DEVICE_IP = '10.57.208.145'; // PC's IP on Android hotspot network

export const BACKEND_BASE_URL = __DEV__
  ? `http://${PHYSICAL_DEVICE_IP}:3000` // Physical device - UPDATE IP ABOVE!
  : 'https://your-backend-url.com'; // Production

// API endpoints
export const API_ENDPOINTS = {
  parseSmsBatch: `${BACKEND_BASE_URL}/api/parse-sms-batch`,
  analyzeDocument: `${BACKEND_BASE_URL}/api/analyze-document`,
  comparePolicies: `${BACKEND_BASE_URL}/api/compare-policies`, // Deprecated, kept for backward compatibility
  policyAdvisor: `${BACKEND_BASE_URL}/api/policy-advisor`,
  autoFillForm: `${BACKEND_BASE_URL}/api/auto-fill-form`,
  submitPolicyApplication: `${BACKEND_BASE_URL}/api/submit-policy-application`,
  generateItr: `${BACKEND_BASE_URL}/api/itr/generate`,
  agentQuery: `${BACKEND_BASE_URL}/api/agent/query`,
  adaptiveBudget: `${BACKEND_BASE_URL}/api/budget/adaptive`,
  budgetPlanner: `${BACKEND_BASE_URL}/api/budget/planner`,
  budgetPlannerPDF: `${BACKEND_BASE_URL}/api/budget/planner/pdf`,
  socialSecurityPrefill: `${BACKEND_BASE_URL}/api/social-security/prefill`,
  socialSecuritySubmit: `${BACKEND_BASE_URL}/api/social-security/submit`,
  spendVerdict: `${BACKEND_BASE_URL}/api/spend-verdict`,
  health: `${BACKEND_BASE_URL}/health`,
};

