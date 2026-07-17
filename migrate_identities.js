import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const migrateIdentities = async () => {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to DB natively');

        const db = client.db(); // uses default db from URI
        const usersCollection = db.collection('users');

        // 1. Fetch the normal admin account
        const normalAdmin = await usersCollection.findOne({ email: 'unuktar1@gmail.com' });
        if (!normalAdmin) {
            console.error('unuktar1@gmail.com not found!');
            process.exit(1);
        }

        const hashedPass = normalAdmin.password;

        // 2. Set unuktar1@gmail.com strictly to admin
        await usersCollection.updateOne(
            { _id: normalAdmin._id },
            { $set: { role: 'admin' } }
        );
        console.log('unuktar1@gmail.com has been demoted to strictly admin.');

        // 3. Create or update the superadmin account
        const superAdmin = await usersCollection.findOne({ email: 'mkcollectn@gmail.com' });
        if (superAdmin) {
            await usersCollection.updateOne(
                { _id: superAdmin._id },
                { $set: { role: 'superadmin', password: hashedPass } }
            );
            console.log('mkcollectn@gmail.com updated to superadmin with cloned password.');
        } else {
            // Clone the normal admin record safely
            const newSuperAdminData = { ...normalAdmin };
            delete newSuperAdminData._id; // Let Mongo generate a new one
            
            newSuperAdminData.email = 'mkcollectn@gmail.com';
            newSuperAdminData.role = 'superadmin';
            newSuperAdminData.createdAt = new Date();
            newSuperAdminData.updatedAt = new Date();
            
            await usersCollection.insertOne(newSuperAdminData);
            console.log('mkcollectn@gmail.com created as superadmin with cloned data.');
        }

        console.log('Migration Complete.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
};

migrateIdentities();
