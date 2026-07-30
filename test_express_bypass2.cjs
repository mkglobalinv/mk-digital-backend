const express = require('express');
const app = express();

app.get('/transactions', (req, res) => {
    res.json([{id: 1, name: 'Transaction 1'}]);
});

app.use((req, res, next) => {
    // Mock isMarketingDomain
    req.path = req.url.split('?')[0];
    const isMarketingDomain = true; // Simulating 9jasub.com
    
    if (isMarketingDomain) {
        const nonMarketingRoutes = [
            '/api', '/auth', '/user', '/buy-', '/reseller-assets', '/assets', '/socket.io', 
            '/login', '/register', '/continue-signup', '/transactions', '/fund', '/withdraw', 
            '/verify-otp', '/resend-otp', '/manifest.json'
        ];
        if (nonMarketingRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }
        return res.send('HTML Content for Marketing Website');
    }
});

app.use(['/api', '/auth', '/user', '/buy-', '/reseller-assets', '/assets'], (req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint or asset not found' });
});

app.get(/.*/, (req, res) => {
    res.set('Content-Type', 'text/html');
    res.status(200).send('<!DOCTYPE html><html lang=\"en\"><head><title>MK Digital</title></head><body><div id=\"root\"></div></body></html>');
});

const server = app.listen(8889, async () => {
    const http = require('http');
    
    http.get('http://localhost:8889/transactions', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('--- GET /transactions WITH app.get before ---');
            console.log('Status:', res.statusCode);
            console.log('Content-Type:', res.headers['content-type']);
            console.log('Body:', data);
            server.close();
        });
    });
});
