/**
 * Upload 9JASUB-Android.apk to Supabase Storage
 * Run: node scripts/upload_jasub_apk.cjs
 *
 * This uses the same Supabase credentials as the backend.
 * After upload, prints the permanent public URL which must be
 * placed in NEXT_PUBLIC_APP_DOWNLOAD_URL in mk-subdata-website/.env.local
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
const envRaw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
for (const line of envRaw.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
}

const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'jasub-app-releases'; // Dedicated bucket for main app releases (NOT the reseller bucket)
const FILENAME = '9JASUB-Android.apk';
const APK_PATH = path.join(__dirname, '..', FILENAME);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env");
    process.exit(1);
}

if (!fs.existsSync(APK_PATH)) {
    console.error("ERROR: APK not found at " + APK_PATH);
    console.error("Run: node scripts/build_main_jasub_apk.cjs first");
    process.exit(1);
}

const apkBuffer = fs.readFileSync(APK_PATH);
const apkSize = apkBuffer.length;

// Verify APK magic header
if (!(apkBuffer[0] === 0x50 && apkBuffer[1] === 0x4B && apkBuffer[2] === 0x03 && apkBuffer[3] === 0x04)) {
    console.error("ERROR: File does not have a valid APK/ZIP magic header. Aborting upload.");
    process.exit(1);
}
console.log("[OK] APK verified: valid ZIP/APK magic header");
console.log("[OK] APK size: " + (apkSize / 1024 / 1024).toFixed(2) + " MB");

async function makeRequest(method, url, headers, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request({
            method,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            headers: { ...headers, 'Content-Length': body ? body.length : 0 }
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function ensureBucket() {
    console.log(`\nChecking bucket '${BUCKET}'...`);
    const res = await makeRequest('GET',
        `${SUPABASE_URL}/storage/v1/bucket`,
        { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY }
    );
    const buckets = JSON.parse(res.body);
    const exists = Array.isArray(buckets) && buckets.some(b => b.name === BUCKET);
    if (!exists) {
        console.log(`Creating bucket '${BUCKET}'...`);
        const body = Buffer.from(JSON.stringify({ name: BUCKET, public: true }));
        const cr = await makeRequest('POST',
            `${SUPABASE_URL}/storage/v1/bucket`,
            {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'apikey': SUPABASE_SERVICE_KEY,
                'Content-Type': 'application/json'
            },
            body
        );
        if (cr.status >= 400) {
            console.error("Bucket creation failed:", cr.body);
            process.exit(1);
        }
        console.log("[OK] Bucket created.");
    } else {
        console.log("[OK] Bucket exists.");
    }
}

async function uploadApk() {
    // Delete existing file first (upsert via delete + upload)
    console.log(`\nDeleting any existing '${FILENAME}' from bucket...`);
    await makeRequest('DELETE',
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${FILENAME}`,
        { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY }
    );

    console.log(`\nUploading ${FILENAME} (${(apkSize / 1024 / 1024).toFixed(2)} MB)...`);
    const uploadRes = await makeRequest(
        'POST',
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${FILENAME}`,
        {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/vnd.android.package-archive',
            'x-upsert': 'true',
        },
        apkBuffer
    );

    if (uploadRes.status >= 400) {
        console.error("Upload failed (" + uploadRes.status + "):", uploadRes.body);
        process.exit(1);
    }
    console.log("[OK] Upload response:", uploadRes.body);

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FILENAME}`;
    console.log("\n=== UPLOAD SUCCESS ===");
    console.log("Bucket:     " + BUCKET);
    console.log("Filename:   " + FILENAME);
    console.log("Public URL: " + publicUrl);

    // Verify: download first 4 bytes and confirm ZIP/APK header
    console.log("\nVerifying download returns actual APK binary...");
    const verifyRes = await makeRequest('GET', publicUrl, { 'Range': 'bytes=0-3' });
    const raw = Buffer.from(verifyRes.body, 'binary');
    const firstBytes = Buffer.from(verifyRes.body.slice(0,4), 'binary');

    // Status 206 = partial content OK, 200 = full content
    if (verifyRes.status === 200 || verifyRes.status === 206) {
        const bodyBuf = Buffer.from(verifyRes.body, 'binary');
        const isPK = bodyBuf[0] === 0x50 && bodyBuf[1] === 0x4B;
        if (isPK) {
            console.log("[OK] Download verification: APK binary confirmed (PK header present)");
        } else {
            // Some servers return full content even with Range header; check if it starts with PK
            const isFullPK = bodyBuf.slice(0,2).toString('hex') === '504b';
            console.log("[INFO] First bytes hex: " + bodyBuf.slice(0,4).toString('hex') + " (PK=504b)");
            if (!isFullPK) {
                console.warn("[WARN] Could not confirm APK header from range response — check URL manually");
            }
        }
    } else {
        console.warn("[WARN] Unexpected verification status: " + verifyRes.status);
        console.warn("Response body: " + verifyRes.body.slice(0, 200));
    }

    console.log("\n=== ADD TO WEBSITE ENV ===");
    console.log("Add this to mk-subdata-website/.env.local and production env:");
    console.log(`NEXT_PUBLIC_APP_DOWNLOAD_URL=${publicUrl}`);
}

ensureBucket().then(uploadApk).catch(err => { console.error("Fatal:", err); process.exit(1); });
