import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function connect() {
    let retries = 5;
    while(retries > 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital', { serverSelectionTimeoutMS: 5000 });
            console.log('Connected!');
            
            const admin = await mongoose.model('User').findOne({ role: 'superadmin' });
            console.log('Admin:', admin._id);
            process.exit(0);
        } catch(e) {
            console.error('Failed, retries left:', retries-1);
            retries--;
        }
    }
}
connect();
