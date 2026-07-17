import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { runDiagnosticScan } from './services/diagnosticEngine.js';
import Transaction from './models/Transaction.js';

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Create a mock failed transaction if none exist
        const failedTx = new Transaction({
            reference: 'MOCK_FAIL_' + Date.now(),
            userId: new mongoose.Types.ObjectId(),
            type: 'debit',
            description: 'MTN Awuf',
            amount: 100,
            status: 'failed',
            provider: 'peyflex',
            api_response: { error: 'timeout from upstream server' }
        });
        await failedTx.save();
        console.log('Created mock failed tx');

        const result = await runDiagnosticScan();
        console.log('Scan Result:', JSON.stringify(result, null, 2));

        // Clean up mock
        await Transaction.deleteOne({ _id: failedTx._id });

        mongoose.disconnect();
    } catch (e) {
        console.error('Error:', e);
        mongoose.disconnect();
    }
}

runTest();
