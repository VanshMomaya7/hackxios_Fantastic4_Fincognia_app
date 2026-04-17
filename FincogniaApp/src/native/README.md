# Native Modules

## SMS Module

The SMS module allows the app to read SMS messages for transaction ingestion.

### Android Implementation Required

Create the native module in:
`android/app/src/main/java/com/fincogniaapp/SmsModule.kt`

### Required Methods

1. `requestPermission()` - Request READ_SMS permission
2. `hasPermission()` - Check if permission is granted
3. `readSms(limit)` - Read SMS messages (optionally limited)
4. `getSmsFromSender(sender, limit)` - Filter SMS by sender

### Usage

```typescript
import SmsModule from '../native/SmsModule';

// Request permission
const hasPermission = await SmsModule.requestPermission();

// Read SMS
const messages = await SmsModule.readSms(100);

// Filter by sender (e.g., bank/UPI)
const bankMessages = await SmsModule.getSmsFromSender('BANK-NAME', 50);
```

### Security Notes

- User must explicitly opt-in to SMS reading
- Only whitelisted senders should be processed
- SMS data should be sent to backend for parsing, not stored locally
- Follow Android's privacy guidelines for SMS access


