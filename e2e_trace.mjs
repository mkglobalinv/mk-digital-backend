import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { execSync } from 'child_process';
import mongoose from 'mongoose';
import { generateAppAssets } from './services/appAssetService.js';
import dotenv from 'dotenv';
dotenv.config();

const brandName = 'customercapp';
const buildDir = path.join(process.cwd(), 'builds', brandName);
const userAssetsDir = path.join(process.cwd(), 'reseller-assets', brandName);

function hashFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function run() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("=== PHASE 1: TRACE FIRST ===");
    console.log("Cleaning userAssetsDir to ensure fresh start (simulating normal environment)...");
    
    if (!fs.existsSync(userAssetsDir)) {
        fs.mkdirSync(userAssetsDir, { recursive: true });
    }
    const legacyApk = path.join(process.cwd(), 'reseller-assets', 'testbrandedapp', 'app-release.apk');
    const targetApk = path.join(userAssetsDir, 'app-release.apk');
    if (fs.existsSync(legacyApk)) {
        fs.copyFileSync(legacyApk, targetApk);
        console.log("Injected legacy Test Branded App into userAssetsDir to mimic user state.");
    }

    console.log("Generating App Assets...");
    let result;
    try {
        result = await generateAppAssets({
            _id: '654321098765432109876543',
            subdomain: 'customer_c_app',
            appName: 'Customer C App',
            logoUrl: 'https://placehold.co/512x512/png?text=C',
            isNativeApk: true,
            resellerId: '654321098765432109876543',
            themeColor: '#00FF00',
            businessName: 'Customer C Business',
            supportEmail: 'c@example.com',
            supportPhone: '333333333',
            apiUrl: 'https://api.example.com',
            brandName: brandName,
            appSettings: { packageName: 'com.customer.c' },
            markModified: function() {},
            save: async function() {}
        });
        console.log("Generation complete:", result);
    } catch (err) {
        console.error("Build failed:", err);
    }

    console.log("\n=== PHASE 3: HASH VERIFICATION ===");
    const gradleApkPath = path.join(buildDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const storedApkPath = path.join(userAssetsDir, 'app-release.apk');
    
    const hashGradle = hashFile(gradleApkPath);
    const hashStored = hashFile(storedApkPath);
    
    console.log("1. APK produced by Gradle:", hashGradle || "NOT FOUND");
    console.log("2. APK stored in reseller-assets:", hashStored || "NOT FOUND");
    
    if (result && result.apkUrl) {
        console.log("Supabase URL:", result.apkUrl);
        const downloadedPath = path.join(process.cwd(), 'downloaded-c.apk');
        console.log("Downloading from Supabase...");
        await downloadFile(result.apkUrl, downloadedPath);
        const hashDownloaded = hashFile(downloadedPath);
        console.log("3. APK downloaded from Supabase:", hashDownloaded);
        
        console.log("\n=== PHASE 2: INSPECT ACTUAL APK ===");
        try {
            console.log("Extracting strings from downloaded APK...");
            const data = fs.readFileSync(downloadedPath);
            // Simple buffer search
            const hasTestBranded = data.includes(Buffer.from('testbrandedapp', 'utf8')) || data.includes(Buffer.from('testbrandedapp', 'utf16le'));
            const hasTestBranded2 = data.includes(Buffer.from('Test Branded App', 'utf8')) || data.includes(Buffer.from('Test Branded App', 'utf16le'));
            const hasCustomerC = data.includes(Buffer.from('Customer C App', 'utf8')) || data.includes(Buffer.from('Customer C App', 'utf16le'));
            
            console.log(`Contains 'testbrandedapp': ${hasTestBranded}`);
            console.log(`Contains 'Test Branded App': ${hasTestBranded2}`);
            console.log(`Contains 'Customer C App': ${hasCustomerC}`);
        } catch (e) {
            console.log("Error analyzing strings:", e.message);
        }
    }
    
    await mongoose.disconnect();
}
run();
