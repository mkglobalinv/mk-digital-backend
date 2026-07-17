import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SERVER_URL = 'http://localhost:3000';
const WEBHOOK_PATH = '/api/payment/flutterwave/webhook';
const SECRET_HASH = process.env.FLW_WEBHOOK_HASH || 'mk_sub_data_webhook_secret_2024';

const testWebhook = async () => {
    console.log(`Starting Webhook Test to ${SERVER_URL}${WEBHOOK_PATH}...`);
    
    const payload = {
        event: 'charge.completed',
        data: {
            id: 987654321,
            tx_ref: `TEST-TX-${Date.now()}`,
            flw_ref: `FLW-TEST-${Date.now()}`,
            amount: 500,
            currency: 'NGN',
            status: 'successful',
            customer: {
                email: 'unuktar1@gmail.com' // Change this to a real user email from your DB
            }
        }
    };

    try {
        const response = await axios.post(`${SERVER_URL}${WEBHOOK_PATH}`, payload, {
            headers: {
                'verif-hash': SECRET_HASH,
                'Content-Type': 'application/json'
            }
        });

        console.log('--- TEST RESULT ---');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('-------------------');
        console.log('Now check your server logs for "[Webhook]" messages.');
    } catch (error) {
        console.error('--- TEST FAILED ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
};

testWebhook();
