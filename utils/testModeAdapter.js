import axios from 'axios';
import crypto from 'crypto';

/**
 * PRODUCTION TEST MODE ADAPTER
 * Intercepts Axios requests to VTU providers to prevent real debits during certification.
 */
export const initializeTestMode = () => {
    if (process.env.TEST_MODE !== 'true') return;
    
    console.log("=========================================");
    console.log(" ⚠️  PRODUCTION TEST MODE ACTIVATED");
    console.log(" VTU operations and payment APIs will be MOCKED.");
    console.log(" Real funds will NOT be consumed.");
    console.log("=========================================");

    const originalAxiosPost = axios.post;
    const originalAxiosGet = axios.get;

    axios.post = async function (url, data, config) {
        const urlStr = url.toString().toLowerCase();

        let parsedData = data;
        if (typeof data === 'string') {
            try { parsedData = JSON.parse(data); } catch (e) {}
        }
        
        // Global Mock for Amount 999 Failure Simulation
        if (parsedData && (parsedData.amount === 999 || parsedData.amount === "999")) {
            const err = new Error('Simulated Provider Timeout');
            err.response = { status: 500, data: { status: 'failed', message: 'Simulated Provider Timeout' } };
            return Promise.reject(err);
        }

        // ClubKonnect Mocking
        if (urlStr.includes('nellobytesystems.com')) {
            if (urlStr.includes('buydata') || urlStr.includes('buyairtime')) {
                // Simulate success or failure based on phone number prefix
                if (urlStr.includes('phone=08000000000')) {
                    // Simulate Failure
                    return { data: { status: 'ORDER_CANCELLED', statuscode: '100' } };
                }
                if (urlStr.includes('phone=08000000001')) {
                    // Simulate Timeout (delayed failure)
                    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
                }
                if (urlStr.includes('amount=999')) {
                    return { data: { status: 'ORDER_CANCELLED', statuscode: '100' } };
                }
                // Simulate Success
                return { data: { status: 'ORDER_COMPLETED', statuscode: '200', orderid: `CK-${Date.now()}` } };
            }
        }

        // Peyflex Mocking
        if (urlStr.includes('peyflex.com.ng')) {
            let parsedData = data;
            if (typeof data === 'string') {
                try { parsedData = JSON.parse(data); } catch (e) {}
            }
            // If amount is 999, trigger simulated failure
            if (parsedData && (parsedData.amount === 999 || parsedData.amount === "999")) {
                const err = new Error('Simulated Provider Timeout');
                err.response = { status: 500, data: { status: 'failed', message: 'Simulated Provider Timeout' } };
                return Promise.reject(err);
            }
            if (parsedData?.phone === '08000000000' || parsedData?.mobile_number === '08000000000') {
                return { data: { status: 'failed', message: 'Insufficient provider balance' } };
            }
            if (parsedData?.phone === '08000000001' || parsedData?.mobile_number === '08000000001') {
                return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
            }
            return { data: { status: 'success', reference: `PF-${Date.now()}` } };
        }
        
        // PaymentPoint VA creation mocking (PRIMARY provider).
        // Phone 08000000000 simulates a PaymentPoint failure so tests can
        // exercise the automatic fallback to Flutterwave.
        if (urlStr.includes('api.paymentpoint.co')) {
            if (parsedData?.phoneNumber === '08000000000') {
                return {
                    data: { status: 'error', message: 'Simulated PaymentPoint failure', errors: ['Simulated'] }
                };
            }
            return {
                data: {
                    status: 'success',
                    message: 'Customer account created successfully.',
                    customer: {
                        customer_id: `test-${Date.now()}`,
                        customer_name: parsedData?.name,
                        customer_email: parsedData?.email,
                        customer_phone_number: parsedData?.phoneNumber
                    },
                    business: { business_name: 'Test Business', business_email: null, business_phone_number: null, business_Id: null },
                    bankAccounts: [{
                        bankCode: '20946',
                        accountNumber: `90${String(Date.now()).slice(-8)}`,
                        accountName: `${parsedData?.name} (paymentpoint)`,
                        bankName: 'Palmpay',
                        Reserved_Account_Id: `test-reserved-${Date.now()}`
                    }],
                    errors: []
                }
            };
        }

        // Flutterwave VA creation mocking (AUTOMATIC FALLBACK, exercised when
        // PaymentPoint is simulated as unavailable above).
        if (urlStr.includes('api.flutterwave.com/v3/virtual-account-numbers')) {
            return {
                data: {
                    status: 'success',
                    message: 'Virtual account created',
                    data: {
                        account_number: `88${String(Date.now()).slice(-8)}`,
                        bank_name: 'Test Flutterwave Bank',
                        order_ref: `test-flw-ref-${Date.now()}`,
                        flw_ref: `test-flw-ref-${Date.now()}`
                    }
                }
            };
        }

        // Flutterwave / Monnify webhooks aren't outgoing, they are incoming.
        // We will test those by hitting our own endpoints.

        return originalAxiosPost.apply(this, arguments);
    };

    axios.get = async function (url, config) {
        const urlStr = url.toString().toLowerCase();
        
        // Global Mock for Amount 999 Failure Simulation in URL
        if (urlStr.includes('amount=999')) {
            const err = new Error('Simulated Provider Timeout');
            err.response = { status: 500, data: { status: 'failed', message: 'Simulated Provider Timeout' } };
            return Promise.reject(err);
        }
        
        // Mock Provider Balances for Health Check
        if (urlStr.includes('nellobytesystems.com') && urlStr.includes('status=')) {
            return { data: { status: '200', balance: '50000.00' } };
        }
        if (urlStr.includes('peyflex.com.ng/api/user/profile')) {
            return { data: { status: 'success', data: { balance: 150000 } } };
        }

        if (urlStr.includes('api.flutterwave.com/v3/transactions/') && urlStr.includes('/verify')) {
            const txId = urlStr.split('/transactions/')[1].split('/')[0];
            return {
                data: {
                    status: 'success',
                    data: {
                        status: 'successful',
                        amount: 5000,
                        tx_ref: `TX-TEST-${Date.now()}`,
                        customer: { email: 'cust_demo1@test9jasub.com' }
                    }
                }
            };
        }

        return originalAxiosGet.apply(this, arguments);
    };
};

