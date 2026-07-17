import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';
import BackupLog from '../models/BackupLog.js';
import SystemSetting from '../models/SystemSetting.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Validates a backup ZIP archive by extracting it to a temporary sandbox
 * and checking for required folders and valid JSON database dumps.
 */
export const validateBackupZip = async (filePath) => {
    const tempExtractDir = path.join(BACKUP_DIR, `temp-val-${Date.now()}`);
    fs.mkdirSync(tempExtractDir, { recursive: true });
    try {
        const { execSync } = await import('child_process');
        // Extract archive using PowerShell
        execSync(`powershell -Command "Expand-Archive -Force -Path '${filePath}' -DestinationPath '${tempExtractDir}'"`);
        
        // Confirm db-json exists
        const dbJsonDir = path.join(tempExtractDir, 'db-json');
        if (!fs.existsSync(dbJsonDir)) {
            throw new Error("Database dump folder (db-json) is missing in ZIP");
        }
        
        // Confirm uploads folder exists
        const uploadsDir = path.join(tempExtractDir, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            throw new Error("Uploads folder is missing in ZIP");
        }

        // Validate database JSON files exist and are valid JSON
        const dbFiles = fs.readdirSync(dbJsonDir);
        const jsonFiles = dbFiles.filter(f => f.endsWith('.json'));
        if (jsonFiles.length === 0) {
            throw new Error("No database collection exports found in db-json");
        }
        
        for (const file of jsonFiles) {
            const content = fs.readFileSync(path.join(dbJsonDir, file), 'utf8');
            try {
                JSON.parse(content);
            } catch (e) {
                throw new Error(`Collection file '${file}' is not valid JSON: ${e.message}`);
            }
        }
        
        // Helper to recursively count files
        const countFilesInDir = (dirPath) => {
            let count = 0;
            if (fs.existsSync(dirPath)) {
                const items = fs.readdirSync(dirPath);
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    if (fs.statSync(fullPath).isDirectory()) {
                        count += countFilesInDir(fullPath);
                    } else {
                        count++;
                    }
                }
            }
            return count;
        };

        // Calculate counts
        let fileCount = countFilesInDir(uploadsDir);
        const resellerAssetsDir = path.join(tempExtractDir, 'reseller-assets');
        if (fs.existsSync(resellerAssetsDir)) {
            fileCount += countFilesInDir(resellerAssetsDir);
        }

        return {
            valid: true,
            fileCount
        };
    } catch (err) {
        console.error("[BackupService] ZIP verification check failed:", err.message);
        return {
            valid: false,
            error: err.message
        };
    } finally {
        if (fs.existsSync(tempExtractDir)) {
            try {
                fs.rmSync(tempExtractDir, { recursive: true, force: true });
            } catch (e) {
                console.error("[BackupService] Failed to clean up verification sandbox:", e.message);
            }
        }
    }
};

