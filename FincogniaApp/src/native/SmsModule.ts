/**
 * SMS Native Module
 * Bridge for Android SMS reading functionality
 */

import { NativeModules, Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';

interface SmsModuleInterface {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  readSms(limit: number, sender?: string | null): Promise<SmsMessage[]>;
  getSmsFromSender(sender: string, limit: number): Promise<SmsMessage[]>;
}

export interface SmsMessage {
  id: string;
  address: string; // Sender phone number
  body: string; // Message content
  date: number; // Timestamp (milliseconds)
  dateSent?: number;
}

const { SmsModule: NativeSmsModule } = NativeModules;

// Debug: Log available native modules
if (__DEV__) {
  console.log('[SmsModule] Available native modules:', Object.keys(NativeModules));
  console.log('[SmsModule] NativeSmsModule exists:', !!NativeSmsModule);
  if (NativeSmsModule) {
    console.log('[SmsModule] NativeSmsModule methods:', Object.keys(NativeSmsModule));
  }
}

// React Native bridge implementation
const SmsModule: SmsModuleInterface = {
  /**
   * Request SMS permission using React Native PermissionsAndroid
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('SMS module is only available on Android');
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'PaisaBuddy needs access to read SMS to track your transactions',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      return false;
    }
  },

  /**
   * Check if SMS permission is granted
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!NativeSmsModule) {
      return false;
    }

    try {
      return await NativeSmsModule.hasPermission();
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      return false;
    }
  },

  /**
   * Read SMS messages
   */
  async readSms(limit: number = 100, sender: string | null = null): Promise<SmsMessage[]> {
    if (Platform.OS !== 'android') {
      console.warn('[SmsModule] SMS module is only available on Android');
      return [];
    }

    if (!NativeSmsModule) {
      console.error('[SmsModule] Native module not found! Available modules:', Object.keys(NativeModules));
      console.error('[SmsModule] You need to rebuild the app after adding native modules.');
      console.error('[SmsModule] Run: cd android && ./gradlew clean && cd .. && npm run android');
      return [];
    }

    try {
      console.log(`[SmsModule] Calling native readSms with limit=${limit}, sender=${sender || 'null'}`);
      const messages = await NativeSmsModule.readSms(limit, sender);
      console.log(`[SmsModule] Native module returned ${messages?.length || 0} messages`);
      
      if (!messages) {
        console.warn('[SmsModule] Native module returned null/undefined');
        return [];
      }
      
      if (messages.length === 0) {
        console.warn('[SmsModule] Native module returned empty array');
        return [];
      }
      
      // Convert to proper format
      const formatted = messages.map((msg: any, index: number) => {
        // Kotlin returns date in milliseconds, ensure it's a number
        let date = Date.now();
        if (msg.date !== undefined && msg.date !== null) {
          date = typeof msg.date === 'number' ? msg.date : parseInt(String(msg.date)) || Date.now();
        }
        
        const formattedMsg = {
          id: String(msg.id || `msg_${index}`),
          address: String(msg.address || ''),
          body: String(msg.body || ''),
          date: date,
          dateSent: msg.dateSent ? (typeof msg.dateSent === 'number' ? msg.dateSent : parseInt(String(msg.dateSent))) : undefined,
        };
        
        if (index < 3) {
          console.log(`[SmsModule] Message ${index + 1}:`, {
            id: formattedMsg.id,
            address: formattedMsg.address,
            bodyPreview: formattedMsg.body.substring(0, 50),
            date: new Date(formattedMsg.date).toISOString(),
          });
        }
        
        return formattedMsg;
      });
      
      console.log(`[SmsModule] Formatted ${formatted.length} messages successfully`);
      return formatted;
    } catch (error: any) {
      console.error('[SmsModule] Error reading SMS:', error);
      console.error('[SmsModule] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      return [];
    }
  },

  /**
   * Get SMS from specific sender
   */
  async getSmsFromSender(sender: string, limit: number = 50): Promise<SmsMessage[]> {
    return this.readSms(limit, sender);
  },
};

export default SmsModule;

