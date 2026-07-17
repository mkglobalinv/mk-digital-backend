require('dotenv').config();
const mongoose = require('mongoose');

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    
    const totalUsers = await usersCol.countDocuments();
    const adminUsers = await usersCol.countDocuments({ role: { $in: ['admin', 'superadmin', 'super_admin'] } });
    const regularUsers = totalUsers - adminUsers;
    
    console.log(JSON.stringify({
      totalUsers,
      adminUsers,
      regularUsers,
      roles: await usersCol.distinct('role')
    }, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmins();
