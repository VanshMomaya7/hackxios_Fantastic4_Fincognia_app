/**
 * Export Transactions from Firestore to CSV
 * This script fetches all transaction data from Firebase Firestore and exports it to a CSV file
 * for model training purposes.
 */

require('dotenv').config();
const { firestore } = require('./config/firebaseAdmin');
const fs = require('fs');
const path = require('path');

/**
 * Convert transaction data to CSV format
 */
function convertToCSV(transactions) {
    // CSV Headers
    const headers = [
        'Transaction ID',
        'User ID',
        'Date',
        'Timestamp',
        'Account Number',
        'Amount',
        'Type (Credit/Debit)',
        'Merchant/Receiver',
        'UPI ID',
        'Category',
        'Source',
        'Is Recurring',
        'Created At',
        'Updated At'
    ];

    // Create CSV rows
    const rows = transactions.map(tx => {
        const date = tx.timestamp ? new Date(tx.timestamp).toISOString().split('T')[0] : '';
        const createdDate = tx.createdAt ? new Date(tx.createdAt).toISOString() : '';
        const updatedDate = tx.updatedAt ? new Date(tx.updatedAt).toISOString() : '';

        return [
            tx.id || '',
            tx.userId || '',
            date,
            tx.timestamp || '',
            tx.account || '',
            tx.amount || 0,
            tx.type || '',
            tx.merchant || '',
            tx.upiId || '',
            tx.category || '',
            tx.source || '',
            tx.isRecurring ? 'Yes' : 'No',
            createdDate,
            updatedDate
        ].map(field => {
            // Escape fields containing commas or quotes
            const fieldStr = String(field);
            if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
                return `"${fieldStr.replace(/"/g, '""')}"`;
            }
            return fieldStr;
        }).join(',');
    });

    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
}

/**
 * Main export function
 */
async function exportTransactions() {
    try {
        console.log('Starting transaction export...');

        if (!firestore) {
            throw new Error('Firestore is not initialized. Check your Firebase configuration.');
        }

        // Fetch all transactions from Firestore
        console.log('Fetching transactions from Firestore...');
        const snapshot = await firestore
            .collection('transactions')
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            console.log('No transactions found in Firestore.');
            return;
        }

        console.log(`Found ${snapshot.size} transactions.`);

        // Convert to array of transaction objects
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Convert to CSV
        console.log('Converting to CSV format...');
        const csvContent = convertToCSV(transactions);

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `transactions_export_${timestamp}_${Date.now()}.csv`;
        const filepath = path.join(outputDir, filename);

        // Write to file
        console.log(`Writing to file: ${filepath}`);
        fs.writeFileSync(filepath, csvContent, 'utf8');

        console.log('✅ Export completed successfully!');
        console.log(`📁 File saved to: ${filepath}`);
        console.log(`📊 Total transactions exported: ${transactions.length}`);

        // Print summary statistics
        const creditCount = transactions.filter(tx => tx.type === 'credit').length;
        const debitCount = transactions.filter(tx => tx.type === 'debit').length;
        const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

        console.log('\n📈 Summary:');
        console.log(`   - Credit transactions: ${creditCount}`);
        console.log(`   - Debit transactions: ${debitCount}`);
        console.log(`   - Total amount: ₹${totalAmount.toFixed(2)}`);
        console.log(`   - Unique users: ${new Set(transactions.map(tx => tx.userId)).size}`);

    } catch (error) {
        console.error('❌ Error exporting transactions:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Run the export
exportTransactions()
    .then(() => {
        console.log('\n✨ Export process finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Export process failed:', error);
        process.exit(1);
    });
