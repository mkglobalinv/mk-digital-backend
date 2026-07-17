const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('servicestatuses');
    
    const docs = await collection.find({}).toArray();
    console.log("=== ALL DOCUMENTS IN SERVICESTATUS ===");
    docs.forEach((doc, i) => {
      console.log(`[${i+1}]`);
      console.log(JSON.stringify(doc, null, 2));
    });
    
    console.log("\n=== SUMMARY ===");
    const coreServices = ["Data", "Airtime", "Cable", "Electricity", "Exam Pins"];
    for (const service of coreServices) {
      const exists = docs.find(d => d.serviceName === service);
      if (exists) {
        console.log(`- ${service}: YES`);
      } else {
        console.log(`- ${service}: NO`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
