import axios from 'axios';

class PaystackService {
    constructor() {
        this.baseUrl = 'https://api.paystack.co';
    }

    // Read on every request so a key changed in Admin -> System Settings applies immediately.
    get secretKey() {
        return process.env.PAYSTACK_SECRET_KEY;
    }

    async initializeTransaction(email, amount) {
        try {
            const response = await axios.post(`${this.baseUrl}/transaction/initialize`, {
                email,
                amount: amount * 100, // Paystack works in kobo
                callback_url: `${process.env.FRONTEND_URL}/wallet-confirm`
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            return response.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Paystack initialization failed');
        }
    }

    async verifyTransaction(reference) {
        try {
            const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`
                },
                timeout: 15000
            });
            return response.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Paystack verification failed');
        }
    }
}

export default new PaystackService();
