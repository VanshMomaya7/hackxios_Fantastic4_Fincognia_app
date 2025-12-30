/**
 * Biometric Authentication Utility
 * Handles fingerprint and passcode authentication
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform, Alert } from 'react-native';

// Lazy initialization of biometrics instance
let rnBiometricsInstance: ReactNativeBiometrics | null = null;

function getBiometricsInstance(): ReactNativeBiometrics | null {
  try {
    if (!rnBiometricsInstance) {
      // Check if ReactNativeBiometrics is available
      if (!ReactNativeBiometrics) {
        console.warn('[Biometric Auth] ReactNativeBiometrics is not available');
        return null;
      }
      rnBiometricsInstance = new ReactNativeBiometrics({ allowDeviceCredentials: true });
      
      // Verify the instance was created successfully
      if (!rnBiometricsInstance) {
        console.warn('[Biometric Auth] Failed to create biometrics instance');
        return null;
      }
    }
    return rnBiometricsInstance;
  } catch (error) {
    console.error('[Biometric Auth] Error initializing biometrics:', error);
    rnBiometricsInstance = null; // Reset on error
    return null;
  }
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  signature?: string; // For digital signature verification
}

/**
 * Request biometric authentication (fingerprint/face ID) with fallback to device passcode
 */
export async function requestBiometricAuth(reason: string = 'Verify your identity'): Promise<BiometricAuthResult> {
  try {
    const rnBiometrics = getBiometricsInstance();
    if (!rnBiometrics) {
      console.warn('[Biometric Auth] Biometrics not available, using passcode fallback');
      return requestPasscodeAuth(reason);
    }

    // Check if biometric hardware is available
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    
    if (!available) {
      // No biometric hardware, request device passcode instead
      return requestPasscodeAuth(reason);
    }

    console.log('[Biometric Auth] Biometric type available:', biometryType);

    // Create a prompt message based on biometry type
    let promptMessage = reason;
    if (biometryType === ReactNativeBiometrics.FaceID) {
      promptMessage = 'Use Face ID to verify your identity';
    } else if (biometryType === ReactNativeBiometrics.TouchID) {
      promptMessage = 'Use Touch ID to verify your identity';
    } else if (biometryType === ReactNativeBiometrics.Biometrics) {
      promptMessage = 'Use fingerprint to verify your identity';
    }

    // Request biometric authentication
    const { success, error, signature } = await rnBiometrics.simplePrompt({
      promptMessage: promptMessage,
      fallbackPromptMessage: 'Use device passcode',
      cancelButtonText: 'Cancel',
    });

    if (success) {
      console.log('[Biometric Auth] Authentication successful');
      return {
        success: true,
        signature: signature || 'verified',
      };
    } else {
      console.log('[Biometric Auth] Authentication failed:', error);
      
      // If user cancelled, don't show error
      if (error?.includes('User cancellation') || error?.includes('userCancel')) {
        return {
          success: false,
          error: 'Authentication cancelled',
        };
      }
      
      // For other errors, fallback to passcode
      console.log('[Biometric Auth] Falling back to passcode authentication');
      return requestPasscodeAuth(reason);
    }
  } catch (error: any) {
    console.error('[Biometric Auth] Error:', error);
    
    // Fallback to passcode on any error
    return requestPasscodeAuth(reason);
  }
}

/**
 * Request device passcode authentication (fallback method)
 */
export async function requestPasscodeAuth(reason: string = 'Enter your device passcode'): Promise<BiometricAuthResult> {
  try {
    const rnBiometrics = getBiometricsInstance();
    if (!rnBiometrics) {
      console.error('[Passcode Auth] Biometrics instance is null');
      return {
        success: false,
        error: 'Authentication service not available. Please ensure biometric authentication is enabled on your device.',
      };
    }

    // Create a biometric prompt that allows device credentials (passcode)
    const { success, error, signature } = await rnBiometrics.simplePrompt({
      promptMessage: reason,
      fallbackPromptMessage: 'Enter device passcode',
      cancelButtonText: 'Cancel',
    });

    if (success) {
      console.log('[Passcode Auth] Authentication successful');
      return {
        success: true,
        signature: signature || 'verified_passcode',
      };
    } else {
      console.log('[Passcode Auth] Authentication failed:', error);
      return {
        success: false,
        error: error || 'Authentication failed',
      };
    }
  } catch (error: any) {
    console.error('[Passcode Auth] Error:', error);
    return {
      success: false,
      error: error?.message || 'Authentication error occurred',
    };
  }
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  biometryType: string | null;
}> {
  try {
    const rnBiometrics = getBiometricsInstance();
    if (!rnBiometrics) {
      return {
        available: false,
        biometryType: null,
      };
    }

    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return {
      available,
      biometryType: biometryType || null,
    };
  } catch (error) {
    console.error('[Biometric Auth] Error checking availability:', error);
    return {
      available: false,
      biometryType: null,
    };
  }
}

