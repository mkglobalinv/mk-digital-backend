import axios from 'axios';

class PaystackService {
    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        this.baseUrl = 'https://api.paystack.co';
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
                }
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
                }
            });
            return response.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Paystack verification failed');
        }
    }
}

export default new PaystackService();
