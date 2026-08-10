require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.connection.collection('users');
  let testUser = await User.findOne({ email: 'test_nin_verifier@example.com' });
  
  if (!testUser) {
    await User.insertOne({
      email: 'test_nin_verifier@example.com',
      name: 'Test NIN',
      phone: '08123456789',
      role: 'user',
      walletBalance: 150000,
      password: 'fake_password',
      createdAt: new Date()
    });
    testUser = await User.findOne({ email: 'test_nin_verifier@example.com' });
  } else {
    await User.updateOne(
      { email: 'test_nin_verifier@example.com' },
      { $set: { walletBalance: 150000 } }
    );
  }
  
  const token = jwt.sign({ id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
  console.log('TEST_TOKEN=' + token);
  console.log('USER_ID=' + testUser._id.toString());
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
