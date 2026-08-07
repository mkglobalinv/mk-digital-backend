import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import DataPlan from './models/DataPlan.js';
import Transaction from './models/Transaction.js';
import { processIdentityService } from './controllers/identityController.js';
import fs from 'fs';

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI);
  let logOutput = "=== FINAL PRODUCTION VERIFICATION LOG ===\n\n";

  const user = await User.findOne({ role: 'user' });
  if(!user) {
    console.log("No retail user found");
    process.exit(0);
  }
  
  const initialBalance = user.balance1;
  const plan = await DataPlan.findOne({ api_plan_id: 'nin-verify' });
  
  logOutput += `Test User: ${user.email} | Initial Balance: ₦${initialBalance}\n`;
  logOutput += `Test Plan: ${plan.plan_name} | Price: ₦${plan.selling_price}\n\n`;

  // Helper function to mock Express res
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };

  // 1. INSUFFICIENT BALANCE TEST
  await User.findByIdAndUpdate(user._id, { balance1: 0 });
  
  let res1 = mockRes();
  await processIdentityService({
    body: { serviceId: 'nin-verify', params: { nin: '12345678901' } },
    user: user
  }, res1);
  
  logOutput += `--- Test 1: Insufficient Balance ---\n`;
  logOutput += `Status: ${res1.statusCode}\n`;
  logOutput += `Response: ${JSON.stringify(res1.data)}\n\n`;

  // 2. INVALID PARAMETERS TEST
  let res2 = mockRes();
  await processIdentityService({
    body: { params: { nin: '12345678901' } },
    user: user
  }, res2);
    
  logOutput += `--- Test 2: Invalid Parameters ---\n`;
  logOutput += `Status: ${res2.statusCode}\n`;
  logOutput += `Response: ${JSON.stringify(res2.data)}\n\n`;

  // 3. SUCCESSFUL LIVE REQUEST
  await User.findByIdAndUpdate(user._id, { balance1: 50000 });
  
  let res3 = mockRes();
  await processIdentityService({
    body: { serviceId: 'nin-verify', params: { nin: '59296057864' }, reference: 'TEST-NIN-' + Date.now() },
    user: user
  }, res3);
    
  logOutput += `--- Test 3: Live Verification ---\n`;
  logOutput += `Status: ${res3.statusCode || 200}\n`;
  logOutput += `Response: ${JSON.stringify(res3.data)}\n\n`;

  // 4. TRANSACTION INTEGRITY
  const tx = await Transaction.findOne({ userId: user._id, description: plan.plan_name }).sort({createdAt: -1});
  if(tx) {
    logOutput += `--- Test 4: Transaction Record ---\n`;
    logOutput += `Status: ${tx.status}\n`;
    logOutput += `Reference: ${tx.reference}\n`;
    logOutput += `Amount: ₦${tx.amount}\n`;
    logOutput += `Provider Used: ${tx.provider_used}\n`;
  } else {
    logOutput += `No transaction found.\n`;
  }
  
  // Clean up
  await User.findByIdAndUpdate(user._id, { balance1: initialBalance });
  
  fs.writeFileSync('verification_results.txt', logOutput);
  console.log("Done testing. Output written to verification_results.txt");
  
  await mongoose.disconnect();
}

runTests().catch(console.error);
