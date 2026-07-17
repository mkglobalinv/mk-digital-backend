import mongoose from 'mongoose';
import FuturePlatform from './models/FuturePlatform.js';
import dotenv from 'dotenv';
dotenv.config();

async function testSave() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const payload = {
            name: "Test Platform " + Date.now(),
            retailDisplayName: "Test Retail Name",
            ownerDisplayNameTemplate: "{Brand}",
            logoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            url: "https://example.com"
        };
        
        console.log("Saving payload...");
        const platform = new FuturePlatform(payload);
        await platform.save();
        console.log("Successfully saved!");
        
        // Clean up
        await FuturePlatform.findByIdAndDelete(platform._id);
        console.log("Cleaned up.");
        
    } catch(e) {
        console.error("Save Error:", e.message);
        console.error("Stack:", e.stack);
    }
    process.exit(0);
}
testSave();
