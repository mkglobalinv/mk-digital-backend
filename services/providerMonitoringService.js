import axios from 'axios';
import ProviderStatus from '../models/ProviderStatus.js';
import Transaction from '../models/Transaction.js';
import { fetchPeyflexUserProfile } from './providers/peyflex.js';
import { getReloadlyAccessToken } from './reloadlyAuth.js';
import { fetchBillsplashBalance } from './providers/billsplash.js';
import { sendEmail } from './emailService.js';

/**
 * Seed default provider status records if they do not exist
 */
const seedProviders = async () => {
  const defaultProviders = [
    { providerName: 'peyflex',      warningThreshold: 50000, criticalThreshold: 10000, pauseThreshold: 2000 },
    { providerName: 'clubkonnect',  warningThreshold: 50000, criticalThreshold: 10000, pauseThreshold: 2000 },
    { providerName: 'reloadly',     warningThreshold: 50,    criticalThreshold: 10,    pauseThreshold: 2    }, // USD for Reloadly
    { providerName: 'billsplash',   warningThreshold: 5000,  criticalThreshold: 1000,  pauseThreshold: 500  }
  ];

  for (const p of defaultProviders) {
    const exists = await ProviderStatus.findOne({ providerName: p.providerName });
    if (!exists) {
      await ProviderStatus.create(p);
      console.log(`[Monitoring] Seeded default provider config for ${p.providerName}`);
    }
  }
};

/**
 * Fetch ClubKonnect balance via legacy nellobytes API
 */
const fetchClubKonnectBalance = async () => {
  const UserID = process.env.CLUBKONNECT_USERID;
  const APIKey = process.env.CLUBKONNECT_API_KEY;
  if (!UserID || !APIKey) {
    throw new Error("ClubKonnect UserID or APIKey missing in environment variables");
  }

  // nellobytesystems.com expects exact PascalCase parameters: UserID and APIKey
  const response = await axios.get("https://www.nellobytesystems.com/APIWalletBalanceV1.asp", {
    params: { UserID, APIKey },
    timeout: 30000
  });

  const data = response.data;
  let balanceVal = null;
  if (typeof data === 'object' && data !== null) {
    balanceVal = data.balance;
  } else if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      balanceVal = parsed.balance;
    } catch (e) {
      balanceVal = data.trim();
    }
  }

  const balance = parseFloat(balanceVal);
  if (isNaN(balance)) {
    throw new Error(`Failed to parse balance from ClubKonnect response: ${JSON.stringify(data)}`);
  }
  return balance;
};

/**
 * Fetch Reloadly balance
 */
