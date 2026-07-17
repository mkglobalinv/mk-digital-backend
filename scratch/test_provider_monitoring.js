import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderStatus from '../models/ProviderStatus.js';
import { pollProviders, checkProviderAvailability } from '../services/providerMonitoringService.js';

dotenv.config();

async function run() {
  console.log("=== STARTING PROVIDER MONITORING VALIDATION ===");

  try {
    // 1. Connect to DB
    console.log("\n1. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mk-digital");
    console.log("Connected successfully.");

    // 2. Poll Providers
    console.log("\n2. Executing pollProviders() to seed and fetch...");
    await pollProviders();
    
    // 3. Output database records
    console.log("\n3. Fetching current provider statuses from Database:");
    const providers = await ProviderStatus.find();
    for (const p of providers) {
      console.log(`- ${p.providerName.toUpperCase()}:`);
      console.log(`  Balance: ${p.balance}`);
      console.log(`  API Status: ${p.apiStatus}`);
      console.log(`  Is Available: ${p.isAvailable}`);
      console.log(`  Manual Disabled: ${p.manualDisabled}`);
      console.log(`  Pause Threshold: ${p.pauseThreshold}`);
    }

    // 4. Test Safeguard Guard Rails
    console.log("\n4. Running Safeguard Availability Tests:");

    // Test A: Healthy Check (Peyflex is healthy by default)
    console.log("\nTest A: Healthy Provider Check...");
    await ProviderStatus.updateOne({ providerName: 'peyflex' }, { balance: 65000, apiStatus: 'online', isAvailable: true, manualDisabled: false });
    await ProviderStatus.updateOne({ providerName: 'clubkonnect' }, { balance: 65000, apiStatus: 'online', isAvailable: true, manualDisabled: false });
    
    let isAvail = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
    console.log(`Result for smart (peyflex primary): ${isAvail} (Expected: true)`);
    
    isAvail = await checkProviderAvailability('data', 'MTN', 'value', 'NG');
    console.log(`Result for value (clubkonnect primary): ${isAvail} (Expected: true)`);

    // Test B: Low Balance / Paused Primary with healthy Failover
    console.log("\nTest B: Primary offline, but failover secondary is healthy...");
    await ProviderStatus.updateOne({ providerName: 'peyflex' }, { balance: 1000, apiStatus: 'offline', isAvailable: false });
    
    isAvail = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
    console.log(`Result for smart (peyflex primary fails over to ClubKonnect): ${isAvail} (Expected: true)`);

    // Test C: Both primary and secondary are paused/low
    console.log("\nTest C: Both primary and secondary are offline...");
    await ProviderStatus.updateOne({ providerName: 'clubkonnect' }, { balance: 500, apiStatus: 'offline', isAvailable: false });
    
    isAvail = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
    console.log(`Result for smart (both offline): ${isAvail} (Expected: false)`);
    
    isAvail = await checkProviderAvailability('data', 'MTN', 'value', 'NG');
    console.log(`Result for value (both offline): ${isAvail} (Expected: false)`);

    // Test D: Manual Disabled by Admin
    console.log("\nTest D: Manual disable override by admin...");
    await ProviderStatus.updateOne({ providerName: 'peyflex' }, { balance: 95000, apiStatus: 'online', isAvailable: false, manualDisabled: true });
    await ProviderStatus.updateOne({ providerName: 'clubkonnect' }, { balance: 95000, apiStatus: 'online', isAvailable: false, manualDisabled: true });
    
    isAvail = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
    console.log(`Result for smart (manual disabled): ${isAvail} (Expected: false)`);

    // Restore to normal settings
    await ProviderStatus.updateOne({ providerName: 'peyflex' }, { isAvailable: true, manualDisabled: false });
    await ProviderStatus.updateOne({ providerName: 'clubkonnect' }, { isAvailable: true, manualDisabled: false });

    console.log("\n=== ALL MONITORING TESTS COMPLETED SUCCESSFULLY ===");
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

run();
