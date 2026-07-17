import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

async function testFull() {
    try {
        const secret = process.env.JWT_SECRET || 'mk_sub_data_secret_2024_premium';
        
        // Hardcode an admin token. We can parse the one from DB using mongo if we want, or generate a fake one if the backend accepts it.
        // Wait, to make a valid token, we need a real user ID. Let's use standard mongoose to just fetch an ID, but it timed out!
        // Instead of connecting to mongo, let's just grep the ID from somewhere. 
        // Or I can use a previously printed ID: '6a3bfec0ea4aa1c61fc10797' (no wait, admin ID from earlier: admin._id)
        
    } catch (err) {
        console.error(err);
    }
}
testFull();
