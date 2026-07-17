const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://unuktar1_db_user:%40Zainabimksub@cluster0.hj9idyn.mongodb.net/vtuApp?appName=Cluster0';

mongoose.connect(uri).then(async () => {
  console.log('Connected to DB');

  // Update Admin
  const adminEmail = 'unuktar1@gmail.com';
  const adminHash = await bcrypt.hash('Admin123!', 10);
  await mongoose.connection.collection('users').updateOne({email: adminEmail}, { $set: { password: adminHash } });
  console.log('Admin password updated to Admin123!');

  // Find Pending Request
  const request = await mongoose.connection.collection('resellerrequests').findOne({status: 'pending'});
  if (!request) { 
    console.log('NO PENDING REQUESTS FOUND'); 
  } else {
    console.log('Pending Request:', request);
    const user = await mongoose.connection.collection('users').findOne({_id: request.userId});
    if (user) {
      console.log('Pending User Email:', user.email);
      const newHash = await bcrypt.hash('Password123!', 10);
      await mongoose.connection.collection('users').updateOne({_id: request.userId}, { $set: { password: newHash } });
      console.log('Pending user password updated to Password123!');
    } else {
      console.log('User NOT FOUND for request');
    }
  }

  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
