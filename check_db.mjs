import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mkdigital')
.then(async () => {
    const indexes = await User.collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    mongoose.connection.close();
})
.catch(err => console.error(err));
