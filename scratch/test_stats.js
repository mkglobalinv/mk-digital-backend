import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { getDashboardStats } from "../controllers/adminController.js";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectDB = async () => {
    const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
    await mongoose.connect(connString);
    console.log("Connected to DB!");
};

const run = async () => {
    try {
        await connectDB();
        
        // Mock request and response
        const req = {
            query: { timeframe: 'Live' }
        };
        const res = {
            json: (data) => {
                console.log("SUCCESS!");
                console.log("Keys returned:", Object.keys(data));
                process.exit(0);
            },
            status: (code) => {
                console.log("STATUS CODE:", code);
                return {
                    json: (err) => {
                        console.error("ERROR JSON RECEIVED IN RESPONSE:", err);
                        process.exit(1);
                    }
                };
            }
        };
        
        await getDashboardStats(req, res);
    } catch (err) {
        console.error("RUN CRITICAL FAILED:", err);
        process.exit(1);
    }
};

run();
