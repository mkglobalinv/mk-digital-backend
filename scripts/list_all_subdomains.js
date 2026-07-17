import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const list = async () => {
    try {
        const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
        await mongoose.connect(connString);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        console.log("ALL USERS WITH SUBDOMAINS:");
        const users = await User.find({ subdomain: { $exists: true, $ne: null } });
        users.forEach(r => {
            console.log(`- ${r.name} (${r.email}): Subdomain=${r.subdomain}, Status=${r.whiteLabelStatus}, Role=${r.role}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

list();
