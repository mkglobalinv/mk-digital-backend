import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

async function testConnection() {
  console.log('Testing connection to MongoDB...');
  console.log('URI:', uri.replace(/:[^:]*@/, ':****@')); // Hide password

  try {
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testConnection();
