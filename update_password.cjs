const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect('mongodb://127.0.0.1:27017/mk_digital').then(async () => {
  const request = await mongoose.connection.collection('resellerrequests').findOne({status: 'pending'});
  if (!request) { console.log('NO PENDING REQUESTS FOUND'); mongoose.disconnect(); process.exit(0); }
  console.log('Pending Request:', request);
  const user = await mongoose.connection.collection('users').findOne({_id: request.userId});
  if (user) {
    console.log('User Email:', user.email);
    const newHash = await bcrypt.hash('Password123', 10);
    await mongoose.connection.collection('users').updateOne({_id: request.userId}, { $set: { password: newHash } });
    console.log('Password updated to: Password123');
  } else {
    console.log('User NOT FOUND');
  }
  mongoose.disconnect();
  process.exit(0);
});
