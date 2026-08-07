import 'dotenv/config';
import { 
    verifyNINWithBillsplash, 
    verifyBVNWithBillsplash,
    verifyNINByPhoneWithBillsplash,
    verifyNINByDemographicsWithBillsplash,
    submitIPEClearanceWithBillsplash
} from './services/providers/billsplash.js';

async function runAudit() {
    console.log('\n--- BILLSPLASH ENDPOINT VERIFICATION AUDIT ---\n');
    
    console.log('\n1. Testing NIN Verification...');
    const ninRes = await verifyNINWithBillsplash('12345678901');
    console.log('NIN Result:', JSON.stringify(ninRes, null, 2));
    
    console.log('\n2. Testing BVN Verification...');
    const bvnRes = await verifyBVNWithBillsplash('12345678901');
    console.log('BVN Result:', JSON.stringify(bvnRes, null, 2));
    
    console.log('\n3. Testing NIN Verification by Phone...');
    const ninPhoneRes = await verifyNINByPhoneWithBillsplash('08012345678');
    console.log('NIN Phone Result:', JSON.stringify(ninPhoneRes, null, 2));
    
    console.log('\n4. Testing NIN Search by Demographics...');
    const ninDemoRes = await verifyNINByDemographicsWithBillsplash({
        firstname: 'John',
        lastname: 'Doe',
        dob: '1990-01-01',
        gender: 'male'
    });
    console.log('NIN Demographics Result:', JSON.stringify(ninDemoRes, null, 2));
    
    console.log('\n5. Testing IPE Clearance...');
    const ipeRes = await submitIPEClearanceWithBillsplash({
        trackingID: 'TRACK123',
        pin: '1234'
    });
    console.log('IPE Clearance Result:', JSON.stringify(ipeRes, null, 2));
    
    console.log('\n--- AUDIT COMPLETE ---');
}

runAudit().catch(console.error);
