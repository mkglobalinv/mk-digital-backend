require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

(async () => {
  try {
    const userId = '6a78529281a5afb4ad884898';
    
    await mongoose.connect(process.env.MONGO_URI);
    
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Insert valid session
    const Session = mongoose.connection.collection('sessions');
    await Session.insertOne({
      token: token,
      userId: new mongoose.Types.ObjectId(userId),
      isValid: true,
      createdAt: new Date()
    });

    const planId = '6a7530f31e15988b3c412e12';

    const form = new FormData();
    form.append('planId', planId);
    form.append('serviceType', 'nin-name-modification');
    form.append('whatsappNumber', '08123456789');
    form.append('nin', '12345678901');
    form.append('currentInformation', 'Old Name');
    form.append('details', 'New Name');
    form.append('amount', '100'); 
    form.append('price', '100'); 
    form.append('document', fs.createReadStream('C:/Users/userpc/mk-digital-backend/homepage.png'));

    console.log("Submitting E2E Test Request...");

    const res = await axios.post('http://localhost:8800/api/retail/identity/purchase', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Submission Success!');
    console.log('Response:', res.data);
    
    process.exit(0);
  } catch (err) {
    console.error('Submission Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
