const mongoose = require('mongoose');

const uri = 'mongodb+srv://unuktar1_db_user:%40Zainabimksub@cluster0.hj9idyn.mongodb.net/vtuApp?appName=Cluster0';

mongoose.connect(uri).then(async () => {
  const adminEmail = 'unuktar1@gmail.com';
  
  // Find OTP
  const otp = await mongoose.connection.collection('otps').find({email: adminEmail}).sort({createdAt: -1}).limit(1).toArray();
  
  if (otp.length > 0) {
    console.log('Admin OTP:', otp[0].code || otp[0].otp);
  } else {
    console.log('NO OTP FOUND');
  }

  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
