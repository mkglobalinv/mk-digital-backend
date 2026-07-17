import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import PricingRule from '../models/PricingRule.js';
import DataPlan from '../models/DataPlan.js';
import ResellerRequest from '../models/ResellerRequest.js';
import SystemSetting from '../models/SystemSetting.js';
import Setting from '../models/Setting.js';
import Withdrawal from '../models/Withdrawal.js';

dotenv.config();

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'pre_launch_backup');

async function runBackup() {
    console.log('Starting Pre-Launch Backup...');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log(`Created backup directory: ${BACKUP_DIR}`);
        }

        const collections = [
            { name: 'users', model: User },
            { name: 'transactions', model: Transaction },
            { name: 'pricingrules', model: PricingRule },
            { name: 'dataplans', model: DataPlan },
            { name: 'resellerrequests', model: ResellerRequest },
            { name: 'systemsettings', model: SystemSetting },
            { name: 'settings', model: Setting },
            { name: 'withdrawals', model: Withdrawal }
        ];

        for (const col of collections) {
            console.log(`Backing up ${col.name}...`);
            const data = await col.model.find({}).lean();
            const filePath = path.join(BACKUP_DIR, `${col.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved ${data.length} records to ${filePath}`);
        }

        console.log('Backup completed successfully.');
    } catch (err) {
        console.error('Error during backup:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

runBackup();
