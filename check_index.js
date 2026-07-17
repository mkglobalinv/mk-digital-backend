import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const CodeIndex = mongoose.model('CodeIndex', new mongoose.Schema({}, { strict: false }), 'codeindices');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vtuapp');
  const count = await CodeIndex.countDocuments();
  console.log("Indexed files count:", count);
  await mongoose.disconnect();
}
run();
