import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

mongoose.connect('mongodb+srv://unuktar1_db_user:%40Zainabimksub@cluster0.hj9idyn.mongodb.net/vtuApp?appName=Cluster0')
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}), 'users');
    const hash = await bcrypt.hash('12345678', 10);
    await User.updateOne({email: 'unuktar1@gmail.com'}, {$set: {password: hash}});
    console.log('Password reset to 12345678 successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