export const runFullBackup = async (triggeredBy = 'system') => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-full-${timestamp}.zip`;
    const outputPath = path.join(BACKUP_DIR, filename);
    
    const log = await BackupLog.create({ 
        filename, 
        type: 'full', 
        status: 'processing', 
        triggeredBy,
        storageLocation: outputPath
    });

    try {
        const output = fs.createWriteStream(outputPath);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        let fileCount = 0;
        let dbRecordsCount = 0;

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // 1. Add Uploads
        if (fs.existsSync('uploads')) {
            archive.directory('uploads/', 'uploads');
        }

        // 2. Add Reseller Assets
        if (fs.existsSync('reseller-assets')) {
            archive.directory('reseller-assets/', 'reseller-assets');
        }

        // 3. Database "Light" Backup (JSON export)
        const collectionsInfo = await mongoose.connection.db.listCollections().toArray();
        const collectionsToExclude = ['apilogs', 'systemlogs', 'adminlogs', 'backuplogs', 'sessions'];
        const collections = collectionsInfo
            .map(c => c.name)
            .filter(name => !collectionsToExclude.includes(name) && !name.startsWith('system.'));

        for (const colName of collections) {
            try {
                const data = await mongoose.connection.db.collection(colName).find({}).toArray();
                dbRecordsCount += data.length;
                archive.append(JSON.stringify(data, null, 2), { name: `db-json/${colName}.json` });
            } catch (e) {
                console.error(`[BackupService] Failed to export collection ${colName}:`, e.message);
            }
        }

        await archive.finalize();

        // Wait for output stream to close/finish writing to disk
        await new Promise((resolveStream, rejectStream) => {
            output.on('close', resolveStream);
            output.on('finish', resolveStream);
            output.on('error', rejectStream);
        });

        const stats = fs.statSync(outputPath);
        const duration = Date.now() - startTime;

        if (stats.size === 0) {
            throw new Error("Archive generation resulted in a 0-byte file.");
        }

        // 4. Validate backup ZIP integrity
        console.log(`[BackupService] Validating integrity for backup: ${filename}...`);
        const validation = await validateBackupZip(outputPath);
        if (!validation.valid) {
            throw new Error(`Integrity validation failed: ${validation.error}`);
        }

        // Compute checksum
        const fileBuffer = fs.readFileSync(outputPath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const checksum = hashSum.digest('hex');

        // Extract stats from validation
        fileCount = validation.fileCount;

        log.status = 'verified';
        log.size = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
        log.fileCount = fileCount;
        log.dbRecordsCount = dbRecordsCount;
        log.checksum = checksum;
        log.durationMs = duration;
        await log.save();

        console.log(`[BackupService] Full backup completed and validated successfully: ${filename} (${log.size}), Files: ${fileCount}, DB Records: ${dbRecordsCount}, Checksum: ${checksum.substring(0, 10)}...`);
        
        await pruneOldBackups();
        return log;

    } catch (err) {
        console.error("[BackupService] Backup failed:", err);
        log.status = 'invalid';
        log.error = err.message;
        await log.save();
        if (fs.existsSync(outputPath)) {
            try {
                fs.unlinkSync(outputPath);
            } catch (unlinkErr) {
                console.error("[BackupService] Failed to cleanup failed zip:", unlinkErr.message);
            }
        }
        return log;
    }
};

const pruneOldBackups = async () => {
    try {
        const settings = await SystemSetting.findOne();
        const retentionDays = settings?.infrastructure?.backupRetentionDays || 7;
        
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);

        const oldLogs = await BackupLog.find({ 
            createdAt: { $lt: cutoff },
            status: 'success'
        });

        for (const log of oldLogs) {
            const filePath = path.join(BACKUP_DIR, log.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await BackupLog.findByIdAndDelete(log._id);
        }
        
        if (oldLogs.length > 0) {
            console.log(`[BackupService] Pruned ${oldLogs.length} old backups.`);
        }
    } catch (err) {
        console.error("[BackupService] Pruning failed:", err);
    }
};

/**
 * Rollback & Recovery system
 * Extracts backup ZIP and restores MongoDB collections and uploads directory
 */
export const restoreBackup = async (filename, dryRun = false) => {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${filename}`);
    }

    const log = await BackupLog.findOne({ filename });
    if (log && log.status !== 'success' && log.status !== 'verified' && log.status !== 'valid') {
        throw new Error(`Cannot rollback from an invalid or failed backup: ${filename} (Status: ${log.status})`);
    }

    const stats = fs.statSync(backupPath);
    if (stats.size === 0) {
        throw new Error(`Cannot rollback from an empty backup file: ${filename}`);
    }

    const startTime = Date.now();
    const tempExtractDir = path.join(BACKUP_DIR, `temp-restore-${Date.now()}`);
    fs.mkdirSync(tempExtractDir, { recursive: true });

    try {
        console.log(`[BackupService] Extraction initiated for restore: ${filename}...`);
        
        // Extract archive using PowerShell (Windows Native Expand-Archive)
        const { execSync } = await import('child_process');
        execSync(`powershell -Command "Expand-Archive -Force -Path '${backupPath}' -DestinationPath '${tempExtractDir}'"`);
        
        console.log(`[BackupService] Extraction complete. Restoring Database Collections...`);

        // 1. Restore JSON database exports
        const dbJsonDir = path.join(tempExtractDir, 'db-json');
        if (fs.existsSync(dbJsonDir)) {
            const files = fs.readdirSync(dbJsonDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const colName = file.replace('.json', '');
                    const filePath = path.join(dbJsonDir, file);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const rawData = JSON.parse(fileContent);

                    // Convert string IDs back to ObjectId if necessary
                    const data = rawData.map(doc => {
                        const cleanDoc = { ...doc };
                        if (cleanDoc._id && typeof cleanDoc._id === 'object' && cleanDoc._id.$oid) {
                            cleanDoc._id = new mongoose.Types.ObjectId(cleanDoc._id.$oid);
                        } else if (cleanDoc._id && typeof cleanDoc._id === 'string' && cleanDoc._id.length === 24) {
                            cleanDoc._id = new mongoose.Types.ObjectId(cleanDoc._id);
                        }
                        // Check other ObjectId fields if present
                        ['userId', 'resellerId', 'adminId', 'parentTransactionId'].forEach(field => {
                            if (cleanDoc[field] && typeof cleanDoc[field] === 'object' && cleanDoc[field].$oid) {
                                cleanDoc[field] = new mongoose.Types.ObjectId(cleanDoc[field].$oid);
                            } else if (cleanDoc[field] && typeof cleanDoc[field] === 'string' && cleanDoc[field].length === 24) {
                                cleanDoc[field] = new mongoose.Types.ObjectId(cleanDoc[field]);
                            }
                        });
                        return cleanDoc;
                    });

                    console.log(`[BackupService] [Restore Test] Validated collection '${colName}' (${data.length} records).`);
                    
                    if (!dryRun) {
                        console.log(`[BackupService] Restoring collection '${colName}' (${data.length} records)...`);
                        // Clear collection
                        await mongoose.connection.db.collection(colName).deleteMany({});
                        // Insert records
                        if (data.length > 0) {
                            await mongoose.connection.db.collection(colName).insertMany(data);
                        }
                    }
                }
            }
        }

        // 2. Restore Uploads Directory
        const uploadsDir = path.join(tempExtractDir, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            if (!dryRun) {
                console.log(`[BackupService] Restoring uploads folder...`);
                fs.cpSync(uploadsDir, path.join(process.cwd(), 'uploads'), { recursive: true, force: true });
            } else {
                console.log(`[BackupService] [Restore Test] Verified uploads folder exists.`);
            }
        }

        // 3. Restore Reseller Assets Directory
        const resellerAssetsDir = path.join(tempExtractDir, 'reseller-assets');
        if (fs.existsSync(resellerAssetsDir)) {
            if (!dryRun) {
                console.log(`[BackupService] Restoring reseller-assets folder...`);
                fs.cpSync(resellerAssetsDir, path.join(process.cwd(), 'reseller-assets'), { recursive: true, force: true });
            } else {
                console.log(`[BackupService] [Restore Test] Verified reseller-assets folder exists.`);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[BackupService] Database & file restoration completed successfully in ${duration}ms. dryRun=${dryRun}`);
        return { success: true, durationMs: duration, dryRun };

    } catch (err) {
        console.error("[BackupService Error] Restoration failed:", err);
        throw err;
    } finally {
        // Cleanup temporary extract workspace
        if (fs.existsSync(tempExtractDir)) {
            fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }
    }
};

/**
 * Scheduled task starter
 */
export const initBackupScheduler = () => {
    // Run daily at 3 AM
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        3, 0, 0 // 3:00:00
    );
    const msToWait = night.getTime() - now.getTime();

    setTimeout(() => {
        runFullBackup('system');
        setInterval(() => runFullBackup('system'), 24 * 60 * 60 * 1000);
    }, msToWait);

    console.log(`[BackupService] Scheduler initialized. Next run in ${(msToWait / 1000 / 3600).toFixed(1)} hours.`);
};
