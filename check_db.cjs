const mongoose = require('mongoose');
const User = require('./models/User.js').default;

mongoose.connect('mongodb://127.0.0.1:27017/mkdigital', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    const users = await User.find({ email: 'test@duplicate.com' });
    console.log(`Found ${users.length} users with email test@duplicate.com`);
    users.forEach(u => console.log(`- ID: ${u._id}, Tenant: ${u.tenantOwnerId}`));
    mongoose.connection.close();
})
.catch(err => console.error(err));
