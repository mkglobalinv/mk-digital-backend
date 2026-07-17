import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getMonitoringStats, getTelemetry } from './controllers/adminController.js';
import ProviderStatus from './models/ProviderStatus.js';

dotenv.config();

const testApis = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected.');

        // Mock req/res
        const resStats = {
            json: (data) => console.log('--- STATS ---', JSON.stringify(data, null, 2)),
            status: (code) => ({ json: (data) => console.log(`Stats Error ${code}:`, data) })
        };
        await getMonitoringStats({ query: {} }, resStats);

        const resTelemetry = {
            json: (data) => console.log('--- TELEMETRY ---', JSON.stringify(data, null, 2)),
            status: (code) => ({ json: (data) => console.log(`Telemetry Error ${code}:`, data) })
        };
        await getTelemetry({ query: {} }, resTelemetry);

        const providers = await ProviderStatus.find().sort({ providerName: 1 });
        console.log('--- PROVIDERS ---', JSON.stringify(providers, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Crash:', e);
        process.exit(1);
    }
};

testApis();
