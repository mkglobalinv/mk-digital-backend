import AppBuildJob from "../models/AppBuildJob.js";
import User from "../models/User.js";
import { generateAppAssets } from "./appAssetService.js";
import SystemSetting from "../models/SystemSetting.js";
import logger from "./loggerService.js";
import fs from "fs";
import path from "path";
import socketService from "./socketService.js";
import AppRequest from "../models/AppRequest.js";
import Notification from "../models/Notification.js";

class AppJobQueue {
    constructor() {
        this.concurrency = 3;
        this.activeJobs = 0;
        this.isProcessing = false;
        this.pollInterval = 5000; // Poll every 5 seconds
        this.timer = null;
    }

    start() {
        this.recoverOrphanedJobs().then(() => {
            if (!this.timer) {
                console.log("[JobQueue] Starting App Build Queue Processor...");
                this.timer = setInterval(() => this.processQueue(), this.pollInterval);
                this.processQueue();
            }
        }).catch(err => console.error("Error recovering jobs:", err));
        if (!this.cleanupTimer) {
            console.log("[JobQueue] Starting Auto-Cleanup Service...");
            // Run cleanup every 12 hours
            this.cleanupTimer = setInterval(() => this.runAutoCleanup(), 12 * 60 * 60 * 1000);
            this.runAutoCleanup();
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log("[JobQueue] Stopped App Build Queue Processor.");
        }
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    async recoverOrphanedJobs() {
        try {
            const result = await AppBuildJob.updateMany(
                { status: "processing" },
                { 
                    $set: { status: "queued", stage: "Recovered from server crash", attempts: 0 },
                    $push: { buildLogs: "[System] Recovered orphaned job and reset status to queued." }
                }
            );
            if (result.modifiedCount > 0) {
                logger.info(`Recovered ${result.modifiedCount} orphaned jobs after restart.`);
            }
        } catch (e) {
            logger.error("Error recovering orphaned jobs", { error: e.message });
        }
    }

    async processQueue() {
        if (this.activeJobs >= this.concurrency) return;

        // Try to pick up a queued job atomically
        try {
            const availableSlots = this.concurrency - this.activeJobs;
            if (availableSlots <= 0) return;

            const job = await AppBuildJob.findOneAndUpdate(
                { status: "queued" },
                { 
                    $set: { 
                        status: "processing", 
                        stage: "Initializing Build Runner",
                        progressPct: 5
                    },
                    $push: { buildLogs: "Worker picked up job. Starting build sequence..." }
                },
                { sort: { createdAt: 1 }, returnDocument: 'after' }
            );

            if (job) {
                this.activeJobs++;
                console.log(`[JobQueue] Picked up job ${job._id}. Active jobs: ${this.activeJobs}/${this.concurrency}`);
                
                // Execute in background
                this.executeJob(job).catch(err => {
                    console.error(`[JobQueue] Unhandled execution error for ${job._id}:`, err);
                }).finally(() => {
                    this.activeJobs--;
                    // Try to process next after a brief delay to avoid tight CPU loops
                    setTimeout(() => this.processQueue(), 1000);
                });
            }
        } catch (err) {
            console.error("[JobQueue] Error polling for jobs:", err.message);
        }
    }

    async executeJob(job) {
        const timeoutMs = 10 * 60 * 1000; // 10 minute timeout
        let timeoutHandle;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error("Build process timed out after 10 minutes."));
            }, timeoutMs);
        });

        try {
            const user = await User.findById(job.resellerId);
            if (!user) {
                throw new Error("Reseller account not found.");
            }

            // Increment attempts
            await AppBuildJob.findByIdAndUpdate(job._id, { $inc: { attempts: 1 } });

            // Update AppRequest status to Sending to Builder...
            await AppRequest.findOneAndUpdate(
                { resellerId: job.resellerId },
                { status: 'Sending to Builder...', adminNotes: 'Initializing compiler environment...' }
            );
            socketService.emitAppBuildStatus(job.resellerId, { 
                status: 'Sending to Builder...',
                adminNotes: 'Initializing compiler environment...'
            });

            // Execute build with timeout protection
            await Promise.race([
                generateAppAssets(user, job._id),
                timeoutPromise
            ]);

            logger.info(`Job completed successfully: ${job._id}`, { resellerId: user._id });

            socketService.emitActivity({
                type: 'build_completed',
                message: `Build compilation for brand '${job.appName}' was completed successfully!`,
                details: { appName: job.appName, resellerName: user.name }
            });

        } catch (err) {
            clearTimeout(timeoutHandle);
            logger.buildError(job._id, job.resellerId, "Build Execution Failed", err);
            
            const updatedJob = await AppBuildJob.findById(job._id);
            if (updatedJob && updatedJob.attempts < updatedJob.maxAttempts) {
                await AppBuildJob.findByIdAndUpdate(job._id, {
                    status: "queued",
                    stage: "Queued for Retry",
                    $push: { buildLogs: `[System] Warning: ${err.message}. Re-queuing (${updatedJob.attempts + 1}/${updatedJob.maxAttempts}).` }
                });

                await AppRequest.findOneAndUpdate(
                    { resellerId: job.resellerId },
                    { 
                        status: 'Build in Progress...', 
                        adminNotes: `Build attempt ${updatedJob.attempts} failed: ${err.message}. Retrying automatically (${updatedJob.attempts + 1}/${updatedJob.maxAttempts})...`
                    }
                );
                socketService.emitAppBuildStatus(job.resellerId, {
                    status: 'Build in Progress...',
                    adminNotes: `Build attempt ${updatedJob.attempts} failed: ${err.message}. Retrying automatically (${updatedJob.attempts + 1}/${updatedJob.maxAttempts})...`
                });
            } else if (updatedJob) {
                await AppBuildJob.findByIdAndUpdate(job._id, {
                    status: "failed",
                    failedAt: new Date(),
                    stage: "Permanent Failure",
                    errorDetails: err.message,
                    $push: { buildLogs: `[System] Fatal: ${err.message}. Max attempts reached.` }
                });

                await AppRequest.findOneAndUpdate(
                    { resellerId: job.resellerId },
                    { 
                        status: 'Build Failed', 
                        adminNotes: `Build failed permanently after ${updatedJob.maxAttempts} attempts. Reason: ${err.message}` 
                    }
                );
                
                const resellerUser = await User.findById(job.resellerId);
                if (resellerUser) {
                    if (!resellerUser.appSettings) resellerUser.appSettings = {};
                    resellerUser.appSettings.managedStatus = 'Build Failed';
                    resellerUser.markModified('appSettings');
                    await resellerUser.save();
                }

                socketService.emitAppBuildStatus(job.resellerId, {
                    status: 'Build Failed',
                    adminNotes: `Build failed permanently after ${updatedJob.maxAttempts} attempts. Reason: ${err.message}`
                });

                socketService.emitActivity({
                    type: 'build_failed',
                    message: `Build compilation for brand '${job.appName}' permanently failed: ${err.message}`,
                    details: { appName: job.appName, error: err.message }
                });

                // Notify admin of the failure
                try {
                    const admins = await User.find({ role: 'admin' });
                    for (const admin of admins) {
                        await Notification.create({
                            userId: admin._id,
                            title: "Reseller App Build Failure",
                            message: `App compilation for brand '${job.appName}' (Reseller ID: ${job.resellerId}) permanently failed: ${err.message}`,
                            type: 'warning'
                        });
                    }
                } catch (notifyErr) {
                    console.error("Failed to create admin notification:", notifyErr);
                }
            }
        } finally {
            clearTimeout(timeoutHandle);
        }
    }

    async enqueueJob(resellerId, appName, packageName) {
        // Prevent duplicate active jobs
        const existingJob = await AppBuildJob.findOne({
            resellerId,
            status: { $in: ["queued", "processing"] }
        });

        if (existingJob) {
            return existingJob;
        }

        const job = await AppBuildJob.create({
            resellerId,
            appName,
            packageName,
            status: "queued",
            stage: "Queued for background compilation",
            progressPct: 0,
            buildLogs: ["Job submitted to automated build engine..."]
        });

        // Trigger processing after a short delay to allow HTTP response to complete cleanly
        setTimeout(() => this.processQueue(), 2000);
        return job;
    }

    async runAutoCleanup() {
        try {
            console.log("[JobQueue] Running Auto-Cleanup Task...");
            
            // Get settings for retention
            const settings = await SystemSetting.findOne();
            const retentionDays = settings?.infrastructure?.cleanupRetentionDays || 7;
            const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
            const cleanupThreshold = new Date(Date.now() - retentionMs);

            // Delete database jobs older than retention threshold
            const result = await AppBuildJob.deleteMany({
                createdAt: { $lt: cleanupThreshold },
                status: { $in: ["completed", "failed"] }
            });
            if (result.deletedCount > 0) {
                console.log(`[JobQueue] Purged ${result.deletedCount} old build records.`);
            }
            
            // Clean up temporary build folders (workspace) older than 24h
            const buildsDir = path.join(process.cwd(), 'builds');
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (fs.existsSync(buildsDir)) {
                const folders = fs.readdirSync(buildsDir);
                for (const folder of folders) {
                    const folderPath = path.join(buildsDir, folder);
                    const stats = fs.statSync(folderPath);
                    if (stats.mtimeMs < oneDayAgo) {
                        fs.rmSync(folderPath, { recursive: true, force: true });
                        console.log(`[JobQueue] Cleaned up temporary build workspace: ${folder}`);
                    }
                }
            }

            // Clean up uploads/temp folder older than retention threshold
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtimeMs < (Date.now() - retentionMs)) {
                        fs.unlinkSync(filePath);
                        console.log(`[JobQueue] Cleaned up orphaned temporary upload: ${file}`);
                    }
                }
            }

        } catch (err) {
            console.error("[JobQueue] Auto-Cleanup failed:", err.message);
        }
    }
}

export const jobQueue = new AppJobQueue();
