import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateMockPaymentPointWebhook } from '../utils/testModeAdapter.js';

// Import models so Mongoose registers them
import '../models/User.js';
import '../models/Transaction.js';
import '../models/DataPlan.js';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:8800';
let tenantTokens = {};
let customerTokens = {};
let sharedTenantData = {};

// Create custom axios instance to prevent auto-casing headers
const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true // Don't throw on error status codes
});

describe('9JASUB Certification Suite', { concurrency: false }, () => {
    
    before(async () => {
        console.log("🚀 Initializing Certification Suite...");
        await mongoose.connect(process.env.MONGO_URI);
        await mongoose.connection.collection('users').deleteMany({ email: /@test9jasub\.com/ });
        await mongoose.connection.collection('transactions').deleteMany({ email: /@test9jasub\.com/ });
    });

    after(async () => {
        console.log("🧹 Cleaning up test data...");
        await mongoose.connection.collection('users').deleteMany({ email: /@test9jasub\.com/ });
        await mongoose.connection.collection('transactions').deleteMany({ email: /@test9jasub\.com/ });
        await mongoose.disconnect();
    });

    describe('1. API Validation & Health', () => {
        test('Health endpoint returns 200 independently of tenant', async () => {
            const res = await client.get(`/health`);
            assert.strictEqual(res.status, 200);
        });
    });

    describe('2. Multi-Tenant Registration & Isolation', () => {
        const tenants = ['demo1', 'demo2', 'demo3'];
        
        for (const sub of tenants) {
            test(`Register Business Tenant: ${sub}`, async () => {
                const res = await client.post(`/api/reseller/register-with-payment`, {
                    name: `${sub} Owner`,
                    email: `owner_${sub}@test9jasub.com`,
                    phone: '08000000000',
                    businessName: `${sub} VTU`,
                    password: 'Password123!',
                    enabledFuturePlatforms: []
                }, { headers: { 'Host': '9jasub.com' } });
                
                assert.ok(res.status === 200 || res.status === 201 || res.status === 403, `Expected success status, got ${res.status}`);
                
                const user = await mongoose.model('User').findOne({ email: `owner_${sub}@test9jasub.com` });
                assert.ok(user, 'User should exist in DB');
                user.subdomain = sub;
                user.admin_subdomain = sub; 
                user.role = 'reseller_admin';
                await user.save();
            });

            test(`Business Login: ${sub}`, async () => {
                const res = await client.post(`/login`, {
                    email: `owner_${sub}@test9jasub.com`,
                    password: 'Password123!',
                    session_type: 'business'
                }, { headers: { 'Host': `${sub}.9jasub.com` } });
                
                assert.strictEqual(res.status, 200);
                assert.ok(res.data.token);
                tenantTokens[sub] = res.data.token;
            });

            test(`Register Customer under ${sub}`, async () => {
                const res = await client.post(`/register`, {
                    name: `Cust ${sub}`,
                    email: `cust_${sub}@test9jasub.com`,
                    phone: '08011111111',
                    password: 'Password123!',
                    transactionPin: '1234'
                }, { headers: { 'Host': `${sub}.9jasub.com` } });
                
                assert.ok(res.status === 200 || res.status === 201);
            });

            test(`Customer Login under ${sub}`, async () => {
                const res = await client.post(`/login`, {
                    email: `cust_${sub}@test9jasub.com`,
                    password: 'Password123!',
                    session_type: 'retail'
                }, { headers: { 'Host': `${sub}.9jasub.com` } });
                
                assert.strictEqual(res.status, 200);
                assert.ok(res.data.token);
                customerTokens[sub] = res.data.token;
                
                await mongoose.model('User').updateOne(
                    { email: `cust_${sub}@test9jasub.com` },
                    { $inc: { balance1: 50000, balance2: 50000, balance3: 50000, balance4: 50000, balance5: 50000 } }
                );
            });
        }

        test('Cross-tenant isolation', async () => {
            const res = await client.post(`/login`, {
                email: `cust_demo1@test9jasub.com`,
                password: 'Password123!',
                session_type: 'retail'
            }, { headers: { 'Host': `demo2.9jasub.com` } });
            
            assert.ok(res.status === 403 || res.status === 400 || res.status === 404);
        });
    });

    describe('3. Payment Testing (Mocked)', () => {
        let currentTxRef;
        test('Flutterwave Webhook & Wallet Funding', async () => {
            const txRef = `TX-TEST-${Date.now()}`;
            currentTxRef = txRef;
            const hash = process.env.FLW_WEBHOOK_HASH || "mk_sub_data_webhook_secret_2024";
            
            const db = mongoose.connection;
            const userObj = await db.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            
            const Transaction = mongoose.model('Transaction');
            await Transaction.create({
                reference: txRef,
                userId: userObj._id,
                email: 'cust_demo1@test9jasub.com',
                amount: 5000,
                status: 'pending',
                type: 'wallet_funding',
                date: new Date()
            });

            const mockId = Date.now();
            const payload = {
                event: "charge.completed",
                data: { id: mockId, tx_ref: txRef, status: "successful", amount: 5000, customer: { email: "cust_demo1@test9jasub.com" } }
            };
            
            const res = await client.post(`/api/payment/flutterwave/webhook`, payload, {
                headers: { 'verif-hash': hash, 'Host': '9jasub.com' }
            });
            assert.strictEqual(res.status, 200);
            
            const user = await db.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            assert.strictEqual(user.balance1, 55000);
        });

        test('Flutterwave Duplicate Webhook Protection', async () => {
             const hash = process.env.FLW_WEBHOOK_HASH || "mk_sub_data_webhook_secret_2024";
             const mockId = Date.now();
             const payload = {
                 event: "charge.completed",
                 data: { id: mockId, tx_ref: currentTxRef, status: "successful", amount: 5000, customer: { email: "cust_demo1@test9jasub.com" } }
             };
             
             const res = await client.post(`/api/payment/flutterwave/webhook`, payload, {
                 headers: { 'verif-hash': hash, 'Host': '9jasub.com' }
             });
             assert.strictEqual(res.status, 200);

             const user = await mongoose.connection.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
             assert.strictEqual(user.balance1, 55000);
        });

        test('PaymentPoint VA creation falls back to Flutterwave on failure', async () => {
            const token = customerTokens['demo1'];

            // Trigger the simulated PaymentPoint failure (see utils/testModeAdapter.js)
            await mongoose.connection.collection('users').updateOne(
                { email: 'cust_demo1@test9jasub.com' },
                { $set: { 'kycData.phone': '08000000000' } }
            );

            const res = await client.post(`/user/generate-temp-va`, { amount: 1000 }, {
                headers: { 'Host': 'demo1.9jasub.com', 'Authorization': `Bearer ${token}` }
            });

            assert.strictEqual(res.status, 200);
            assert.ok(res.data?.account?.bank_name === 'Test Flutterwave Bank', 'Expected the Flutterwave fallback mock to have issued the account');

            const user = await mongoose.connection.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            assert.ok(user.account_number, 'User should have a virtual account number after fallback');
        });

        test('PaymentPoint Webhook & Wallet Funding', async () => {
            const db = mongoose.connection;
            const userObj = await db.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            const testAccountNumber = '6698059290';

            await db.collection('users').updateOne(
                { _id: userObj._id },
                { $set: { account_number: testAccountNumber } }
            );

            const balanceBefore = userObj.balance1;
            const txId = `PP-TEST-${Date.now()}`;
            const { headers, body } = generateMockPaymentPointWebhook(txId, testAccountNumber, 'cust_demo1@test9jasub.com', 5000);

            const res = await client.post(`/api/payment/paymentpoint/webhook`, body, {
                headers: { ...headers, 'Host': '9jasub.com' }
            });
            assert.strictEqual(res.status, 200);

            const user = await db.collection('users').findOne({ _id: userObj._id });
            assert.strictEqual(user.balance1, balanceBefore + 5000);

            // Duplicate delivery of the same webhook must not credit twice
            const dupRes = await client.post(`/api/payment/paymentpoint/webhook`, body, {
                headers: { ...headers, 'Host': '9jasub.com' }
            });
            assert.strictEqual(dupRes.status, 200);

            const userAfterDup = await db.collection('users').findOne({ _id: userObj._id });
            assert.strictEqual(userAfterDup.balance1, balanceBefore + 5000, 'Duplicate PaymentPoint webhook must not credit the wallet twice');
        });

        test('PaymentPoint Webhook rejects invalid signature', async () => {
            const db = mongoose.connection;
            const userObj = await db.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            const balanceBefore = userObj.balance1;

            const { body } = generateMockPaymentPointWebhook(`PP-TEST-BADSIG-${Date.now()}`, userObj.account_number, 'cust_demo1@test9jasub.com', 5000);

            const res = await client.post(`/api/payment/paymentpoint/webhook`, body, {
                headers: { 'paymentpoint-signature': 'tampered-signature', 'Host': '9jasub.com' }
            });
            assert.strictEqual(res.status, 401);

            const userAfter = await db.collection('users').findOne({ _id: userObj._id });
            assert.strictEqual(userAfter.balance1, balanceBefore, 'Wallet must not be credited on invalid signature');
        });
    });

    describe('4. VTU Operations (Mocked Test Mode)', () => {
        test('Successful Airtime Purchase', async () => {
            const token = customerTokens['demo1'];
            
            const res = await client.post(`/buy-airtime`, {
                network: 'MTN',
                phone: '08123456789',
                amount: 100,
                transactionPin: '1234'
            }, { 
                headers: { 'Host': 'demo1.9jasub.com', 'Authorization': `Bearer ${token}` }
            });
            
            assert.strictEqual(res.status, 200);
            assert.ok(res.data.status === 'success' || res.data.status === 'processing');
            
            const user = await mongoose.connection.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
            assert.ok(user.balance1 < 55000);
        });

        test('Provider Failure handling & Rollback', async () => {
             const token = customerTokens['demo1'];
             const initialUser = await mongoose.connection.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
             
             const res = await client.post(`/buy-airtime`, {
                 network: 'MTN',
                 phone: '08000000000',
                 amount: 100,
                 transactionPin: '1234'
             }, { 
                 headers: { 'Host': 'demo1.9jasub.com', 'Authorization': `Bearer ${token}` }
             });
             
             assert.ok(res.status >= 400 || res.data.status === 'failed' || res.data.status === 'error', 'Transaction should fail or return error status');
             const finalUser = await mongoose.connection.collection('users').findOne({ email: 'cust_demo1@test9jasub.com' });
             assert.strictEqual(finalUser.balance1, initialUser.balance1);
        });
        
        test('Duplicate VTU Request Protection (Idempotency)', async () => {
             const token = customerTokens['demo1'];
             const p1 = client.post(`/buy-airtime`, { network: 'MTN', phone: '08123456789', amount: 50, transactionPin: '1234' }, { headers: { 'Host': 'demo1.9jasub.com', 'Authorization': `Bearer ${token}` }});
             const p2 = client.post(`/buy-airtime`, { network: 'MTN', phone: '08123456789', amount: 50, transactionPin: '1234' }, { headers: { 'Host': 'demo1.9jasub.com', 'Authorization': `Bearer ${token}` }});
             
             const [r1, r2] = await Promise.all([p1, p2]);
             const statuses = [r1.status, r2.status];
             assert.ok(statuses.includes(200));
             assert.ok(statuses.includes(429) || statuses.includes(400) || statuses.includes(409));
        });
    });

});
