import mongoose from 'mongoose';
import CustomDomainRequest from '../models/CustomDomainRequest.js';
import deploymentProvider from './deploymentProvider.js';
import Notification from '../models/Notification.js';

class DomainMonitor {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pollInterval = parseInt(process.env.RAILWAY_POLL_INTERVAL) || 60000;
    this.batchSize = parseInt(process.env.RAILWAY_BATCH_SIZE) || 10;
    this.retryDelay = parseInt(process.env.RAILWAY_RETRY_DELAY_MS) || 2000;
    this.maxStaleHours = parseInt(process.env.RAILWAY_MAX_STALE_HOURS) || 72;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[DomainMonitor] Starting. Interval: ${this.pollInterval}ms, Batch: ${this.batchSize}`);
    this.checkDeployments();
    this.intervalId = setInterval(() => this.checkDeployments(), this.pollInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[DomainMonitor] Stopped automated background deployment monitor.');
  }

  async checkDeployments() {
    try {
      const pendingRequests = await CustomDomainRequest.find({
        status: { $in: ['Website Deployment', 'SSL Activation', 'Domain Verification'] },
        provider: 'railway',
        deploymentStatus: { $ne: 'Completed' }
      }).limit(this.batchSize).populate('resellerId');

      if (pendingRequests.length === 0) return;

      console.log(`[DomainMonitor] Batch processing ${pendingRequests.length} deployments...`);

      for (const req of pendingRequests) {
        await this.processRequest(req);
        // Throttle slightly between requests to respect rate limits
        await new Promise(res => setTimeout(res, 500));
      }
    } catch (error) {
      console.error('[DomainMonitor] Error in monitoring cycle:', error);
    }
  }

  async processRequest(req) {
    const deploymentId = req._id.toString();
    const domain = req.domainName.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    const tenantId = req.resellerId ? req.resellerId._id.toString() : 'UNKNOWN';
    const logPrefix = `[DeployID: ${deploymentId} | Tenant: ${tenantId} | Domain: ${domain}]`;

    try {
      // 1. Timeout / Stale Check (Automatic Cleanup)
      const hoursSinceUpdated = (Date.now() - new Date(req.updatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdated > this.maxStaleHours) {
         console.warn(`${logPrefix} Stale deployment. Abandoning monitor lock.`);
         req.status = 'Failed / Needs Correction';
         req.deploymentStatus = 'Failed';
         req.adminNotes = `Deployment timed out after ${this.maxStaleHours} hours. Please check DNS.`;
         await req.save();
         await this.notifyUser(req, 'Deployment Timeout', `The deployment for ${domain} timed out. Please verify DNS records.`);
         return;
      }

      const statusData = await deploymentProvider.getDomainStatus(domain);

      if (!statusData) {
        console.warn(`${logPrefix} Not found on Railway provider.`);
        return;
      }

      let updated = false;

      const providerStatus = statusData.status; // e.g., "DNS_VERIFYING", "ACTIVE", "ERROR"
      const sslStatus = statusData.sslStatus; // e.g., "PENDING", "ISSUING", "ACTIVE", "ERROR"
      
      const states = {
          'Website Deployment': 1,
          'SSL Activation': 2,
          'Connected Successfully': 3
      };
      
      const currentStateWeight = states[req.status] || 0;

      // 2. State Machine: DNS Verified (Forward only)
      if (providerStatus === 'ACTIVE' && currentStateWeight < 2) {
        req.status = 'SSL Activation';
        req.lifecycleStatus = 'DNS Verified';
        updated = true;
        console.log(`${logPrefix} DNS Propagated. Moving to SSL Activation.`);
        await this.notifyUser(req, 'DNS Verified', `The DNS records for ${domain} have propagated successfully. We are now provisioning your SSL certificate.`);
      }

      // 3. State Machine: SSL Active (Forward only)
      if (sslStatus === 'ACTIVE' && currentStateWeight < 3) {
        req.sslStatus = 'Active';
        req.status = 'Connected Successfully';
        req.lifecycleStatus = 'Live';
        req.deploymentStatus = 'Completed';
        updated = true;
        console.log(`${logPrefix} SSL Provisioned. Deployment Complete.`);
        
        if (req.resellerId) {
          req.resellerId.customDomain = domain;
          await req.resellerId.save();
        }

        await this.notifyUser(req, 'Website Live!', `Congratulations! Your custom domain ${domain} is now live and secured with SSL.`);
      } else if (sslStatus && req.sslStatus !== sslStatus && req.sslStatus !== 'Active') {
        req.sslStatus = sslStatus;
        updated = true;
      }

      // 4. Update DNS requirements visually
      if (statusData.dnsRecords && statusData.dnsRecords.length > 0) {
        const currentRecords = JSON.stringify(req.metaData?.dnsRecords || []);
        const newRecords = JSON.stringify(statusData.dnsRecords);
        if (currentRecords !== newRecords) {
          req.metaData = { ...req.metaData, dnsRecords: statusData.dnsRecords };
          req.markModified('metaData');
          updated = true;
        }
      }

      // 5. Hard Failures
      if (providerStatus === 'ERROR' || sslStatus === 'ERROR') {
        req.status = 'Failed / Needs Correction';
        req.lifecycleStatus = 'Deployment Failed';
        req.deploymentStatus = 'Failed';
        req.correctionRequired = true;
        updated = true;
        console.error(`${logPrefix} Provider ERROR encountered.`);
        await this.notifyUser(req, 'Deployment Failed', `There was an issue deploying ${domain}. Please check your DNS records or contact support.`);
      }

      if (updated) {
        await req.save();
      }

    } catch (error) {
      console.error(`${logPrefix} Processing error:`, error.message);
    }
  }

  async notifyUser(req, title, message) {
    if (!req.resellerId) return;
    try {
      await Notification.create({
        userId: req.resellerId._id,
        title: title,
        message: message,
        type: 'system',
        isRead: false
      });
    } catch (err) {
      console.error('[DomainMonitor] Error sending notification:', err);
    }
  }
}

export default new DomainMonitor();
