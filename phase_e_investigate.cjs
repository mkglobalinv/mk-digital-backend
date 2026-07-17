const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();

    try {
        console.log('\n--- STEP 2: RESELLER ACCOUNT ---');
        const reseller = await db.collection('users').findOne({ email: 'reffar34@gmail.com' });
        if (reseller) {
            console.log('RESELLER ID:', reseller._id);
            console.log('RESELLER serviceControl:', JSON.stringify(reseller.serviceControl, null, 2));
        } else {
            console.log('RESELLER NOT FOUND');
        }

        console.log('\n--- STEP 1: ACTIVE SERVICES ---');
        const activeStatuses = await db.collection('servicestatuses').find({ isActive: true }).toArray();
        console.log('RAW ACTIVE STATUSES:', JSON.stringify(activeStatuses, null, 2));

    } finally {
        await client.close();
    }
}
run();
