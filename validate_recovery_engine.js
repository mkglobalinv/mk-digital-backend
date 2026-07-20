import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

import { 
    createSnapshot, 
    executeRollback, 
    getAuditLogs,
    getGithubStatus
} from './controllers/recoveryController.js';
import DeploymentAuditLog from './models/DeploymentAuditLog.js';
import Snapshot from './models/Snapshot.js';
import { requireOwner } from './middlewares/requireOwner.js';

dotenv.config();

async function runTests() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mk-digital');
    const email = 'unuktar1@gmail.com';
    let passed = 0;
    let failed = 0;
    const report = [];

    function assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    async function runTest(name, fn) {
        console.log(`\n--- Running Test: ${name} ---`);
        try {
            await fn();
            report.push(`[PASS] ${name}`);
            passed++;
        } catch (e) {
            report.push(`[FAIL] ${name} - ${e.message}`);
            console.error(e.message);
            failed++;
        }
    }

    const mockReq = (body = {}, overrides = {}) => ({ user: { email }, body, ...overrides });
    const mockRes = () => {
        const res = {};
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.data = data; return res; };
        return res;
    };

    let snapshotId = null;
    let snapshotFile = null;

    // 1. Validate Snapshot Creation & ZIP extraction behavior
    await runTest("Snapshot creation and actual ZIP structure", async () => {
        const req = mockReq({ notes: 'Automated Test Snapshot' });
        const res = mockRes();
        await createSnapshot(req, res);
        
        assert(res.data.status === 'success', `Expected success, got: ${res.data.message || 'unknown error'}`);
        assert(res.data.data, "Expected snapshot data in response");
        
        snapshotId = res.data.data._id;
        snapshotFile = res.data.data.path;
        
        assert(fs.existsSync(snapshotFile), "Snapshot zip should exist on disk");
        
        // Behavioral Validation: Verify actual ZIP extraction
        const zip = new AdmZip(snapshotFile);
        const zipEntries = zip.getEntries();
        assert(zipEntries.length > 0, "ZIP archive is empty");
        
        const hasJsonFiles = zipEntries.some(entry => entry.entryName.endsWith('.json'));
        assert(hasJsonFiles, "ZIP archive does not contain expected JSON collection dumps");
    });

    // 2. Validate Audit Logging
    await runTest("Audit logging accuracy", async () => {
        const req = mockReq();
        const res = mockRes();
        await getAuditLogs(req, res);
        const logs = res.data.data;
        const log = logs.find(l => l.user === email && l.action === 'SNAPSHOT_CREATED');
        
        assert(log, "Audit log for SNAPSHOT_CREATED not found");
        assert(log.status === 'SUCCESS', "Audit log status should be SUCCESS");
        assert(log.resultMessage.includes(snapshotFile.split(/[/\\]/).pop()), "Audit log should reference the correct file");
    });

    // 3. Validate Checksum Verification (Failure Scenario)
    await runTest("Checksum verification and corruption detection", async () => {
        const originalContent = fs.readFileSync(snapshotFile);
        
        // Modify the file to simulate corruption
        fs.appendFileSync(snapshotFile, "corrupted-data");
        
        const req = mockReq({ targetSnapshot: snapshotId });
        const res = mockRes();
        await executeRollback(req, res);
        
        assert(res.statusCode === 500, `Expected HTTP 500, got ${res.statusCode}`);
        assert(res.data.message.includes('Integrity Error') || res.data.message.includes('mismatch'), `Expected integrity error, got: ${res.data.message}`);
        
        // Restore original for subsequent tests
        fs.writeFileSync(snapshotFile, originalContent);
    });

    // 4. Validate Missing Snapshot handling (Failure Scenario)
    await runTest("Missing snapshot rejection (Graceful failure)", async () => {
        const req = mockReq({ targetSnapshot: new mongoose.Types.ObjectId() });
        const res = mockRes();
        await executeRollback(req, res);
        
        assert(res.statusCode === 500, `Expected HTTP 500, got ${res.statusCode}`);
        assert(res.data.message.includes("not found on disk") || res.data.message.includes("not found"), `Expected file not found error, got: ${res.data.message}`);
    });

    // 5. Validate Rollback & Atomic Swap Behavior
    await runTest("Database rollback and atomic collection swap", async () => {
        const req = mockReq({ targetSnapshot: snapshotId });
        const res = mockRes();
        
        await executeRollback(req, res);
        assert(res.data.status === 'success', `Rollback failed: ${res.data.message || 'unknown error'}`);
        
        // Check Audit log for restoration details
        const logsRes = mockRes();
        await getAuditLogs(req, logsRes);
        const log = logsRes.data.data.find(l => l.user === email && l.action === 'SNAPSHOT_RESTORED');
        
        assert(log, "Audit log for SNAPSHOT_RESTORED not found");
        assert(log.status === 'SUCCESS', "Audit log status should be SUCCESS");
        
        // Validate temporary collection loading and swap via audit logs extra metadata
        assert(log.collectionsRestored && log.collectionsRestored.length > 0, "Audit log should document which collections were atomically swapped");
    });

    // 6. Validate Concurrent Recovery Locking
    await runTest("Rollback concurrency lock (HTTP 409)", async () => {
        const req = mockReq({ notes: 'Concurrent' });
        const res1 = mockRes();
        const res2 = mockRes();
        
        // Execute simultaneously
        const p1 = createSnapshot(req, res1);
        const p2 = createSnapshot(req, res2);
        
        await Promise.allSettled([p1, p2]);
        assert(res1.statusCode === 409 || res2.statusCode === 409, "Expected exactly one request to return HTTP 409 Conflict due to lock");
    });

    // 7. Validate Authorization using current model (requireOwner)
    await runTest("Authorization enforcement (requireOwner)", async () => {
        const reqUnauthorized = mockReq({}, { user: { email: 'attacker@example.com' }, originalUrl: '/api/deployment/rollback' });
        const resUnauthorized = mockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };
        
        requireOwner(reqUnauthorized, resUnauthorized, next);
        
        assert(!nextCalled, "Middleware should NOT call next() for unauthorized users");
        assert(resUnauthorized.statusCode === 403, "Expected HTTP 403 for unauthorized access");
        assert(resUnauthorized.data.message.includes("Owner Privileges Required"), "Expected Access Denied message");

        // Validate success scenario
        const reqAuthorized = mockReq({}, { user: { email: 'unuktar1@gmail.com' }, originalUrl: '/api/deployment/rollback' });
        const resAuthorized = mockRes();
        let authorizedNextCalled = false;
        const nextAuth = () => { authorizedNextCalled = true; };

        requireOwner(reqAuthorized, resAuthorized, nextAuth);
        
        assert(authorizedNextCalled, "Middleware SHOULD call next() for the owner");
    });

    console.log(`\n=== FINAL REPORT ===`);
    console.log(report.join("\n"));
    console.log(`\nTests Passed: ${passed} | Tests Failed: ${failed}`);

    // Cleanup
    if (snapshotId) {
        await Snapshot.findByIdAndDelete(snapshotId);
        if (fs.existsSync(snapshotFile)) fs.unlinkSync(snapshotFile);
    }
    await DeploymentAuditLog.deleteMany({ user: email });

    await mongoose.disconnect();
}

runTests().catch(console.error);
