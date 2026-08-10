require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.connection.collection('users');
  const ServiceRequest = mongoose.connection.collection('servicerequests');
  const Transaction = mongoose.connection.collection('transactions');
  
  const testUser = await User.findOne({ email: 'test_nin_verifier@example.com' });
  if (!testUser) {
    console.error("Test user not found");
    process.exit(1);
  }

  // Find latest service request for this user
  const reqs = await ServiceRequest.find({ user: testUser._id }).sort({ createdAt: -1 }).limit(1).toArray();
  const req = reqs[0];
  if (!req) {
    console.error("No ServiceRequest found");
    process.exit(1);
  }
  
  console.log("=== SERVICE REQUEST ===");
  console.log(`Status: ${req.status}`);
  console.log(`Service Type: ${req.serviceType}`);
  console.log(`Amount: ${req.amount}`);
  console.log(`Expected Processing Time: ${req.expectedProcessingTime}`);
  console.log(`WhatsApp: ${req.whatsappNumber}`);
  console.log(`Reference: ${req.reference}`);
  console.log(`Storage Key exists: ${!!req.documents?.[0]?.storageKey}`);
  console.log(`Profit Distributed: ${req.profitDistributed}`);
  console.log("Submitted Data:", JSON.stringify(req.submittedData, null, 2));

  // Find transaction
  const txs = await Transaction.find({ user: testUser._id, reference: req.reference }).toArray();
  console.log("=== TRANSACTIONS ===");
  console.log(`Count: ${txs.length}`);
  if (txs.length > 0) {
    console.log(`Amount: ${txs[0].amount}`);
    console.log(`Type: ${txs[0].type}`);
  }

  console.log("=== WALLET BALANCE ===");
  console.log(`Current Balance: ${testUser.walletBalance}`);

  process.exit(0);
});
