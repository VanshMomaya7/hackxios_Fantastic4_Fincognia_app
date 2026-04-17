# SMS Parser Backend

Backend service for parsing financial SMS messages using Google Gemini API.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Create a `.env` file in the `backend/` directory with:
     ```
     GEMINI_API_KEY=AIzaSyBxGdu4KE2_AHIiy4pCY-VDlWMBynvAdPk
     PORT=3000
     ```
   - The `.env` file is gitignored for security

3. **Run the server:**
   ```bash
   npm start
   ```

   Server will start on `http://localhost:3000`

## API Endpoints

### POST /api/parse-sms-batch

Parse a batch of SMS messages using Gemini API.

**Request:**
```json
{
  "userId": "user123",
  "messages": [
    {
      "id": "msg1",
      "sender": "VK-HDFCBK",
      "body": "Rs. 500 debited from A/c XX1234 on 27-Nov",
      "receivedAt": 1701100800000
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "msg1",
      "isFinancial": true,
      "channel": "bank_transfer",
      "direction": "debit",
      "amount": 500,
      "currency": "INR",
      "counterpartyName": null,
      "counterpartyHandle": null,
      "bank": "HDFC",
      "accountType": "savings",
      "timestampHint": "2024-11-27T00:00:00Z",
      "category": "other",
      "narration": "Debit from account",
      "confidence": 0.9,
      "shouldSkip": false
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "sms-parser"
}
```

## Notes

- The server uses Gemini 1.5 Flash model for fast parsing
- Each message is parsed individually for reliability
- Failed parses return safe defaults with `shouldSkip: true`
- API key is stored in `.env` and never exposed to frontend

