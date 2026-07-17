import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mkdigital');
        console.log("Connected to DB.");

        const db = mongoose.connection.db;
        const usersCol = db.collection('users');

        const emails = [
            "musulma8@gmail.com",
            "reffar34@gmail.com",
            "kesplaystore1@gmail.com"
        ];

        for (const email of emails) {
            console.log(`\n=== Documents for ${email} ===`);
            const docs = await usersCol.find({ email }).toArray();
            for (const doc of docs) {
                console.log(JSON.stringify({
                    _id: doc._id,
                    email: doc.email,
                    tenantOwnerId: doc.tenantOwnerId,
                    archived: doc.archived,
                    role: doc.role,
                    createdAt: doc.createdAt,
                    updatedAt: doc.updatedAt,
                    subdomain: doc.subdomain,
                    admin_subdomain: doc.admin_subdomain
                }, null, 2));
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
