import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const list = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("ACTIVE RESELLERS:");
        const resellers = await User.find({ whiteLabelStatus: 'active' });
        resellers.forEach(r => {
            console.log(`- ${r.name}: Subdomain=${r.subdomain}, CustomDomain=${r.customDomain}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

list();
