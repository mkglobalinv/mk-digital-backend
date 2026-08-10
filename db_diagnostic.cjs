require('dotenv').config();
const mongoose = require('mongoose');

async function checkConnection(attemptNum) {
    try {
        console.log(`[Attempt ${attemptNum}] Connecting...`);
        const startTime = Date.now();
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000
        });
        const connectTime = Date.now() - startTime;
        console.log(`[Attempt ${attemptNum}] Connected in ${connectTime}ms.`);
        
        console.log(`[Attempt ${attemptNum}] Running read-only query...`);
        const queryStart = Date.now();
        const count = await mongoose.connection.collection('users').countDocuments({}, { maxTimeMS: 5000 });
        const queryTime = Date.now() - queryStart;
        console.log(`[Attempt ${attemptNum}] Read successful (${queryTime}ms). Found ${count} users.`);
        
        await mongoose.disconnect();
        return true;
    } catch (err) {
        console.error(`[Attempt ${attemptNum}] ERROR:`, err.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        return false;
    }
}

async function runDiagnostic() {
    let successCount = 0;
    const TOTAL_ATTEMPTS = 5;

    for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
        const success = await checkConnection(i);
        if (success) successCount++;
        if (i < TOTAL_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Successful attempts: ${successCount} / ${TOTAL_ATTEMPTS}`);
    if (successCount === TOTAL_ATTEMPTS) {
        console.log('RESULT: STABLE');
    } else if (successCount > 0) {
        console.log('RESULT: UNSTABLE');
    } else {
        console.log('RESULT: UNAVAILABLE');
    }
}

runDiagnostic();
