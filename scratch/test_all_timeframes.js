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
        
        const ranges = ['Live', '24H', '7D', '30D', '12M'];
        
        for (const range of ranges) {
            console.log(`\n=================== TESTING TIMEFRAME: ${range} ===================`);
            const req = {
                query: { timeframe: range }
            };
            
            let statsData = null;
            const res = {
                json: (data) => {
                    statsData = data;
                },
                status: (code) => {
                    return {
                        json: (err) => {
                            throw new Error(`Failed with status ${code}: ${JSON.stringify(err)}`);
                        }
                    };
                }
            };
            
            await getDashboardStats(req, res);
            console.log(`[${range}] SUCCESS!`);
            console.log(`Trends count: ${statsData?.trends?.length || 0}`);
            console.log(`Audience states count: ${statsData?.audience?.topStates?.length || 0}`);
            console.log(`Platform Health Score: ${statsData?.telemetry?.healthScore}`);
        }
        
        console.log("\nALL TIMEFRAMES VERIFIED SUCCESSFULLY! ✅");
        process.exit(0);
    } catch (err) {
        console.error("\nCRITICAL FAILURE DURING VERIFICATION:", err);
        process.exit(1);
    }
};

run();
