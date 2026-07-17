const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/userpc/mk-digital-backend/.env' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const { adminLogin } = await import('file://C:/Users/userpc/mk-digital-backend/controllers/adminController.js');
    
    // create a mock request and response
    const req = {
        body: { email: 'superadmin@mksubdata.com', password: 'password123' },
        headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'node-test' },
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1'
    };
    
    let statusCode = null;
    let responseBody = null;
    
    const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { responseBody = data; console.log(statusCode, responseBody); process.exit(0); }
    };
    
    try {
        await adminLogin(req, res);
    } catch (error) {
        console.error("RUNTIME ERROR:", error);
        process.exit(1);
    }
});
