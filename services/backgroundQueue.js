class BackgroundQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    /**
     * Push a task to the queue for background execution
     */
    push(type, data) {
        this.queue.push({ type, data, attempts: 0 });
        console.log(`[BackgroundQueue] Task enqueued: ${type}`);
        // Defer processing to avoid blocking current execution stack
        setImmediate(() => this.process());
    }

    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        const job = this.queue.shift();
        try {
            await this.executeJob(job);
            console.log(`[BackgroundQueue] Task completed successfully: ${job.type}`);
        } catch (err) {
            console.error(`[BackgroundQueue Error] Task execution failed: ${job.type} | Error:`, err.message);
            job.attempts += 1;
            if (job.attempts < 3) {
                console.log(`[BackgroundQueue] Retrying task: ${job.type} (Attempt ${job.attempts}/3)`);
                // Re-enqueue with exponential backoff back to the queue
                setTimeout(() => {
                    this.queue.push(job);
                    this.process();
                }, job.attempts * 5000);
            } else {
                console.error(`[BackgroundQueue Critical] Task permanently failed: ${job.type} after max attempts.`);
            }
        } finally {
            this.isProcessing = false;
            // Schedule next task execution
            setImmediate(() => this.process());
        }
    }

    async executeJob(job) {
        const { type, data } = job;
        
        switch (type) {
            case 'EMAIL': {
                const { sendEmail } = await import('./emailService.js');
                await sendEmail(data.to, data.subject, data.html);
                break;
            }
            case 'NOTIFICATION': {
                const { default: Notification } = await import('../models/Notification.js');
                await Notification.create(data);
                break;
            }
            case 'SYSTEM_NOTIFICATION': {
                const { default: SystemNotification } = await import('../models/SystemNotification.js');
                await SystemNotification.create(data);
                break;
            }
            case 'AUDIT_LOG': {
                const { default: AdminLog } = await import('../models/AdminLog.js');
                await AdminLog.create(data);
                break;
            }
            case 'SYNC_LEDGER': {
                const { syncLedgerToMongo, insertLedgerEntry } = await import('./supabaseLedger.js');
                if (data.insertEntry) {
                    await insertLedgerEntry(
                        data.userId,
                        data.amount,
                        data.ledgerType,
                        data.walletType,
                        data.reference,
                        data.description
                    );
                }
                await syncLedgerToMongo(data.userId);
                break;
            }
            case 'ANALYTICS_UPDATE': {
                const { syncDailyAnalytics } = await import('./supabaseAnalytics.js');
                await syncDailyAnalytics(data.date, data.resellerId);
                break;
            }
            case 'EMAIL_CAMPAIGN': {
                const { sendEmail } = await import('./emailService.js');
                const { default: ResellerEmailCampaign } = await import('../models/ResellerEmailCampaign.js');
                const { default: User } = await import('../models/User.js');
                
                const campaign = await ResellerEmailCampaign.findById(data.campaignId);
                if (!campaign) return;
                
                // Duplicate Protection: Only execute if pending
                if (campaign.status !== 'pending') {
                    console.log(`[EMAIL_CAMPAIGN] Skipping campaign ${campaign._id} because status is ${campaign.status}`);
                    return;
                }
                
                campaign.status = 'processing';
                campaign.startedAt = new Date();
                await campaign.save();
                
                try {
                    // Fetch users in batches or just stream (we'll use find since we assume it fits in memory for a reseller)
                    const users = await User.find(data.query).select('email name');
                    let successCount = 0;
                    let failedCount = 0;
                    
                    for (const user of users) {
                        if (!user.email) {
                            failedCount++;
                            continue;
                        }
                        const success = await sendEmail(user.email, data.subject, data.html);
                        if (success) successCount++;
                        else failedCount++;
                    }
                    
                    campaign.successCount = successCount;
                    campaign.failedCount = failedCount;
                    campaign.status = 'completed';
                    campaign.completedAt = new Date();
                    await campaign.save();
                } catch (err) {
                    console.error('[EMAIL_CAMPAIGN] Error executing campaign', err);
                    campaign.status = 'failed';
                    campaign.completedAt = new Date();
                    await campaign.save();
                }
                break;
            }
            case 'IN_APP_CAMPAIGN': {
                const { default: ResellerNotificationCampaign } = await import('../models/ResellerNotificationCampaign.js');
                const { default: User } = await import('../models/User.js');
                const { default: Notification } = await import('../models/Notification.js');
                
                const campaign = await ResellerNotificationCampaign.findById(data.campaignId);
                if (!campaign) return;
                
                if (campaign.status !== 'pending') {
                    console.log(`[IN_APP_CAMPAIGN] Skipping campaign ${campaign._id} because status is ${campaign.status}`);
                    return;
                }
                
                campaign.status = 'processing';
                campaign.startedAt = new Date();
                await campaign.save();
                
                try {
                    const users = await User.find(data.query).select('_id');
                    let successCount = 0;
                    let failedCount = 0;
                    
                    const typeMap = {
                        'Announcement': 'system',
                        'Promotion': 'success',
                        'Maintenance': 'warning',
                        'Information': 'system'
                    };
                    const mappedType = typeMap[data.notificationType] || 'system';

                    for (const user of users) {
                        try {
                            await Notification.create({
                                userId: user._id,
                                title: data.title,
                                message: data.message,
                                type: mappedType
                            });
                            successCount++;
                        } catch (err) {
                            failedCount++;
                        }
                    }
                    
                    campaign.successCount = successCount;
                    campaign.failedCount = failedCount;
                    campaign.status = 'completed';
                    campaign.completedAt = new Date();
                    await campaign.save();
                } catch (err) {
                    console.error('[IN_APP_CAMPAIGN] Error executing campaign', err);
                    campaign.status = 'failed';
                    campaign.completedAt = new Date();
                    await campaign.save();
                }
                break;
            }
            default:
                throw new Error(`Unknown background queue task type: ${type}`);
        }
    }
}

export default new BackgroundQueue();
