import 'dotenv/config';
import mongoose from 'mongoose';
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
     const result = await mongoose.connection.collection('users').updateOne(
         { email: 'billsplashtest@example.com' },
         { $set: { name: 'Billsplash Test' } }
     );
     console.log('Updated:', result.modifiedCount);
  } catch(e) { console.error(e); }
  await mongoose.disconnect();
}
run().catch(console.error);
