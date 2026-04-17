/**
 * Policy Application Form Types
 */

export type PolicyType = 'bike' | 'health' | 'accident' | 'income';

export interface PolicyFormData {
  // Personal Information (7 fields)
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other' | '';
  email: string;
  phoneNumber: string;
  alternatePhone: string;
  aadhaarNumber: string;
  
  // Address Information (5 fields)
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
  permanentAddressSame: boolean;
  
  // Policy-Specific Fields (varies by type, ~5-8 fields)
  // Bike Insurance
  bikeMake?: string;
  bikeModel?: string;
  registrationNumber?: string;
  yearOfManufacture?: string;
  engineCC?: string;
  
  // Health Insurance
  height?: string; // cm
  weight?: string; // kg
  bloodGroup?: string;
  preExistingConditions?: string;
  anyExistingHealthInsurance?: boolean;
  existingPolicyNumber?: string;
  
  // Accident Insurance
  occupation?: string;
  employmentType?: string;
  preferredCoverageAmount?: string;
  
  // Income Protection
  monthlyIncome?: string;
  occupationDetails?: string;
  disabilityHistory?: string;
  
  // Nominee Information (5 fields)
  nomineeName: string;
  nomineeRelationship: string;
  nomineeDateOfBirth: string;
  nomineePhoneNumber: string;
  nomineeAddress: string;
  
  // Payment Information (3 fields)
  paymentMethod: 'UPI' | 'Card' | 'Net Banking' | 'Bank Transfer' | '';
  bankAccountNumber?: string;
  ifscCode?: string;
  
  // Declaration (2 fields)
  declarationConsent: boolean;
  medicalDisclosureConsent: boolean;
  
  // Additional Details (2 fields)
  howDidYouHear: string;
  additionalNotes: string;
}

export interface AutoFillResult {
  formData: Partial<PolicyFormData>;
  filledFields: string[];
  generatedFields: string[];
  confidence: number;
}

