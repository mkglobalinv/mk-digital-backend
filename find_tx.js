import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mk-digital');
    const db = mongoose.connection.db;
    const txs = await db.collection('transactions').find({
      $or: [
        { 'history.message': { $regex: 'not found in database', $options: 'i' } },
        { message: { $regex: 'not found in database', $options: 'i' } },
        { description: { $regex: 'not found in database', $options: 'i' } },
        { history: { $elemMatch: { message: { $regex: 'not found in database', $options: 'i' } } } }
      ]
    }).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(JSON.stringify(txs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
