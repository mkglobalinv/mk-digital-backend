import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProviderCategory from './models/ProviderCategory.js';
import CategoryRouting from './models/CategoryRouting.js';
import ProviderStatus from './models/ProviderStatus.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing from environment variables.");
  process.exit(1);
}

const DEFAULT_CATEGORIES = [
  'MTN SME',
  'MTN Corporate',
  'Airtel SME',
  'Airtel Corporate',
  'Glo SME',
  'Glo Corporate',
  '9MOBILE SME',
  '9MOBILE Corporate'
];

const seedProvidersAndCategories = async () => {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Seed ProviderStatus records if they don't exist
    const providers = ['peyflex', 'clubkonnect', 'connectbridge', 'reloadly', 'billsplash'];
    for (const name of providers) {
      await ProviderStatus.findOneAndUpdate(
        { providerName: name },
        { providerName: name, isAvailable: true, priority: 2 },
        { upsert: true, new: true }
      );
    }
    console.log('Providers verified.');

    // 2. Clear old categories and seed ProviderCategory for each provider
    console.log('Clearing old ProviderCategory data...');
    await ProviderCategory.deleteMany({});
    
    console.log('Seeding ProviderCategory records...');
    for (const provider of providers) {
      const docs = DEFAULT_CATEGORIES.map(cat => ({
        provider_name: provider,
        category_name: cat,
        status: 'ACTIVE',
        visibility: 'VISIBLE',
        maintenance_message: ''
      }));
      await ProviderCategory.insertMany(docs);
    }

    // 3. Seed CategoryRouting records
    console.log('Clearing old CategoryRouting data...');
    await CategoryRouting.deleteMany({});
    
    console.log('Seeding CategoryRouting records...');
    const routingDocs = DEFAULT_CATEGORIES.map(cat => ({
      global_category_name: cat,
      primary_provider: 'billsplash',
      fallback_provider: 'peyflex',
      backup_provider: 'connectbridge',
      status: 'ACTIVE'
    }));
    await CategoryRouting.insertMany(routingDocs);

    console.log('Database Seeding Completed Successfully! The Provider Architecture is ready.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedProvidersAndCategories();
