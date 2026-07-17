require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtuapp').then(async () => {
    const db = mongoose.connection.db;
    const User = db.collection('users');
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
        const newPass = await bcrypt.hash('admin123', 10);
        await User.updateOne({ _id: admin._id }, { $set: { password: newPass } });
        console.log('Admin email: ' + admin.email + ', Password reset to: admin123');
    } else {
        console.log('No admin found');
    }
    process.exit(0);
}).catch(console.error);
