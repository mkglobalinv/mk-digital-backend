const mongoose = require('mongoose');

const uri = 'mongodb+srv://unuktar1_db_user:%40Zainabimksub@cluster0.hj9idyn.mongodb.net/vtuApp?appName=Cluster0';

mongoose.connect(uri).then(async () => {
  const adminEmail = 'unuktar1@gmail.com';
  
  const user = await mongoose.connection.collection('users').findOne({email: adminEmail});
  console.log(user);

  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
