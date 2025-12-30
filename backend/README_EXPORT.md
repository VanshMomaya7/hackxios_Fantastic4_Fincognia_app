# Transaction Export to CSV

This script exports transaction data from Firebase Firestore to CSV format for model training.

## Quick Start

### Export All Transactions

```bash
node exportTransactionsToCSV.js
```

This will:
- Fetch all transactions from Firestore
- Convert them to CSV format
- Save to `backend/exports/transactions_export_YYYY-MM-DD_timestamp.csv`

## CSV Format

The exported CSV includes the following columns:

| Column | Description |
|--------|-------------|
| Transaction ID | Unique transaction identifier |
| User ID | User who made the transaction |
| Date | Transaction date (YYYY-MM-DD) |
| Timestamp | Unix timestamp |
| Account Number | Bank account number |
| Amount | Transaction amount |
| Type (Credit/Debit) | Transaction type |
| Merchant/Receiver | Merchant or receiver name |
| UPI ID | UPI ID of receiver (if applicable) |
| Category | Transaction category |
| Source | Source of transaction (sms/email/manual) |
| Is Recurring | Whether transaction is recurring |
| Created At | When record was created |
| Updated At | When record was last updated |

## Output

The script will:
1. Create an `exports/` directory if it doesn't exist
2. Generate a CSV file with timestamp: `transactions_export_YYYY-MM-DD_timestamp.csv`
3. Display summary statistics:
   - Total transactions
   - Credit vs Debit count
   - Total amount
   - Unique users

## Example Output

```
Starting transaction export...
Fetching transactions from Firestore...
Found 150 transactions.
Converting to CSV format...
Writing to file: D:\Fincognia-Mum\backend\exports\transactions_export_2025-12-29_1735487595000.csv
✅ Export completed successfully!
📁 File saved to: D:\Fincognia-Mum\backend\exports\transactions_export_2025-12-29_1735487595000.csv
📊 Total transactions exported: 150

📈 Summary:
   - Credit transactions: 45
   - Debit transactions: 105
   - Total amount: ₹125,450.00
   - Unique users: 12
```

## Requirements

- Node.js installed
- Firebase Admin SDK configured (`config/firebase-service-account.json`)
- `.env` file with proper configuration

## Troubleshooting

### "Firestore is not initialized"
- Check that `config/firebase-service-account.json` exists
- Verify Firebase Admin SDK is properly configured in `config/firebaseAdmin.js`

### "No transactions found"
- Verify that transactions exist in your Firestore database
- Check that the collection name is `transactions`

## Using the CSV for Model Training

The exported CSV can be used for:
- Training ML models for transaction categorization
- Analyzing spending patterns
- Building recommendation systems
- Fraud detection models
- Budget forecasting

## Data Privacy

⚠️ **Important**: The exported CSV contains sensitive financial data. Always:
- Store CSV files securely
- Don't commit CSV files to version control (already in `.gitignore`)
- Anonymize data before sharing
- Follow data protection regulations (GDPR, etc.)
