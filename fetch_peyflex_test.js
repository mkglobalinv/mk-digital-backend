import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import mongoose from 'mongoose';

const PEYFLEX_API_URL = (process.env.PEYFLEX_API_URL || "https://client.peyflex.com.ng").replace(/\/$/, "");
const PEYFLEX_API_TOKEN = process.env.PEYFLEX_API_TOKEN || process.env.PEYFLEX_API_KEY;

const networks = {
  MTN: ['mtn_gifting_data', 'mtn_data_share', 'mtn_awoof_gifting'],
  GLO: ['glo_data'],
  '9MOBILE': ['9mobile_data'],
  AIRTEL: ['airtel_data']
};

const getPeyflexHeaders = () => {
    return {
        'Authorization': `Token ${PEYFLEX_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
};

async function fetchPlans() {
  console.log("Fetching plans from Peyflex...");
  const results = {};
  for (const [networkName, identifiers] of Object.entries(networks)) {
    for (const identifier of identifiers) {
      try {
        const response = await axios.get(`${PEYFLEX_API_URL}/api/data/plans/`, {
            params: { network: identifier },
            headers: getPeyflexHeaders(),
            timeout: 10000
        });
        results[identifier] = response.data?.plans || [];
        console.log(`Fetched ${results[identifier].length} plans for ${identifier}`);
      } catch (err) {
        console.error(`Failed to fetch ${identifier}: ${err.message}`);
      }
    }
  }
  
  // Output a sample plan for each
  for (const identifier of Object.keys(results)) {
    if (results[identifier].length > 0) {
      console.log(`Sample for ${identifier}:`, results[identifier][0]);
    }
  }
  
  // Connect to DB and check current plans
  await mongoose.connect(process.env.MONGO_URI);
  const DataPlan = mongoose.model('DataPlan', new mongoose.Schema({}, {strict: false}), 'data_plans');
  const currentPeyflexPlans = await DataPlan.find({ provider: 'Peyflex' });
  console.log(`Current Peyflex plans in DB: ${currentPeyflexPlans.length}`);
  
  process.exit(0);
}

fetchPlans();