const fetchReloadlyBalance = async () => {
  const token = await getReloadlyAccessToken();
  const baseUrl = process.env.RELOADLY_BASE_URL || 'https://topups.reloadly.com';
  
  const response = await axios.get(`${baseUrl}/accounts/balance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/com.reloadly.topups-v1+json'
    },
    timeout: 15000
  });

  const balance = parseFloat(response.data?.balance);
  if (isNaN(balance)) {
    throw new Error(`Failed to parse balance from Reloadly response: ${JSON.stringify(response.data)}`);
  }
  return balance;
};

let lastSpikeAlertSent = null;

/**
 * Check for failed/pending transaction spikes and alert admin
 */
const checkTransactionSpikes = async () => {
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const failedCount = await Transaction.countDocuments({
      status: 'failed',
      createdAt: { $gte: fiveMinsAgo }
    });

    const pendingCount = await Transaction.countDocuments({
      status: 'pending',
      createdAt: { $gte: fiveMinsAgo }
    });

    console.log(`[Monitoring] Transaction check: Failed (5m)=${failedCount}, Pending (5m)=${pendingCount}`);

    if (failedCount > 10 || pendingCount > 15) {
      const cooldown = 15 * 60 * 1000; // 15 mins cooldown
      if (!lastSpikeAlertSent || (now - lastSpikeAlertSent) > cooldown) {
        const adminEmail = process.env.ADMIN_EMAIL || "mksubdata@gmail.com";
        const subject = `🚨 High Transaction Failure Rate Detected`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2;">
            <h2 style="color: #ef4444; text-align: center; margin-top: 0;">🚨 High Transaction Failure Rate Detected</h2>
            <p>The platform detected an unusual number of failed/pending transactions within the last 5 minutes.</p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Failed Transactions (Last 5m):</strong> ${failedCount}</p>
              <p style="margin: 5px 0;"><strong>Pending Transactions (Last 5m):</strong> ${pendingCount}</p>
            </div>
            <p><strong>Possible Causes:</strong></p>
            <ul>
              <li>provider maintenance</li>
              <li>insufficient provider balance</li>
              <li>API instability</li>
            </ul>
            <p style="color: #b91c1c; font-weight: bold; margin-top: 15px;">Immediate investigation recommended.</p>
            <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fee2e2; padding-top: 15px; margin-top: 20px;">
              MKSubData Ecosystem Telemetry • ${now.toLocaleString()}
            </p>
          </div>
        `;
        await sendEmail(adminEmail, subject, html);
        lastSpikeAlertSent = now;
        console.log(`[Monitoring] Sent High Transaction Failure Rate Alert to ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error("[Monitoring] checkTransactionSpikes error:", err.message);
  }
};

/**
 * Poll individual provider status
 */
const pollProvider = async (providerName) => {
  let balance = 0;
  let isOnline = false;
  let errorMsg = null;
  let latency = 0;
  let isMaintenance = false;

  const startTime = Date.now();
  try {
    if (providerName === 'peyflex') {
      const profile = await fetchPeyflexUserProfile();
      latency = Date.now() - startTime;
      if (profile.success && profile.data) {
        balance = parseFloat(profile.data.wallet_credit);
        isOnline = !isNaN(balance);
        if (isNaN(balance)) errorMsg = "wallet_credit key parsed to NaN";
      } else {
        errorMsg = profile.message || "Failed to fetch user profile";
        if (errorMsg && (errorMsg.toLowerCase().includes('maintenance') || errorMsg.toLowerCase().includes('temp unavailable'))) {
          isMaintenance = true;
        }
      }
    } else if (providerName === 'clubkonnect') {
      balance = await fetchClubKonnectBalance();
      latency = Date.now() - startTime;
      isOnline = true;
    } else if (providerName === 'reloadly') {
      balance = await fetchReloadlyBalance();
      latency = Date.now() - startTime;
      isOnline = true;
    } else if (providerName === 'billsplash') {
      balance = await fetchBillsplashBalance();
      latency = Date.now() - startTime;
      isOnline = true;
    }
  } catch (err) {
    latency = Date.now() - startTime;
    errorMsg = err.message;
    if (errorMsg && (errorMsg.toLowerCase().includes('maintenance') || errorMsg.toLowerCase().includes('temp unavailable') || errorMsg.toLowerCase().includes('service unavailable') || errorMsg.toLowerCase().includes('503'))) {
      isMaintenance = true;
    }
  }

  const provider = await ProviderStatus.findOne({ providerName });
  if (!provider) return;

  const now = new Date();
  provider.lastUpdated = now;
  provider.latency = latency;

  const adminEmail = process.env.ADMIN_EMAIL || "mksubdata@gmail.com";
  const currencySymbol = providerName === 'reloadly' ? '$' : '₦';

  if (isOnline) {
    // Reset notification states if balance has recovered
    if (balance > 0) provider.lastExhaustedAlertSent = null;
    if (balance >= provider.criticalThreshold) provider.lastCriticalAlertSent = null;
    if (balance >= provider.warningThreshold) provider.lastAlertSent = null;

    provider.balance = balance;
    provider.failureCount = 0;
    provider.lastSuccessfulConnection = now;
    provider.isUnderMaintenance = false;

    // Set apiStatus based on thresholds
    if (balance <= 0) {
      provider.isAvailable = false;
      provider.apiStatus = 'disconnected';
      console.warn(`[Monitoring] Hard blocked provider ${providerName} due to wallet fully exhausted (balance: ${balance})`);

      const cd = 15 * 60 * 1000;
      if (!provider.lastExhaustedAlertSent || (now - provider.lastExhaustedAlertSent) > cd) {
        const subject = `🚨 CRITICAL — Provider Wallet Fully Exhausted`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 3px solid #b91c1c; border-radius: 12px; background-color: #fef2f2;">
            <h2 style="color: #b91c1c; text-align: center; margin-top: 0;">🚨 CRITICAL — Wallet Fully Exhausted</h2>
            <p>Your provider wallet <strong>${providerName.toUpperCase()}</strong> is fully exhausted (balance is 0 or negative).</p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName.toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Remaining Balance:</strong> ${currencySymbol}${balance}</p>
            </div>
            <p style="color: #b91c1c; font-weight: bold; margin-top: 15px;">Transactions have been temporarily disabled through this provider.</p>
            <p style="font-weight: bold;">Please fund the wallet immediately.</p>
            <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fee2e2; padding-top: 15px; margin-top: 20px;">
              MKSubData Ecosystem Telemetry • ${now.toLocaleString()}
            </p>
          </div>
        `;
        await sendEmail(adminEmail, subject, html);
        provider.lastExhaustedAlertSent = now;
        console.log(`[Monitoring] Sent Critical Fully Exhausted Email Alert for ${providerName}`);
      }
    } else {
      provider.isAvailable = !provider.manualDisabled;

      if (balance < provider.criticalThreshold) {
        provider.apiStatus = 'critical';

        const cd = 8 * 60 * 60 * 1000; // 8 hours cooldown
        if (!provider.lastCriticalAlertSent || (now - provider.lastCriticalAlertSent) > cd) {
          const subject = `🚨 CRITICAL — Provider Wallet Balance Very Low`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2;">
              <h2 style="color: #ef4444; text-align: center; margin-top: 0;">🚨 CRITICAL — Provider Wallet Balance Very Low</h2>
              <p>Your provider wallet balance is extremely low, but transactions are still active.</p>
              <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName.toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Remaining Balance:</strong> ${currencySymbol}${balance.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Critical Threshold:</strong> ${currencySymbol}${provider.criticalThreshold.toLocaleString()}</p>
              </div>
              <p>Customers are still allowed to attempt transactions. Please fund immediately to prevent failures.</p>
              <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fee2e2; padding-top: 15px; margin-top: 20px;">
                MKSubData Ecosystem Telemetry • ${now.toLocaleString()}
              </p>
            </div>
          `;
          await sendEmail(adminEmail, subject, html);
          provider.lastCriticalAlertSent = now;
          console.log(`[Monitoring] Sent Critical Low Balance Email Alert for ${providerName}`);
        }
      } else if (balance < provider.warningThreshold) {
        provider.apiStatus = 'warning';

        const cd = 8 * 60 * 60 * 1000; // 8 hours cooldown
        if (!provider.lastAlertSent || (now - provider.lastAlertSent) > cd) {
          const subject = `🚨 Provider Balance Low Warning`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #f59e0b; border-radius: 12px; background-color: #fffbeb;">
              <h2 style="color: #d97706; text-align: center; margin-top: 0;">🚨 Provider Balance Low Warning</h2>
              <p>Your provider wallet balance is becoming low.</p>
              <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName.toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Remaining Balance:</strong> ${currencySymbol}${balance.toLocaleString()}</p>
              </div>
              <p>Please fund immediately to avoid failed transactions or customer complaints.</p>
              <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fef3c7; padding-top: 15px; margin-top: 20px;">
                MKSubData Ecosystem Telemetry • Time: ${now.toLocaleString()}
              </p>
            </div>
          `;
          await sendEmail(adminEmail, subject, html);
          provider.lastAlertSent = now;
          console.log(`[Monitoring] Sent Warning Low Balance Email Alert for ${providerName}`);
        }
      } else {
        provider.apiStatus = 'healthy';
      }
    }
  } else {
    // API status is Offline / Disconnected
    // Cap at threshold (3) to prevent unbounded growth (e.g. 834 after weeks offline)
    const FAILURE_CAP = 3;
    provider.failureCount = Math.min((provider.failureCount || 0) + 1, FAILURE_CAP);
    provider.isUnderMaintenance = isMaintenance;

    if (isMaintenance) {
      provider.apiStatus = 'critical';
      provider.isAvailable = false;
      const lastEvent = provider.maintenanceEvents[provider.maintenanceEvents.length - 1];
      const timeDiff = lastEvent ? (now - new Date(lastEvent.timestamp)) : Infinity;
      if (timeDiff > 10 * 60 * 1000) {
        provider.maintenanceEvents.push({ timestamp: now, issue: `Maintenance: ${errorMsg || 'Provider returned maintenance response'}` });
        if (provider.maintenanceEvents.length > 50) provider.maintenanceEvents.shift();
      }
    } else if (provider.failureCount >= 3) {
      provider.apiStatus = 'disconnected';
      provider.isAvailable = false;
    } else {
      provider.apiStatus = 'warning';
      provider.isAvailable = !provider.manualDisabled; // Still available until failure 3
    }

    console.error(`[Monitoring] Provider ${providerName} is OFFLINE: ${errorMsg} (Consecutive failures: ${provider.failureCount})`);

    // Offline / Maintenance Alert
    if (isMaintenance || provider.failureCount >= 3) {
      const cd = 8 * 60 * 60 * 1000; // 8 hours cooldown (max 3 times a day)
      if (!provider.lastOfflineAlertSent || (now - provider.lastOfflineAlertSent) > cd) {
        const subject = `🚨 Provider API Offline`;
        const issueDetails = isMaintenance ? 'maintenance response' : (errorMsg?.toLowerCase().includes('timeout') ? 'API timeout' : 'connection failure');
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #ef4444; border-radius: 12px; background-color: #fef2f2;">
            <h2 style="color: #ef4444; text-align: center; margin-top: 0;">🚨 Provider API Offline</h2>
            <p>The provider API appears unavailable or under maintenance.</p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Affected Provider:</strong> ${providerName.toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Detected Issues:</strong></p>
              <ul>
                <li>${issueDetails}</li>
              </ul>
              <p style="margin: 5px 0;"><strong>Affected Services:</strong></p>
              <ul>
                <li>Data Purchase</li>
                <li>Airtime</li>
              </ul>
            </div>
            <p style="color: #b91c1c; font-weight: bold; margin-top: 15px;">Customers may experience failures temporarily.</p>
            <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fee2e2; padding-top: 15px; margin-top: 20px;">
              MKSubData Ecosystem Telemetry • ${now.toLocaleString()}
            </p>
          </div>
        `;
        await sendEmail(adminEmail, subject, html);
        provider.lastOfflineAlertSent = now;
        console.log(`[Monitoring] Sent Offline/Maintenance Alert Email for ${providerName}`);
      }
    }
  }

  await provider.save();
};

/**
 * Main polling function loop
 */
export const pollProviders = async () => {
  try {
    await seedProviders();
    await Promise.all([
      pollProvider('peyflex'),
      pollProvider('clubkonnect'),
      pollProvider('reloadly'),
      pollProvider('billsplash')
    ]);
    await checkTransactionSpikes();
  } catch (err) {
    console.error("[Monitoring] pollProviders global error:", err.message);
  }
};


/**
 * Start the polling interval
 */
export const startProviderMonitoring = () => {
  console.log("[Monitoring] Starting Provider Balance Monitoring (Interval: 1 min)...");
  pollProviders(); // Run immediately
  setInterval(pollProviders, 60000);
};

/**
 * Check if the chosen provider route is currently healthy and active.
 * Evaluates failovers to keep transactions going if one of the providers is online.
 */
export const checkProviderAvailability = async (serviceType, network, option = 'smart', countryCode = 'NG') => {
  // If sandbox mode, skip checks
  if (option === 'sandbox') return true;

  const isOk = (prov) => {
    if (!prov) return true;
    return prov.isAvailable && 
           prov.apiStatus !== 'disconnected' && 
           prov.apiStatus !== 'offline' && 
           !prov.isUnderMaintenance;
  };

  // 1. Check if reloadly is needed (international)
  if (countryCode && countryCode.toUpperCase() !== 'NG') {
    const reloadly = await ProviderStatus.findOne({ providerName: 'reloadly' });
    return isOk(reloadly);
  }

  // 2. Check if service is clubkonnect-only
  const type = String(serviceType).toLowerCase();
  if (['cable', 'electricity', 'epin', 'education'].includes(type)) {
    const clubkonnect = await ProviderStatus.findOne({ providerName: 'clubkonnect' });
    return isOk(clubkonnect);
  }

  const opt = String(option || 'smart').toLowerCase();
  const primaryName = opt === 'value' ? 'clubkonnect' : 'peyflex';
  const secondaryName = opt === 'value' ? 'peyflex' : 'clubkonnect';

  const [primary, secondary] = await Promise.all([
    ProviderStatus.findOne({ providerName: primaryName }),
    ProviderStatus.findOne({ providerName: secondaryName })
  ]);

  // Check primary
  if (isOk(primary)) return true;

  // Fallback to secondary
  if (isOk(secondary)) {
    console.log(`[Safety Guard] Primary provider (${primaryName}) is offline/insufficient. Failover to ${secondaryName} is available.`);
    return true;
  }

  console.warn(`[Safety Guard] Both primary (${primaryName}) and failover (${secondaryName}) providers are unavailable.`);
  return false;
};

/**
 * Activate hard block for a provider (disable provider and set status to disconnected)
 */
export const activateHardBlock = async (providerName, reason) => {
  try {
    const provider = await ProviderStatus.findOne({ providerName });
    if (provider && provider.isAvailable) {
      provider.isAvailable = false;
      provider.apiStatus = 'disconnected';
      const now = new Date();
      provider.maintenanceEvents.push({ timestamp: now, issue: `Hard Blocked: ${reason}` });
      if (provider.maintenanceEvents.length > 50) provider.maintenanceEvents.shift();
      await provider.save();
      console.warn(`[Hard Block] Activated hard block on ${providerName}. Reason: ${reason}`);

      // Send urgent alert email to admin
      const adminEmail = process.env.ADMIN_EMAIL || "mksubdata@gmail.com";
      const subject = `🚨 HARD BLOCK ACTIVATED — ${providerName.toUpperCase()} disabled`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 3px solid #b91c1c; border-radius: 12px; background-color: #fef2f2;">
          <h2 style="color: #b91c1c; text-align: center; margin-top: 0;">🚨 HARD BLOCK ACTIVATED</h2>
          <p>The provider <strong>${providerName.toUpperCase()}</strong> has been automatically disabled (Hard Blocked) due to a confirmed transaction execution failure.</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 5px 0;"><strong>Action Taken:</strong> Temporarily disabled purchases through this provider.</p>
          </div>
          <p style="color: #b91c1c; font-weight: bold;">Please resolve the issue or fund the account, then re-enable the provider in the Admin Dashboard.</p>
          <p style="font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #fee2e2; padding-top: 15px; margin-top: 20px;">
            MKSubData Ecosystem Telemetry • ${now.toLocaleString()}
          </p>
        </div>
      `;
      await sendEmail(adminEmail, subject, html);
    }
  } catch (err) {
    console.error(`[Hard Block Error] Failed to activate hard block for ${providerName}:`, err.message);
  }
};

/**
 * Handle a transaction failure by checking if it matches the confirmed hard block conditions
 */
export const handleProviderTransactionFailure = async (providerName, errorMessage) => {
  try {
    const provider = await ProviderStatus.findOne({ providerName });
    if (!provider) return;

    provider.failureCount = (provider.failureCount || 0) + 1;
    await provider.save();

    const msg = String(errorMessage || "").toLowerCase();
    const isInsufficient = msg.includes("insufficient") || msg.includes("balance") || msg.includes("exhausted") || msg.includes("empty");
    const isOfflineOrMaint = msg.includes("maintenance") || msg.includes("offline") || msg.includes("unavailable") || msg.includes("503") || msg.includes("connection failed");
    const isRepeated = provider.failureCount >= 3;

    if (isInsufficient || isOfflineOrMaint || isRepeated) {
      let reason = "Transaction execution failed";
      if (isInsufficient) reason = `Insufficient balance (${errorMessage})`;
      else if (isOfflineOrMaint) reason = `Provider offline/maintenance (${errorMessage})`;
      else if (isRepeated) reason = `Repeated transaction failures (${provider.failureCount} consecutive failures)`;

      await activateHardBlock(providerName, reason);
    }
  } catch (err) {
    console.error(`[handleProviderTransactionFailure Error]`, err.message);
  }
};

/**
 * Handle a successful transaction by resetting failure count
 */
export const handleProviderTransactionSuccess = async (providerName) => {
  try {
    await ProviderStatus.updateOne({ providerName }, { $set: { failureCount: 0 } });
  } catch (err) {
    console.error(`[handleProviderTransactionSuccess Error]`, err.message);
  }
};

/**
 * Admin reset: zero out the failure counter and restore apiStatus to online for a provider.
 * Used to clear stale counters accumulated while a provider was long-offline.
 */
export const resetProviderFailures = async (providerName) => {
  try {
    const provider = await ProviderStatus.findOne({ providerName });
    if (!provider) throw new Error(`Provider not found: ${providerName}`);

    provider.failureCount = 0;
    // Only clear disconnected status — don't interfere with manual disables
    if (provider.apiStatus === 'disconnected' && !provider.manualDisabled) {
      provider.apiStatus = 'critical'; // Keep flagged but unblock the counter reset
    }
    await provider.save();
    console.log(`[Monitoring] Admin reset failure counter for ${providerName}`);
    return { success: true, providerName, failureCount: 0 };
  } catch (err) {
    console.error(`[resetProviderFailures Error]`, err.message);
    throw err;
  }
};

