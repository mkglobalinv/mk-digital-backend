import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const auditGloPlans = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
        const { default: DataPlan } = await import('./models/DataPlan.js');

        // 1. Fetch Glo plans from ClubKonnect API
        console.log("Fetching Glo plans from ClubKonnect API...");
        const UserID = process.env.CLUBKONNECT_USERID;
        const APIKey = process.env.CLUBKONNECT_API_KEY;
        
        const response = await axios.get("https://www.nellobytesystems.com/APIDatabundlePlansV1.asp", {
            params: { userid: UserID, apikey: APIKey },
            timeout: 20000
        });

        const data = response.data;
        let apiPlans = [];
        
        if (data && data.MOBILE_NETWORK && data.MOBILE_NETWORK['Glo']) {
            apiPlans = data.MOBILE_NETWORK['Glo'].flatMap(item => {
                return item.PRODUCT.map(p => ({
                    plan_id: p.PRODUCT_ID,
                    name: p.PRODUCT_NAME,
                    price: parseFloat(p.PRODUCT_AMOUNT)
                }));
            });
        } else {
            console.error("Failed to parse Glo plans from API response.");
            process.exit(1);
        }
        
        // 2. Fetch Glo plans from MongoDB
        console.log("Fetching Glo plans from Database...");
        const dbPlans = await DataPlan.find({ 
            network: 'GLO', 
            provider: 'clubkonnect' 
        }).lean();

        // 3. Compare and find missing
        const dbPlanIds = dbPlans.map(p => String(p.api_plan_id));

        const missingFromDb = apiPlans.filter(p => !dbPlanIds.includes(String(p.plan_id)));
        
        // Output formatting
        console.log("\n=============================================");
        console.log("             GLO PLANS AUDIT REPORT          ");
        console.log("=============================================");
        console.log(`Total Glo plans from API: ${apiPlans.length}`);
        console.log(`Total Glo plans in Database: ${dbPlans.length}`);
        console.log(`Exact list of missing plan IDs and names:`);
        
        if (missingFromDb.length === 0) {
            console.log("None! All API plans exist in the database.");
        } else {
            missingFromDb.forEach(p => {
                console.log(`- ID: ${p.plan_id} | Name: ${p.name}`);
            });
        }
        
        console.log("\nExplanation of why they were not imported:");
        console.log("The sync script (`services/providerSyncService.js`) explicitly imports SME and Corporate plans by matching specific keywords, and often ignores specific daily/weekly plans or renames them. If these are new plans added by ClubKonnect, they might not match the existing regex filters in the sync script, or an admin explicitly deleted them from the database to hide them from users.");
        console.log("=============================================");

        process.exit(0);
    } catch (error) {
        console.error("Audit script failed:", error);
        process.exit(1);
    }
};

auditGloPlans();
