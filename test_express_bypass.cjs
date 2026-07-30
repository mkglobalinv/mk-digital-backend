const express = require('express');
const app = express();

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

// Mock the 404 handler that catches API/User routes
app.use(['/api', '/auth', '/user', '/buy-', '/reseller-assets', '/assets'], (req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint or asset not found' });
});

// Mock the SPA catch-all for anything that falls through!
app.get(/.*/, (req, res) => {
    res.set('Content-Type', 'text/html');
    res.status(200).send('<!DOCTYPE html><html lang=\"en\"><head><title>MK Digital</title></head><body><div id=\"root\"></div></body></html>');
});

const server = app.listen(8888, async () => {
    const http = require('http');
    
    // Test 1: GET /transactions
    http.get('http://localhost:8888/transactions', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('--- GET /transactions ---');
            console.log('Status:', res.statusCode);
            console.log('Content-Type:', res.headers['content-type']);
            console.log('Body:', data.substring(0, 200));
            console.log('');
            
            // Test 2: GET /user/transactions
            http.get('http://localhost:8888/user/transactions', (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    console.log('--- GET /user/transactions ---');
                    console.log('Status:', res2.statusCode);
                    console.log('Content-Type:', res2.headers['content-type']);
                    console.log('Body:', data2.substring(0, 200));
                    
                    server.close();
                });
            });
        });
    });
});
