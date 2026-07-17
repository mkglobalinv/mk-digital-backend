import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderStatus from '../models/ProviderStatus.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { pollProviders, checkProviderAvailability } from '../services/providerMonitoringService.js';

dotenv.config();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runTests() {
  console.log("=========================================");
  console.log("STARTING TELEMETRY & HEALTH SYSTEM TESTS");
  console.log("=========================================");

  const connString = process.env.MONGO_URI || "mongodb://localhost:27017/vtuapp";
  await mongoose.connect(connString);
  console.log("Database connected successfully ✅");

  // 1. Reset seeded provider records for testing
  console.log("\n[Test 1] Resetting provider status configurations...");
  await ProviderStatus.deleteMany({});
  
  // 2. Run pollProviders once to seed
  console.log("\n[Test 2] Running pollProviders to seed default configurations...");
  await pollProviders();
  
  let peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
  console.log(`Seeded Peyflex: Balance=₦${peyflex.balance}, Available=${peyflex.isAvailable}, Status=${peyflex.apiStatus}, Latency=${peyflex.latency}ms`);
  
  // 3. Test Low Balance Warning Alert Simulation
  console.log("\n[Test 3] Simulating Low Balance Warning threshold (Warning < 50000)...");
  peyflex.balance = 45000;
  peyflex.warningThreshold = 50000;
  peyflex.lastAlertSent = null; // Clear cooldown
  await peyflex.save();
  await pollProviders();
  peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
  console.log(`Peyflex status updated to: ${peyflex.apiStatus} (Balance=${peyflex.balance})`);

  // 4. Test Critical / Empty Balance Simulation
  console.log("\n[Test 4] Simulating Critical Balance / Empty threshold (Critical < 10000)...");
  peyflex.balance = 5000;
  peyflex.criticalThreshold = 10000;
  peyflex.lastCriticalAlertSent = null; // Clear cooldown
  await peyflex.save();
  await pollProviders();
  peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
  console.log(`Peyflex status updated to: ${peyflex.apiStatus} (Balance=${peyflex.balance})`);

  // 5. Test Auto Pause / Shutoff Simulation
  console.log("\n[Test 5] Simulating Auto-Pause threshold (Pause < 2000)...");
  peyflex.balance = 1500;
  peyflex.pauseThreshold = 2000;
  await peyflex.save();
  await pollProviders();
  peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
  console.log(`Peyflex availability after low balance auto-pause: isAvailable=${peyflex.isAvailable}`);

  // 6. Test Offline & Timeout Consecutive Failure Simulation
  console.log("\n[Test 6] Simulating Consecutive connection failures and transition to disconnected (Failure >= 3)...");
  // We mock a failure scenario by updating failureCount directly to 2, then running pollProviders with empty/unreachable setup
  peyflex.failureCount = 2;
  peyflex.lastOfflineAlertSent = null;
  await peyflex.save();
  
  // To trigger isOnline=false we can temporarily poison the Peyflex API Token in process.env
  const originalToken = process.env.PEYFLEX_API_TOKEN;
  process.env.PEYFLEX_API_TOKEN = ''; 
  
  await pollProviders();
  
  peyflex = await ProviderStatus.findOne({ providerName: 'peyflex' });
  console.log(`Peyflex failure count incremented: ${peyflex.failureCount}`);
  console.log(`Peyflex apiStatus after consecutive failures: ${peyflex.apiStatus} (Expected: disconnected)`);
  
  // Restore token
  process.env.PEYFLEX_API_TOKEN = originalToken;

  // 7. Test checkProviderAvailability safety guards
  console.log("\n[Test 7] Verifying checkProviderAvailability safety guards...");
  // Clubkonnect is seed-healthy by default.
  // Peyflex is disconnected.
  // Test smart option data purchase (fails over from Peyflex to Clubkonnect)
  let dataAvail = await checkProviderAvailability('data', 'MTN', 'smart', 'NG');
  console.log(`Smart option data availability: ${dataAvail} (Expected: true - failover available)`);

  // Test clubkonnect-only service (like cable) availability
  let clubkon = await ProviderStatus.findOne({ providerName: 'clubkonnect' });
  clubkon.isAvailable = false; // Disable clubkonnect
  await clubkon.save();
  
  let cableAvail = await checkProviderAvailability('cable', 'DSTV', 'smart', 'NG');
  console.log(`Clubkonnect-only cable availability after shutoff: ${cableAvail} (Expected: false)`);

  // Restore Clubkonnect
  clubkon.isAvailable = true;
  await clubkon.save();

  // 8. Test Transaction Failure Spike Simulation
  console.log("\n[Test 8] Simulating transaction failure spike check...");
  // Find or create a mock user
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: "Test User",
      email: "test_health_system@example.com",
      password: "password123",
      transactionPin: "123456"
    });
  }

  // Create 11 mock failed transactions in the last 2 minutes
  console.log("Creating 11 mock failed transactions to simulate spike...");
  for (let i = 0; i < 11; i++) {
    await Transaction.create({
      userId: user._id,
      amount: 100,
      type: 'debit',
      status: 'failed',
      reference: `MOCK-FAIL-${i}-${Date.now()}`,
      description: 'MTN Data 1GB',
      createdAt: new Date()
    });
  }

  // Trigger pollProviders (which calls checkTransactionSpikes)
  console.log("Running pollProviders to check transaction spike alerts...");
  await pollProviders();
  
  // Clean up mock transactions
  console.log("Cleaning up mock test transactions...");
  await Transaction.deleteMany({ reference: /MOCK-FAIL-/ });

  console.log("\n=========================================");
  console.log("ALL TELEMETRY & HEALTH SYSTEM TESTS DONE!");
  console.log("=========================================");
  
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