/**
 * Utility to generate mock webhooks for testing
 */
export const generateMockFlutterwaveWebhook = (txRef, status = 'successful') => {
    const payload = {
        event: "charge.completed",
        data: {
            tx_ref: txRef,
            status: status,
            amount: 5000,
            currency: "NGN",
            customer: {
                email: "test_customer@9jasub.com"
            }
        }
    };
    
    // Sign payload
    const hash = process.env.FLW_WEBHOOK_HASH || "mk_sub_data_webhook_secret_2024";
    const signature = crypto.createHash('sha256').update(hash).digest('hex');
    // Note: Actually FW sends the raw hash in the header `verif-hash`. 
    // Wait, the webhook middleware uses process.env.FLW_WEBHOOK_HASH directly compared to `req.headers['verif-hash']`.
    
    return {
        headers: { 'verif-hash': hash },
        body: payload
    };
};

/**
 * Utility to generate a signed mock PaymentPoint webhook for testing.
 * Signature is HMAC-SHA256 of JSON.stringify(body), matching PaymentPoint's
 * own reference implementation and paymentpointController.js's verification.
 */
export const generateMockPaymentPointWebhook = (transactionId, accountNumber, customerEmail, amount = 5000) => {
    const payload = {
        notification_status: "payment_successful",
        transaction_id: transactionId,
        amount_paid: amount,
        settlement_amount: amount,
        settlement_fee: 0,
        transaction_status: "success",
        sender: { name: "Test Sender", account_number: "****1234", bank: "TEST BANK" },
        receiver: { name: "Test Receiver (paymentpoint)", account_number: accountNumber, bank: "PalmPay" },
        customer: { name: "Test Customer", email: customerEmail, phone: null, customer_id: `test-${transactionId}` },
        description: "Your payment has been successfully processed.",
        timestamp: new Date().toISOString()
    };

    const secret = process.env.PAYMENTPOINT_WEBHOOK_SECRET || "test_paymentpoint_webhook_secret";
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    return {
        headers: { 'paymentpoint-signature': signature },
        body: payload
    };
};
